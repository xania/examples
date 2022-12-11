﻿import { jsxFactory, useState } from "@xania/view";
import classes from "./css.module.scss";
import * as Rx from "rxjs";
import * as Ro from "rxjs/operators";
import { Section } from "./section";
import { delay } from "./async";
import { view } from "../../packages/view/lib/render/view";

const jsx = jsxFactory({ classes });

export function ReactiveElements() {
  return (
    <>
      <UseStateDemo />
      <Section title="Timer demo difficult? Why?">
        <TimerDemo />
      </Section>
      <Section title="Element class list consists of constant and dynamic values">
        <ClassListDemo />
      </Section>
      <MultipleRootElementsDemo />
    </>
  );
}

function UseStateDemo() {
  const count = useState(0);

  return (
    <Section title="State support">
      <div class="element">
        <div>Count: {count}</div>
        <button
          class="mdc-button"
          click={(_) => count.update(count.snapshot + 1)}
        >
          <span>Increment</span>
        </button>
      </div>
    </Section>
  );
}

function ClassListDemo() {
  const theme = Rx.timer(0, 1000).pipe(
    Ro.startWith("dark-theme"),
    Ro.scan((prev, next) =>
      prev === "light-theme" ? "dark-theme" : "light-theme"
    )
  );
  return <div class={[theme, "element"]}>Toggle theme class each second</div>;
}

function TimerDemo() {
  return (
    <div class="element">
      <div>
        {"Current Time: "}
        {Rx.timer(0, 1000).pipe(Ro.map(() => new Date().toLocaleTimeString()))}
      </div>
    </div>
  );
}

function MultipleRootElementsDemo() {
  return (
    <Section title="Multiple root elements flashing in and out preserving order">
      <span class="element">simple root element 1</span>
      <span class={delay("element")}>
        Element suspended untill attribute promise is resolved
      </span>
      {view(
        Rx.timer(0, 1000).pipe(
          Ro.map(() => (
            <span class="element slide-in">
              {new Date().toLocaleTimeString()}
            </span>
          ))
        )
      )}
      {view(
        Rx.timer(0, 1500).pipe(
          Ro.scan((p, next, i) => next + 1, 0),
          Ro.map((idx) => (
            <span class="element slide-in">I am an rxjs observable {idx}</span>
          ))
        )
      )}
      <span class="element">simple root element 2</span>
    </Section>
  );
}