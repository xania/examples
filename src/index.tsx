import { jsx, render } from "@xania/view";
import App from "./App";

render(<App />, document.getElementById("app"));

// const key = Symbol();
// const target = {};

// class Entity {
//   id: number;
//   id1: number;
//   id2: number;
//   id3: number;
//   id4: number;
//   id5: number;
//   age: number;
//   name: string;
//   key: symbol;
//   target: object;

//   static objectFromPrototype(count: number) {
//     for (let i = 0; i < count; i++) {
//       const obj = new Entity();
//       obj.key = key;
//       obj.name = "hello";
//       obj.age = i;
//       obj.target = target;
//     }
//   }

//   static adhocObjects(count: number) {
//     for (let i = 0; i < count; i++) {
//       const obj: Partial<Entity> = {};
//       obj.key = key;
//       obj.name = "hello";
//       obj.age = i;
//       obj.target = target;
//     }
//   }
// }

// const elapsed = {
//   objectFromPrototype: 0,
//   adhocObjects: 0
// };

// for (let i = 0; i < 10000; i++) {
//   elapsed.objectFromPrototype += measure(Entity.objectFromPrototype);
//   elapsed.adhocObjects += measure(Entity.adhocObjects);
// }

// console.log(
//   (elapsed.adhocObjects / elapsed.objectFromPrototype).toFixed(2),
//   "%"
// );

// function measure(cb: (count: number) => void, count = 100000) {
//   const start = performance.now();
//   cb(count);
//   const end = performance.now();
//   return end - start;
// }
