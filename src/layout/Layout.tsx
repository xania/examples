import { jsx } from "@xania/view";
import "./index.css";

export function layout(_, children) {
  return (
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
      </head>
      <body id="app">{children}</body>
    </html>
  );
}
