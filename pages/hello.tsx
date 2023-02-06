import { jsx } from "@xania/view";
import { State } from "../packages/state";
import { Layout } from "./Layout";

export default function () {
  const state = new State(0);

  function onClick() {
    state.set((x) => x + 1);
  }
  return (
    <Layout>
      <button click={onClick}>Click me</button>
      Counter: {state}
    </Layout>
  );
}
