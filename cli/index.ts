import enquirer from "enquirer";
import { Action } from "./actions/action";
import { degit } from "./actions/git";
import { npmInstall, npmUninstall } from "./actions/npm";
import { tsconfig } from "./actions/tsconfig";
import { vite } from "./actions/vite";

const { select } = enquirer;

async function templates() {
  const actions: Action[] = [];
  const response = await select({
    name: "template",
    message: "Select how to pull @xania/view",
    choices: [
      { name: "install latest npm package" },
      { name: "get me the code" },
    ],
  });

  switch (response) {
    case "get me the code":
      actions.push(
        npmUninstall("@xania/view"),
        degit("xania/view", "packages/@xania/view"),
        tsconfig({
          compilerOptions: {
            jsx: "react",
            jsxFactory: "jsx.createElement",
            jsxFragmentFactory: "jsx.createFragment",
            typeRoots: ["packages/xania/view/types"],
            paths: {
              ["@xania/view"]: ["packages/@xania/view/lib/index.ts"],
            },
          },
        }),
        vite({
          resolve: {
            alias: {
              "@xania/view": "packages/view/lib/index.ts",
            },
          },
        })
      );
      break;
    case "install latest npm package":
      actions.push(
        npmInstall("@xania/view"),
        tsconfig({
          compilerOptions: {
            jsx: "react",
            jsxFactory: "jsx.createElement",
            jsxFragmentFactory: "jsx.createFragment",
            types: ["@xania/view/types/jsx"],
            paths: {
              ["@xania/view"]: null,
            },
          },
        })
      );
      break;
  }

  return actions;
}

templates().then(run);

function run(actions: Action[]) {
  for (const action of actions) {
    action({});
  }
}
