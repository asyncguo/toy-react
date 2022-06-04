let nextUnitOfWork = null

function workLoop(deadline) {
  // console.log('nextUnitOfWork', nextUnitOfWork);
  let shouldYield = false
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )

    shouldYield = deadline.timeRemaining() < 1
  }

  requestIdleCallback(workLoop)
}

/**
 * 1. create dom node
 * 2. create fibers
 * 3. return next unit of work
 */
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    if (index === 0) {
      // 第一个 element 作为 fiber 的 child
      fiber.child = newFiber
    } else {
      // 兄弟节点连接
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  // 返回下一个节点
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber

  while (nextFiber) {
    // 循环往父级查询返回 fiber.sibling
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }
}

function createDom(fiber) {
  const dom =
  fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== "children";

  // 分发 props
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom
}

function render(element, container) {
  // 将 nextUnitOfWork 设置为 fiber tree 的根节点
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  }

  requestIdleCallback(workLoop)
}

export default render;
