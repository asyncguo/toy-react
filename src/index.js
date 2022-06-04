import ToyReact from "./toy-react";
/**
 * NOTE: react 17 时 jsxRuntime 默认为 automatic，需更改设置 jsxRuntime 为 classic 即可
 */
/** @jsxRuntime classic */
/** @jsx ToyReact.createElement */
const App = () => {
  const [state, setState] = ToyReact.useState(1)
  // console.log(state, setState);
  return (
    <div title="toy">
      <div>toy react</div>
      <div>{state}</div>
      <button onClick={() => {
        setState(c => c + 1)
      }}>add</button>
    </div>
  );
};

console.log("App", App);

ToyReact.render(<App />, document.getElementById("root"));
