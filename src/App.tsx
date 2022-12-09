import { jsxFactory } from "@xania/view";

import "./App.css";
import Time from "./time";
import Clock from "./clock";
import { BasicElements } from "./examples/basic";

const jsx = jsxFactory();

export default function App() {
  return (
    <div class="App">
      <BasicElements />
    </div>
  );
}
