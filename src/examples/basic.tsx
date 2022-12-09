import { jsxFactory } from "../../packages/view/lib/jsx";
import { Section } from "./section";
import classes from "./css.module.scss";
import * as Rx from "rxjs";
import * as Ro from "rxjs/operators";

const jsx = jsxFactory({ classes });

export function BasicElements() {
  return (
    <>
      <Section title="Simple element with text content">
        <HelloWorld />
      </Section>
      <Section title="Nested elements">
        <NestedElements />
      </Section>
      <Section title="Nested text and elements">
        <NestedTextAndElements />
      </Section>
      <Section title="Css module support">
        <CssModuleDemo />
      </Section>
    </>
  );
}

export function HelloWorld() {
  return <span class="element">hello world!</span>;
}

export function NestedElements() {
  return (
    <span class="element">
      <span class="element">nested element!</span>
    </span>
  );
}

export function NestedTextAndElements() {
  return (
    <span class="element">
      text before<span class="element">nested element!</span>
      text after
    </span>
  );
}

export function MultipleRootElementsDemo() {
  return (
    <>
      <span class="element">simple root element 1</span>
      <span class={delay("element")}>
        Element suspended untill attribute promise is resolved
      </span>
      {Rx.timer(0, 1000).pipe(
        Ro.map(() => (
          <span class="element slide-in">
            {new Date().toLocaleTimeString()}
          </span>
        ))
      )}
      {Rx.timer(0, 1500).pipe(
        Ro.scan((p, next, i) => next + 1, 0),
        Ro.map((idx) => (
          <span class="element slide-in">I am an rxjs observable {idx}</span>
        ))
      )}
    </>
  );

  function delay<T>(value: T | Promise<T>, ts: number = 1000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      setTimeout(function () {
        resolve(value);
      }, ts);
    }) as any;
  }
}

export function CssModuleDemo() {
  return <span class="element dark-theme">css modules in action</span>;
}
