// import React from "react";
// import ReactDOM from "react-dom";

// import React, { Component } from './react';
// import ReactDOM from './react-dom';

import React from "./MReact";
import ReactDOM from "./MReact/ReactDOM";

// class Comp2 extends Component {
//   render() {
//     return (
//       <h2>hello, i'm comp2</h2>
//     )
//   }
// }

class Comp2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      msg: "something",
    };
  }
  componentDidMount() {
    this.setState({ msg: "Hello, react~~~" });
  }
  onClick = () => {
    this.setState({ msg: "Hi, react~~~" });
  };
  render() {
    return <h2 onClick={this.onClick}>hi, class comp! {this.state.msg}</h2>;
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

ReactDOM.render(jsx, document.getElementById("root"));
