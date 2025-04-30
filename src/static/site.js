// site.js

import { createElement, render, useState } from './actify.js';

// Automatically inject a root div if not present
let root = document.getElementById("root");
if (!root) {
  root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
}

// Example dynamic component (can be replaced or registered elsewhere)
function SiteApp() {
  const [visits, setVisits] = useState(1);

  return createElement("main", { className: "site-wrapper" },
    createElement("h1", null, "Welcome to Actify Site"),
    createElement("p", null, `You have visited ${visits} time${visits > 1 ? 's' : ''}.`),
    createElement("button", { onClick: () => setVisits(visits + 1) }, "Increase Visit Count")
  );
}

// Bootstraps the app into the DOM
function bootstrapApp(AppComponent) {
  render(createElement(AppComponent), root);
}

// Inject core styles (optional)
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .site-wrapper {
      font-family: sans-serif;
      padding: 2rem;
      text-align: center;
    }
    button {
      padding: 0.5rem 1rem;
      margin-top: 1rem;
      font-size: 1rem;
    }
  `;
  document.head.appendChild(style);
}

// Run the site
function main() {
  injectStyles();
  bootstrapApp(SiteApp);
}

main();
