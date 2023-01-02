import { jsxFactory, RenderContainer } from "@xania/view";
import { TodoApp } from "../examples/todo";
import classes from "../App.module.scss";

const jsx = jsxFactory({ classes });

export function view() {
  return (
    <div class="App">
      <TodoApp />
    </div>
  );
}
