import { jsxFactory, useState } from "@xania/view";
import classes from "./css.module.scss";
import { Section } from "./section";

const jsx = jsxFactory({ classes });

export function AsyncElements() {
  return (
    <>
      <Section title="Async text content">
        <DelayedTextContent value={delay("Now you see me", 1000)} />
      </Section>
      {/* <Section title="Custom render function">
          <CustomRenderDemo />
        </Section> */}
    </>
  );
}

function DelayedTextContent(props: { value: Promise<string> }) {
  return <span class="element slide-in">{props.value}</span>;
}

export function delay<T>(value: T | Promise<T>, ts: number = 1000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(function () {
      resolve(value);
    }, ts);
  }) as any;
}
