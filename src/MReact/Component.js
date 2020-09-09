import * as _ from "./util";
import {
  renderComponent,
  clearPending,
  compareTwoVnodes,
  getChildContext,
  syncCache,
} from "./virtual-dom";

// 全局更新队列批处理
export let updateQueue = {
  updaters: [], // 所有的更新器会放入这里
  isPending: false,
  add(updater) {
    this.updaters.push(updater);
  },
  /**
   * 当需要工作的时候，很简单直接遍历循环更新updateComponent，类型vue dep通知watch update
   */
  batchUpdate() {
    if (this.isPending) {
      // 非稳定状态下不去处理队列 说明有正在进行的更新
      return;
    }
    this.isPending = true;
    let { updaters } = this;
    let updater;
    while ((updater = updaters.pop())) {
      updater.updateComponent();
    }
    this.isPending = false;
  },
};

class Updater {
  constructor(instance) {
    this.instance = instance; // 组件实例instance
    this.pendingStates = []; // 待处理状态数组
    this.pendingCallbacks = []; // 待处理回调函数数组
    this.isPending = false;
    this.nextProps = this.nextContext = null;
    this.clearCallbacks = this.clearCallbacks.bind(this);
  }
  //
  /**
   * emitUpdate是怎么做更新的呢？
   * 1、最新的属性（nextProps）, 最新的上下文（nextContext）：属性上下文，是否有父组件传过来的更新之间走updateComponent
   * 2、其它情况比如组件自己的更新（setState）行为会把自己添加到updateQueue更新队列中，类型vue中dep行为
   */
  emitUpdate(nextProps, nextContext) {
    this.nextProps = nextProps;
    this.nextContext = nextContext;
    // receive nextProps!! should update immediately
    nextProps || !updateQueue.isPending
      ? this.updateComponent()
      : updateQueue.add(this);
    /**
     * 所有的更新操作会updateQueue队列里面去，最终都会执行updateQueue里面batchUpdate
     */
  }
  /**
   * 类似vue里面的watch update函数
   * instance组件实例关联到Updater更新器
   * 更新到状态pendingStates
   * 更新到属性nextProps
   * 更新到上下文nextContext
   * 更新回调函数
   */
  updateComponent() {
    let { instance, pendingStates, nextProps, nextContext } = this;
    if (nextProps || pendingStates.length > 0) {
      nextProps = nextProps || instance.props;
      nextContext = nextContext || instance.context;
      this.nextProps = this.nextContext = null;
      // 判断下是否应该更新 getState()方法 合并所有的state的数据，一次更新
      shouldUpdate(
        instance,
        nextProps,
        this.getState(),
        nextContext,
        this.clearCallbacks
      );
    }
  }
  addState(nextState) {
    if (nextState) {
      /**
       * 有新的状态对象做的事情，先存入pendingStates数组里，为了待会批量处理
       * isPending是否被挂起，是否有正在工作，没有则提交更新，
       * 譬如说：这个组件在react整个第一次初始化的时候，所有组件都要去干活，那个时候所有组件的状态都是Pending true状态，等待所有初始化完成以后Pending false状态处于稳定状态；
       * 通常情况下组件是处于稳定状态，当通过事件的方式激活setState就会把isPending打开，然后会提交emitUpdate
       */
      this.pendingStates.push(nextState);
      if (!this.isPending) {
        this.emitUpdate();
      }
    }
  }
  /**
   * 批量行为pendingStates.forEach遍历
   */
  getState() {
    // 组件实例，待更新状态
    let { instance, pendingStates } = this;
    // 从组件实例中拿出之前old state和old props
    let { state, props } = instance;
    if (pendingStates.length) {
      state = { ...state }; // 首先copy一份之前到状态
      // setState([foo])
      // setState({foo:'foo'})
      // setState({bar:'bar'})
      // setState((nextState, nextProps)=>({foo: nextState.foo+'foo'}))
      pendingStates.forEach((nextState) => {
        // 如果是数组则做替换
        let isReplace = _.isArr(nextState);
        if (isReplace) {
          nextState = nextState[0];
        }
        // 如果传递的是函数
        if (_.isFn(nextState)) {
          nextState = nextState.call(instance, state, props);
        }
        // replace state
        if (isReplace) {
          state = { ...nextState };
        } else {
          state = { ...state, ...nextState };
        }
      });
      pendingStates.length = 0;
    }
    return state;
  }
  clearCallbacks() {
    let { pendingCallbacks, instance } = this;
    if (pendingCallbacks.length > 0) {
      this.pendingCallbacks = [];
      pendingCallbacks.forEach((callback) => callback.call(instance));
    }
  }
  addCallback(callback) {
    if (_.isFn(callback)) {
      this.pendingCallbacks.push(callback);
    }
  }
}

