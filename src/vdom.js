/**
 * 初始化虚拟节点函数
 */
export default function initVNode(vnode) {
  const { vtype } = vnode;
  if (!vtype) { // 是文本节点
    return document.createTextNode(vnode);
  }
  if (vtype === 1) {
    return createElement(vnode);
  } else if (vtype === 2) {
    return createClassComp(vnode);
  } else if (vtype === 3) {
    return createFunComp(vnode);
  }
}

function createElement(vnode) {
  const { type, props } = vnode;
  console.log(props)
  const node = document.createElement(type);
  const { ref, key, children, ...rest } = props;
  Object.keys(rest).forEach(k => {
    if (k === 'className') {
      node.setAttribute('class', rest[k]);
    } else {
      node.setAttribute(k, rest[k]);
    }
  })
  children.forEach(c => { // 递归遍历
    node.appendChild(initVNode(c));
  })
  return node;
}

function createClassComp(vnode) {
  const { type, props } = vnode;
  // class xx {...}
  const comp = new type(props);
  const newVNode = comp.render()
  return initVNode(newVNode);
}

function createFunComp(vnode) {
  const { type, props } = vnode;
  const newVNode = type(props);
  return initVNode(newVNode);
}