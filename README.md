#### setState 总结

- setState()执行时，updater 会将 partialState 添加到它维护到 pendingStates 中，等到 updateComponent 负责合并 pengingStates 中所有 state 变成一个 state，forceUpdate 执行新旧 vdom 比对 diff 以及实际更新操作

- 我们实现都component里面setState维护状态，那么setState有那些特性？
```
// 批量：很多的setState最终还是会合到了一起
setState({foo}, ()=>{})
setState({bar}, ()=>{})
setState({foo, bar}, ()=>{})
setState((nextState, nextProps) => nextState.foo)
setState([{foo}])

// 异步：队列、激活队列渠道，方式：初始化生命周期的钩子、事件会激活批量队列更新
setState({foo: 'bar'})
console.log(foo) // foo

// 不异步，并不在合成事件里面
// 如果跳出以上两个场景，并不是在react环境中，宏，浏览器环境
settimeout(( > {
  setState({foo: 'bar'})
})

// 原生事件
dom.addEventlistener('click', () => {
  setState({foo: 'bar'})
})
```