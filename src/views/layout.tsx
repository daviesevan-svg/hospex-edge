/** @jsxImportSource hono/jsx */
import { html, raw } from "hono/html";

export function layout(title: string, body: any) {
  // Top-level HTML doctype isn't expressible cleanly in JSX, so we wrap.
  return html`<!doctype html>${raw(
    String(<Shell title={title}>{body}</Shell>),
  )}`;
}

function Shell({ title, children }: { title: string; children: any }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/calendar.css" />
        <script src="https://unpkg.com/htmx.org@2.0.4" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
