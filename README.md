- vnode 出来后没有 function class 组件名，也就是无法区分组件，这个时候我们设置一个 vtype 来区分

#### setState 总结

- setState()执行时，updater 会将 partialState 添加到它维护到 pendingStates 中，等到 updateComponent 负责合并 pengingStates 中所有 state 变成一个 state，forceUpdate 执行新旧 vdom 比对 diff 以及实际更新操作
