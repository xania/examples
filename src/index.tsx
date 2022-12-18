import { jsxFactory, render } from "@xania/view";
import App from "./App";
import "./index.css";

const jsx = jsxFactory();

render(<App />, document.getElementById("app"));
