function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";

  // 分发 props
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // 处理 children
  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
}

export default render;
