/**
 * render函数
 */
import * as _ from "./util";
import {
  COMPONENT_ID,
  VELEMENT,
  VCOMPONENT,
  ELEMENT_NODE_TYPE,
} from "./constant";
import { initVnode, clearPending, compareTwoVnodes } from "./virtual-dom";
import { updateQueue } from "./Component";

function isValidContainer(node) {
  return !!(node && node.nodeType === ELEMENT_NODE_TYPE);
}

let pendingRendering = {};
let vnodeStore = {};
function renderTreeIntoContainer(vnode, container, callback, parentContext) {
  if (!vnode.vtype) {
    throw new Error(`cannot render ${vnode} to container`);
  }
  if (!isValidContainer(container)) {
    throw new Error(`container ${container} is not a DOM element`);
  }
  let id = container[COMPONENT_ID] || (container[COMPONENT_ID] = _.getUid());
  let argsCache = pendingRendering[id];
  // 缓存
  if (argsCache) {
    if (argsCache === true) {
      pendingRendering[id] = argsCache = { vnode, callback, parentContext };
    } else {
      argsCache.vnode = vnode;
      argsCache.parentContext = parentContext;
      argsCache.callback = argsCache.callback
        ? _.pipe(argsCache.callback, callback)
        : callback;
    }
    return;
  }

  pendingRendering[id] = true;
  let oldVnode = null;
  let rootNode = null;
  /**
   * 页面初始化进来oldVnode是没有走下面的分支initVnode
   */
  if ((oldVnode = vnodeStore[id])) {
    // 对比
    rootNode = compareTwoVnodes(
      oldVnode,
      vnode,
      container.firstChild,
      parentContext
    );
  } else {
    rootNode = initVnode(vnode, parentContext);
    var childNode = null;
    while ((childNode = container.lastChild)) {
      // 这个地方就是为什么根里面的节点都会被删除的原因
      container.removeChild(childNode);
    }
    // 得到真实的节点rootNode appendChild进去
    container.appendChild(rootNode);
  }
  vnodeStore[id] = vnode;
  let isPending = updateQueue.isPending;
  updateQueue.isPending = true;
  clearPending();
  argsCache = pendingRendering[id];
  delete pendingRendering[id];

  /**
   * 上面的appendChild是把父组件的追加进去了，剩下子组件处理，需要做批量更新batchUpdate体现出它的异步性
   */
  let result = null;
  if (typeof argsCache === "object") {
    result = renderTreeIntoContainer(
      argsCache.vnode,
      container,
      argsCache.callback,
      argsCache.parentContext
    );
  } else if (vnode.vtype === VELEMENT) {
    result = rootNode;
  } else if (vnode.vtype === VCOMPONENT) {
    result = rootNode.cache[vnode.uid];
  }

  if (!isPending) {
		updateQueue.isPending = false;
    /**
     * 这里应用场景第一个启动点，还有个是setState时候用户点击事件的启动点event-system中
     * 生命周期钩子做定时器或者原生事件去激活了setState，这个时候不会异步的行为他们会立刻更新，因为他们没有经过react的合成事件封装
     * 让队列里面子组件做批量更新，这个时候所有的子组件去更新下自己
     */
    updateQueue.batchUpdate();
  }

  if (callback) {
    callback.call(result);
  }

  return result;
}

function render(vnode, container, callback) {
  // 把vnode转换成真实node
  return renderTreeIntoContainer(vnode, container, callback);
}

export default { render };
