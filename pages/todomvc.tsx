import { jsx, serialize } from "@xania/view";
import * as http from "node:http";
import { TodoApp } from "../src/examples/todo";
import { Layout } from "./Layout";

export const view: RequestHandler = async (req, res, next) => {
  await serialize(
    <Layout>
      <script type="module" src="/pages/todomvc" />
      <TodoApp />
    </Layout>,
    (s) => res.write(s)
  );
  res.end();
};

type RequestHandler = (
  req: http.IncomingMessage,
  res: http.OutgoingMessage,
  next: Function
) => Promise<void>;
