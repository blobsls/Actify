function App() {
  return createElement("div", null,
    createElement("h1", null, "Hello, Mini React!"),
    createElement("p", null, "This is a tiny UI library.")
  );
}

const root = document.getElementById("root");
render(createElement(App, null), root);
