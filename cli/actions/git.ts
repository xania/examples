import { Action } from "./action";
import { ActionContext } from "./action-context";

export function degit(template: string, dest: string): Action {
  return (context: ActionContext) => {
    console.log(`degit ${template} => ${dest}`);
  };
}
