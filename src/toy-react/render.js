// 下一个工作单元
let nextUnitOfWork = null
// 进行中的 root 
let wipRoot = null

function workLoop(deadline) {
  // console.log('nextUnitOfWork', nextUnitOfWork);
  let shouldYield = false
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )

    shouldYield = deadline.timeRemaining() < 1
  }

  // 当没有 nextUnitOfWork 时，将整颗 fiber tree 交给 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
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
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  }

  nextUnitOfWork = wipRoot

  requestIdleCallback(workLoop)
}

export default render;
