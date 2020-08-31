import initVNode from './vdom';

/**
 * 
 * @param {*} element 虚拟DOM
 * @param {*} container 真实DOM节点
 */
function render(element, container) {
  // container.innerHTML = `<pre>${JSON.stringify(element, null, 2)}</pre>`
  container.appendChild(initVNode(element));
}

export default { render }