function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  Object.entries(element.props)
    .filter(([key]) => key !== "children")
    .forEach(([name, value]) => {
      dom[name] = value;
    });

  element.props.children.forEach(child =>
    render(child, dom)
  );

  container.appendChild(dom);
}
