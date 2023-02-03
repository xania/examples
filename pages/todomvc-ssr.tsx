import { jsx } from "@xania/view";
import { TodoApp } from "../src/examples/todo";
import { Layout } from "./Layout";

export default function () {
  return (
    <>
      {"<!doctype html>"}
      <Layout>
        <div class="App">
          <TodoApp />
        </div>
      </Layout>
    </>
  );
}
