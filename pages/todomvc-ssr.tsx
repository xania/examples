import { jsx } from "@xania/view";
import { TodoApp } from "../src/examples/todo";
import { IActionHandler, ViewResult } from "@xania/ssr";
import { Layout } from "./Layout";

export const view: IActionHandler = () => {
  return new ViewResult(
    (
      <Layout>
        <div class="App">
          <TodoApp />
        </div>
      </Layout>
    )
  );
};
