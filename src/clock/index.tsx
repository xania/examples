import { jsxFactory } from "@xania/view";
import classes from "./clock.module.scss";
import * as Rx from "rxjs";
import * as Ro from "rxjs/operators";

const jsx = jsxFactory({ classes });

export default function Clock() {
  var now = Rx.timer(0, 100).pipe(
    Ro.map(() => {
      const d = new Date();
      return d.getTime() - d.getTimezoneOffset() * 60000;
    })
  );
  function transform(fn: (d: number) => number) {
    return now.pipe(Ro.map((d) => `transform: rotate(${fn(d)}deg);`));
  }

  return (
    <>
      <section class="section">
        <div class="label">SEIKO</div>
        <div class="hourhand" style={transform(hours)}></div>
        <div class="secondhand" style={transform(seconds)}></div>
        <div class="minutehand" style={transform(minutes)}></div>
        <div class="hour12"></div>
        <div class="hour1"></div>
        <div class="hour2"></div>
        <div class="hour3"></div>
        <div class="hour4"></div>
        <div class="hour5"></div>
      </section>
      <span class="credits">
        design by <a href="https://codepen.io/nilsynils">Nils Rasmusson</a>
      </span>
    </>
  );
}

function seconds(d: number) {
  return (360 * (d % 60000)) / 60000 - 90;
}

function minutes(d: number) {
  return (360 * (d % 3600000)) / 3600000 - 90;
}

function hours(d: number) {
  return (360 * (d % 43200000)) / 43200000 - 90;
}
