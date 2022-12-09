import { jsxFactory } from "@xania/view";
import classes from "./time.module.scss";
import { timer } from "rxjs";
import { map } from "rxjs/operators";

const jsx = jsxFactory({ classes });

export default function Clock() {
  var time = timer(0, 1000).pipe(
    map(() =>
      new Date().toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        second: "2-digit",
      })
    )
  );
  return (
    <div class="clock">
      <p>{time}</p>
    </div>
  );
}
