import { Action } from "./action";
import { ActionContext } from "./action-context";

export function npmInstall(...packages: string[]): Action {
  return (context: ActionContext) => {
    console.log("npm install " + packages.join(" "));
  };
}

export function npmUninstall(...packages: string[]): Action {
  return (context: ActionContext) => {
    console.log("npm uninstall " + packages.join(" "));
  };
}