export default class Component {
  static isReactComponent = {};
  /**
   * 构造函数初始化
   * @param {*} props
   * @param {*} context
   */
  constructor(props, context) {
    /**
     * 创建一个更新器实例，每一个组件都会创建一个更新器
     * 类似vue里面watch，可以猜出Updater的作用也是watch的作用，就是负责当前组件更新
     */
    this.$updater = new Updater(this);
    this.$cache = { isMounted: false };
    this.props = props;
    this.state = {};
    this.refs = {};
    this.context = context;
  }
  /**
   * 强制组件更新
   * 实际更新组件的函数
   * @param {*} callback
   */
  forceUpdate(callback) {
    let { $updater, $cache, props, state, context } = this;
    if (!$cache.isMounted) {
      return;
    }
    if ($updater.isPending) { // 如果当前正在更新不做处理，只追加到组件相关的updater更新器里
      $updater.addState(state);
      return;
    }
    let nextProps = $cache.props || props;
    let nextState = $cache.state || state;
    let nextContext = $cache.context || context;
    let parentContext = $cache.parentContext;
    let node = $cache.node; // 上次执行dom
    let vnode = $cache.vnode; // 上次执行vdom
    // 缓存清空
    $cache.props = $cache.state = $cache.context = null;
    // 表示开始更新操作，批量的不允许其它再进来，再来的只会添加到updater更新器里
    $updater.isPending = true;
    if (this.componentWillUpdate) { // componentWillUpdate生命周期
      this.componentWillUpdate(nextProps, nextState, nextContext);
    }
    this.state = nextState;
    this.props = nextProps;
    this.context = nextContext;

    /**
     * 对比vnode
     * diff和patch发生在这里
     */
    let newVnode = renderComponent(this); // 执行render函数获取新vdom
    // node真实到dom节点，比较完后还会渲染到真实到dom节点上，最终还得做dom操作
    let newNode = compareTwoVnodes(
      vnode,
      newVnode,
      node,
      getChildContext(this, parentContext)
    );
    // 比较新旧真实dom，新增节点譬如之前p现在变成span，syncCache可以理解成刷新缓存
    if (newNode !== node) {
      newNode.cache = newNode.cache || {};
      syncCache(newNode.cache, node.cache, newNode);
    }
    // 把新到vdom缓存起来等待下次使用
    $cache.vnode = newVnode;
    $cache.node = newNode;
    /**
     * 清除pending,执行didmount生命周期
     * 譬如说组件更新有很多从里到父，可能会排队，这个时候有很多到生命周期钩子要执行componentDidMount
     */
    clearPending();
    if (this.componentDidUpdate) {
      this.componentDidUpdate(props, state, context);
    }
    // setState里面指定的回调函数
    if (callback) {
      callback.call(this);
    }
    // 当所有组件更新完了，重置标识符为稳定状态
    $updater.isPending = false;
    // emitUpdate最终还会做一个提交更新操作，确保pendingStates全部执行完，防止：177行代码updater更新器里有更新状态
    $updater.emitUpdate();
  }
  setState(nextState, callback) {
    /**
     * 并不是直接去更新新的值，而是把新的对象值调用addState方法把追加到组件相关的updater更新器里面
     * 添加异步队列，不是每次都更新
     */
    this.$updater.addCallback(callback);
    this.$updater.addState(nextState);
  }
}

function shouldUpdate(component, nextProps, nextState, nextContext, callback) {
  // 是否应该更新，判断shouldComponentUpdate生命周期
  let shouldComponentUpdate = true;
  // 判断组件实例是否存在shouldComponentUpdate
  if (component.shouldComponentUpdate) {
    shouldComponentUpdate = component.shouldComponentUpdate(
      nextProps,
      nextState,
      nextContext
    );
  }
  if (shouldComponentUpdate === false) {
    component.props = nextProps;
    component.state = nextState;
    component.context = nextContext || {};
    return;
  }

  // 属性、状态、上下文都是缓存在组件实例上
  let cache = component.$cache;
  cache.props = nextProps;
  cache.state = nextState;
  cache.context = nextContext || {};
  component.forceUpdate(callback);
}
