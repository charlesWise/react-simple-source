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