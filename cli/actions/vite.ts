import { Action } from "./action";
import { ActionContext } from "./action-context";
import type { UserConfig } from "vite";
import { Optional } from "./optional";
import { cwd } from "node:process";

console.log(`Current directory: ${cwd()}`);

export function vite(config: Optional<UserConfig>): Action {
  return (context: ActionContext) => {
    console.log("apply vite config ", config);
  };
}
