// import React from "react";
// import ReactDOM from "react-dom";
import React, { Component } from './react';
import ReactDOM from './react-dom';

class Comp2 extends Component {
  render() {
    return (
      <h2>hello, i'm comp2</h2>
    )
  }
}

function Comp(props) {
  return <h2>{props.name}</h2>;
}

const jsx = (
  <div id="dome" key={1}>
    <span>Hi</span>
    <Comp name="react" />
    <Comp2 />
  </div>
);

console.log(JSON.stringify(jsx, null, 2))

ReactDOM.render(jsx, document.getElementById("root"));
