import { jsxFactory } from "@xania/view";
import classes from "./App.module.scss";
import { AsyncElements } from "./examples/async";

import { BasicElements } from "./examples/basic";
import { ReactiveElements, UseStateDemo } from "./examples/reactive";
import { TodoApp } from "./examples/todo";

const jsx = jsxFactory({ classes });

export default function App() {
  return (
    <>
      <nav>
        <a class="router-link" href="/">
          Basic elements
        </a>
        <a class="router-link" href="/async">
          Async elements
        </a>
        <a class="router-link" href="/reactive">
          Reactive elements
        </a>
        <a class="router-link" href="/todomvc">
          TodoMVC
        </a>
      </nav>
      <div class="App">
        <Route path="/">
          <BasicElements />
        </Route>
        <Route path="/async">
          <AsyncElements />
        </Route>
        <Route path="/reactive">
          <ReactiveElements />
        </Route>
        <Route path="/todomvc">
          <TodoApp />
        </Route>
      </div>
    </>
  );
}

type RouteProps = {
  path: string;
};
function Route(props: RouteProps, children: any) {
  if (props.path === window.location.pathname) return children;
}
