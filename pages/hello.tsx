import { jsx } from "../packages/view/index";
// import { State } from "../packages/state/lib/index";
import { Layout } from "./Layout";

class State {
  private observers: any[] = [];
  constructor(public value: number) {}
  set(fn: Function) {
    this.value = fn(this.value);
    for (const obs of this.observers) {
      obs.next(this.value);
    }
  }
  static async staticAsync(fn: Function) {}
  async fetch(fn: Function) {}
  static async staticFetch(fn: Function) {
    return await fetch("http://xania");
  }
  static arrow = () => {
    console.log("State.arrow", this);
  };

  subscribe(obs) {
    this.observers.push(obs);
    return function () {};
  }
}

const obj = {
  arrow: () => {
    console.log("obj.arrow");
  }
};

function sayHello() {
  console.log("hello");
}
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

const a = 1;
export function view() {
  const counter = new State(11);

  const a = new Date();
  function onClick() {
    counter.set((x) => x + 1);
  }

  return [
    "<button id='button01'>click me</button>",
    function client() {
      counter.subscribe({
        next(value) {
          console.log("counter", value);
        }
      });
      document
        .getElementById("button01")
        .addEventListener("click", () => counter.set((x) => x + 1));
      console.log("hello client", a);
    }
  ];

  // return (
  //   <Layout>
  //     <button click={(_) => console.log(this)}>Click me</button>
  //     <button click={onClick}>Click me too</button>
  //     Counter: {a}
  //   </Layout>
  // );
}
