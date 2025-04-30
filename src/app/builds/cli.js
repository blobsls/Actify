#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import http from 'http';
import url from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const commands = {
  init: () => {
    const projectName = process.argv[3] || "my-actify-app";
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      console.log(`❌ Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    fs.mkdirSync(projectPath);
    fs.writeFileSync(path.join(projectPath, 'index.html'), `<!DOCTYPE html>
<html>
<head>
  <title>Actify App</title>
</head>
<body>
  <div id="root"></div>
  <script src="app.js" type="module"></script>
</body>
</html>
`);
    fs.writeFileSync(path.join(projectPath, 'app.js'), `import { createElement, render, useState } from './actify.js';

function App() {
  const [count, setCount] = useState(0);
  return createElement("div", null,
    createElement("h1", null, "Actify Count: " + count),
    createElement("button", { onClick: () => setCount(count + 1) }, "Increment")
  );
}

render(createElement(App), document.getElementById("root"));
`);
    fs.writeFileSync(path.join(projectPath, 'actify.js'), `// Minimal Actify core
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: text, children: [] },
  };
}

export function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  Object.entries(element.props || {})
    .filter(([key]) => key !== "children")
    .forEach(([name, value]) => {
      dom[name] = value;
    });

  (element.props.children || []).forEach(child =>
    render(child, dom)
  );

  container.appendChild(dom);
}

export function useState(initial) {
  let state = initial;
  let setState = newVal => {
    state = newVal;
    document.getElementById("root").innerHTML = "";
    render(createElement(App), document.getElementById("root"));
  };
  return [state, setState];
}
`);
    console.log(`✅ Project "${projectName}" created.`);
  },

  serve: () => {
    const port = 3000;
    const root = process.argv[3] || process.cwd();

    http.createServer((req, res) => {
      let filePath = path.join(root, req.url === '/' ? '/index.html' : req.url);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    }).listen(port);

    console.log(`🚀 Serving on http://localhost:${port}`);
  },

  build: () => {
    const input = path.join(process.cwd(), 'app.js');
    const output = path.join(process.cwd(), 'dist', 'app.js');

    fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
    fs.copyFileSync(input, output);
    console.log("✅ Build complete. Output in /dist");

    // Optional: minify with esbuild if installed
    try {
      execSync(`npx esbuild ${input} --outfile=dist/app.min.js --minify`, { stdio: 'inherit' });
      console.log("✅ Minified build created at dist/app.min.js");
    } catch {
      console.log("ℹ️ Skipping minification: 'esbuild' not installed.");
    }
  }
};

// Run command
const command = process.argv[2];

if (!commands[command]) {
  console.log(`❌ Unknown command: "${command}"`);
  console.log("Usage: node cli.js <init|serve|build>");
  process.exit(1);
}

commands[command]();
