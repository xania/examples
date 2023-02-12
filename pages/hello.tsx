import { jsx } from "../packages/view/index";
import { State } from "../packages/state";
import { Layout } from "./Layout";
// // import { Layout } from "./Layout";

// class State {
//   observers: any[] = [];
//   constructor(public snapshot: number) {}

//   subscribe(o) {
//     this.observers.push(o);
//     o.next(this.snapshot);

//     return () => {
//       const idx = this.observers.indexOf(o);
//       if (idx >= 0) {
//         this.observers.splice(idx, 1);
//       }
//     };
//   }

//   set(updater: (x: number) => number) {
//     const newValue = updater(this.snapshot);
//     if (newValue !== this.snapshot) {
//       this.snapshot = newValue;
//       for (const o of this.observers) {
//         o.next(newValue);
//       }
//     }
//   }
// }

export function view() {
  const state = new State(11);

  function onClick() {
    state.set((x) => x + 1);
  }
  return (
    <Layout>
      <button click={onClick}>Click me</button>
      <button click={onClick}>Click me too</button>
      Counter: {state}
    </Layout>
  );
}
