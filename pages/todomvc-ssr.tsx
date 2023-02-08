import { jsx } from "@xania/view";
import { TodoApp } from "../src/examples/todo";
import { Layout } from "./Layout";

export default function () {
  return (
    <Layout>
      <link href="/src/App.module.scss" rel="stylesheet" />
      <link href="/src/examples/todo/index.module.scss" rel="stylesheet" />
      <div class="App">
        <TodoApp />
      </div>
    </Layout>
  );
}
