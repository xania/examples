import { jsx } from "@xania/view";
import { Layout } from "./Layout";

export default function () {
  function onClick() {
    window.alert("hello world");
  }
  return (
    <Layout>
      <button click={onClick}>Click me</button>
    </Layout>
  );
}
