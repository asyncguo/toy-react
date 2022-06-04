let nextUnitOfWork = null

function workLoop(deadline) {
  let shouldYield = false
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )

    shouldYield = deadline.timeRemaining() < 1
  }

  requestIdleCallback(workLoop)
}

function performUnitOfWork(nextUnitOfWork) {

}

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

requestIdleCallback(workLoop)

export default render;
