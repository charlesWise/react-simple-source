#### setState 总结

- setState()执行时，updater 会将 partialState 添加到它维护到 pendingStates 中，等到 updateComponent 负责合并 pengingStates 中所有 state 变成一个 state，forceUpdate 执行新旧 vdom 比对 diff 以及实际更新操作

- 我们实现都component里面setState维护状态，那么setState有那些特性？
```
// 批量
setState({foo}, ()=>{})
setState({bar}, ()=>{})
setState({foo, bar}, ()=>{})
setState((nextState, nextProps) => nextState.foo)
setState([{foo}])

// 异步
setState({foo: 'bar'})
console.log(foo) // foo

// 不异步
settimeout(( > {
  setState({foo: 'bar'})
})

// 原生事件
dom.addEventlistener('click', () => {
  setState({foo: 'bar'})
})
```