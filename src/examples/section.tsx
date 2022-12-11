import { jsxFactory, view } from "@xania/view";
import classes from "./css.module.scss";

const jsx = jsxFactory({ classes });

export function Section(props: { title: string }, children) {
  return view(
    <div class="demo-section">
      <h4>{props.title}</h4>
      {children}
    </div>
  );
}
