function createElement(type, config, ...children) {
  config.children = children;
  // q: 现在class也是函数组件无法根据type区分class组件 函数组件？
  // 新增一个vtype区分三种组件：1-元素 2-class组件 3-函数组件
  let vtype;
  if (typeof type === 'function') {
    if (type.isReactComponent) {
      vtype = 2;
    } else {
      vtype = 3;
    }
  } else if(typeof type === 'string') { // 表示原生标签
    vtype = 1;
  }
  return {
    type,
    vtype,
    props: config
  }
}

export class Component {
  // 标志区分class和函数组件
  static isReactComponent = true;

  constructor (props) {
    this.props = props;
    this.state = {}
  }

  setState() {}
}


export default { createElement }