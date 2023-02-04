import { Anchor, jsx, render } from "@xania/view";
import "./index.css";
// import "../src/App.module.scss";

export function Layout({ children }) {
  return (
    <>
      {"<!doctype html>"}
      <html>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, user-scalable=no,maximum-scale=1"
          />

          <title>Xania App</title>
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500|Material+Icons"
            rel="stylesheet"
          />
          <link href="/src/App.module.scss" rel="stylesheet" />
          <link href="/src/examples/todo/index.module.scss" rel="stylesheet" />
        </head>
        <body id="app">{children}</body>
      </html>
    </>
  );
}
