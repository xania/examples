import { jsxFactory } from "../../packages/view/lib/jsx";
import { Section } from "./section";
import classes from "./css.module.scss";

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

function HelloWorld() {
  return <span class="element">hello world!</span>;
}

function NestedElements() {
  return (
    <span class="element">
      <span class="element">nested element!</span>
    </span>
  );
}

function NestedTextAndElements() {
  return (
    <span class="element">
      text before<span class="element">nested element!</span>
      text after
    </span>
  );
}

function CssModuleDemo() {
  return <span class="element dark-theme">css modules in action</span>;
}
