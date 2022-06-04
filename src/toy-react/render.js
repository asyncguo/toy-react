// 下一个工作单元
let nextUnitOfWork = null;
// 进行中的 root
let wipRoot = null;
// 当前渲染的 fiber tree
let currentRoot = null;
// 需要删除的 fiber
let deletions = [];

function workLoop(deadline) {
  // console.log('nextUnitOfWork', nextUnitOfWork);
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  // 当没有 nextUnitOfWork 时，将整颗 fiber tree 交给 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent

  // 兼容函数组件无 dom 的情况
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    // 添加新节点
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    // 更新节点的 props
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // 删除节点
    commitDeletion(fiber, domParent)
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  console.log(fiber, domParent);
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    // 兼容函数组件：向下寻找到有 child 的 DOM node
    commitDeletion(fiber.child, domParent)
  }
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // console.log(dom, prevProps, nextProps);
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);

      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);

      dom.addEventListener(eventType, nextProps[name]);
    });
}

/**
 * old fiber and elements reconcile
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber = null;

    // compare oldFiber to element
    const sameType = oldFiber && element && oldFiber.type === element.type;
    // console.table(index, prevSibling, element, sameType, oldFiber);

    // type 相同时，只更新 props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    // type 不一致&有一个 element 时，新建 DOM 节点
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    // type 不一致 & 只有 oldFiber 时，删除旧的 DOM 节点
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
      newFiber = oldFiber;
    }

    if (index === 0) {
      // 第一个 element 作为 fiber 的 child
      wipFiber.child = newFiber;
    } else {
      // 兄弟节点连接
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    // 更新 oldFiber
    oldFiber = oldFiber ? oldFiber.sibling : null
    index++;
  }
}

/**
 * 1. create dom node
 * 2. create fibers
 * 3. return next unit of work
 */
function performUnitOfWork(fiber) {
  // console.log('fiber',fiber);
  const isFunctionComponent = fiber.type instanceof Function

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 返回下一个节点
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    // 循环往父级查询返回 fiber.sibling
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]

  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props)

  return dom;
}

function render(element, container) {
  // console.log('element',element);
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  nextUnitOfWork = wipRoot;
}

requestIdleCallback(workLoop);

export default render;
