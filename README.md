## 0. 通过 create-react-app 创建默认项目
## 1. createElement 函数
## 2. render 函数
## 3. Concurrent Mode

```js
element.props.children.forEach(child =>
  render(child, dom)
)
```

问题1: 开始渲染时，整颗 element tree 渲染完成之前程序是无法停止的。可能会阻塞主进程，即用户输入或动画流畅的高优先级任务必须等到渲染完成才能进行。

解决方案：拆分渲染任务，在完成每个单元时，如果需要其他操作，优先让浏览器中断渲染。

## 4. Fibers
## 5. Render 与 Commit 两大阶段（Phases）

```js
if (fiber.parent) {
  fiber.parent.dom.appendChild(fiber.dom)
}
```

问题2: 每当我们处理一个 reactElement 时，会添加一个新的节点到 DOM，而浏览器可能会中断整个渲染流程，用户可能会看不到完整的UI。

解决方案：分阶段 render 和 commit，当没有 nextUnitOfWork 时，将整颗 fiber tree 交给 DOM

## 6. 调和算法 Reconciliation
## 7. 函数组件 Function Components
## 8. Hooks
