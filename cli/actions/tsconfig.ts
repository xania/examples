import { Action } from "./action";
import { ActionContext } from "./action-context";
import { Optional } from "./optional";

export function tsconfig(schema: Optional<TsConfigScheme>): Action {
  return (context: ActionContext) => {
    console.log("tsconfig ", schema);
  };
}

interface TsConfigScheme {
  compilerOptions: {
    jsxFactory: string;
    jsx: "react" | "preserve" | "react-jsx" | "react-jsxdev" | "react-native";
    jsxFragmentFactory: string;
    moduleResolution: "node" | "classic";
    module: "ES2020";
    typeRoots: string[];
    types: string[];
    paths: Record<string, string[]>;
  };
}
