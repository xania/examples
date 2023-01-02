import { jsxFactory, view } from "@xania/view";
import classes from "./css.module.scss";

const jsx = jsxFactory({ classes });

export function Section(props: { title: string; children: JSX.Children }) {
  return (
    <div class="demo-section">
      <h4>{props.title}</h4>
      {props.children}
    </div>
  );
}
