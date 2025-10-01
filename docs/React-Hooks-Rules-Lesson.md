# React Hooks 使用规则 - 重要课程

## 问题描述

在开发 StringDetail 组件时遇到了一个严重的 React 错误：

```
Uncaught Error: Rendered more hooks than during the previous render.
```

这个错误发生在 `StringDetail.tsx:420` 行，是由于违反了 **React Hooks 的使用规则**。

---

## 错误原因分析

### React Hooks 的两个核心规则

React Hooks 有两个必须遵守的规则：

1. **只在最顶层调用 Hook**
   - 不要在循环、条件或嵌套函数中调用 Hook

2. **只在 React 函数组件中调用 Hook**
   - 不要在普通的 JavaScript 函数中调用 Hook

### 我们违反了哪个规则？

我们违反了 **第一个规则**：在条件语句（早期返回）之后调用了 Hook。

---

## 错误代码示例

### ❌ 错误的代码结构

```typescript
const StringDetail: React.FC = () => {
  // ✅ 正确：这些 hooks 在最顶层
  const { stringId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { strings, dailyData, loading, error } = useSoilingModelData();
  const { scale } = useResponsiveScale({ ... });

  // ✅ 正确：useMemo 在顶层
  const selectedDay = useMemo(() => {
    return (location.state as any)?.selectedDay || ...;
  }, [location.state, dailyData]);

  const [openAddFault, setOpenAddFault] = useState(false);

  const stringData = useMemo(() => {
    // ... 生成数据
  }, [stringId, strings, dailyData, selectedDay]);

  // ❌ 问题开始：早期返回（条件渲染）
  if (loading) {
    return <CircularProgress />;  // 早期返回 1
  }

  if (error || !stringData) {
    return <Alert>Error</Alert>;  // 早期返回 2
  }

  // ❌ 严重错误：在早期返回之后调用 useMemo
  // 这违反了 React Hooks 规则！
  const currentDayData = stringData.dailyData.find(...);
  const ivData = useMemo(() =>
    generateIVCurve(currentDayData.performance),
    [currentDayData.performance]
  );  // ← 这个 hook 在第 420 行

  // ... 其余代码
};
```

### 为什么会出错？

React 依赖于 **Hooks 的调用顺序** 来正确跟踪状态。看下面的执行流程：

#### 第一次渲染（loading = true）
```
1. useParams()
2. useNavigate()
3. useLocation()
4. useSoilingModelData()  → loading = true
5. useResponsiveScale()
6. useMemo(selectedDay)
7. useState(openAddFault)
8. useMemo(stringData)
9. return <CircularProgress />  ← 在这里提前返回
10. ❌ ivData 的 useMemo 没有被调用
```
**总共调用了 8 个 hooks**

#### 第二次渲染（loading = false, 数据加载完成）
```
1. useParams()
2. useNavigate()
3. useLocation()
4. useSoilingModelData()  → loading = false
5. useResponsiveScale()
6. useMemo(selectedDay)
7. useState(openAddFault)
8. useMemo(stringData)
9. if (loading) ← 条件为 false，不返回
10. if (error) ← 条件为 false，不返回
11. useMemo(ivData)  ← ✅ 现在调用了！
```
**总共调用了 9 个 hooks**

❌ **错误：** React 检测到第二次渲染调用了比第一次更多的 hooks（9 个 vs 8 个），导致错误！

---

## 正确代码示例

### ✅ 正确的代码结构

```typescript
const StringDetail: React.FC = () => {
  // ✅ 所有 hooks 必须在最顶层，在任何条件语句之前
  const { stringId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { strings, dailyData, loading, error } = useSoilingModelData();
  const { scale } = useResponsiveScale({ ... });

  const selectedDay = useMemo(() => {
    return (location.state as any)?.selectedDay || ...;
  }, [location.state, dailyData]);

  const [openAddFault, setOpenAddFault] = useState(false);

  const stringData = useMemo(() => {
    // ... 生成数据
  }, [stringId, strings, dailyData, selectedDay]);

  // ✅ 关键修复：将 ivData 的 useMemo 移到早期返回之前
  const ivData = useMemo(() => {
    // 在 hook 内部处理 null 检查
    if (!stringData) return null;

    const currentDayData = stringData.dailyData.find(d => d.day === selectedDay) ||
                           stringData.dailyData[stringData.dailyData.length - 1];
    return generateIVCurve(currentDayData.performance);
  }, [stringData, selectedDay]);

  // ✅ 现在可以安全地进行早期返回
  // 因为所有 hooks 都已经被调用了
  if (loading) {
    return <CircularProgress />;
  }

  if (error || !stringData || !ivData) {
    return <Alert>Error</Alert>;
  }

  // ✅ 继续渲染主要内容
  return (
    <Box>
      {/* 使用 ivData */}
    </Box>
  );
};
```

### 修复后的执行流程

#### 第一次渲染（loading = true）
```
1. useParams()
2. useNavigate()
3. useLocation()
4. useSoilingModelData()  → loading = true
5. useResponsiveScale()
6. useMemo(selectedDay)
7. useState(openAddFault)
8. useMemo(stringData)
9. useMemo(ivData)  ← ✅ 总是被调用！（返回 null）
10. return <CircularProgress />
```
**总共调用了 9 个 hooks**

#### 第二次渲染（loading = false）
```
1. useParams()
2. useNavigate()
3. useLocation()
4. useSoilingModelData()  → loading = false
5. useResponsiveScale()
6. useMemo(selectedDay)
7. useState(openAddFault)
8. useMemo(stringData)
9. useMemo(ivData)  ← ✅ 总是被调用！（返回实际数据）
10. if (loading) ← false
11. if (error) ← false
12. return <Box>...</Box>
```
**总共调用了 9 个 hooks**

✅ **正确：** 每次渲染都调用相同数量的 hooks，顺序也相同！

---

## 核心原理解释

### React 如何追踪 Hooks？

React 内部使用一个 **链表** 来存储 hooks 的状态，依赖于 hooks 的 **调用顺序** 而不是名称。

```javascript
// React 内部的简化概念
let hooks = [];
let currentHookIndex = 0;

function useState(initialValue) {
  const hookIndex = currentHookIndex;

  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = initialValue;
  }

  currentHookIndex++;
  return [hooks[hookIndex], (newValue) => {
    hooks[hookIndex] = newValue;
  }];
}
```

### 为什么顺序很重要？

假设有以下代码：

```typescript
const [name, setName] = useState('John');     // Hook #1
const [age, setAge] = useState(25);           // Hook #2
const [city, setCity] = useState('Beijing');  // Hook #3
```

React 内部的存储：
```
hooks[0] = 'John'    // 第一个 useState
hooks[1] = 25        // 第二个 useState
hooks[2] = 'Beijing' // 第三个 useState
```

如果在某次渲染中跳过了 Hook #2：
```
hooks[0] = 'John'    // 第一个 useState ✅
hooks[1] = 'Beijing' // 第二个 useState ❌ 错位了！
hooks[2] = undefined // 第三个 useState ❌ 缺失了！
```

这就会导致状态错乱！

---

## 最佳实践

### 1. 所有 Hooks 必须在组件顶层

```typescript
// ✅ 正确
const MyComponent = () => {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const data = useMemo(() => { ... }, []);

  if (loading) return <Spinner />;
  return <div>{data}</div>;
};

// ❌ 错误
const MyComponent = () => {
  const [state1, setState1] = useState(0);

  if (loading) return <Spinner />;

  const [state2, setState2] = useState(0); // ❌ 有时会被跳过
  return <div>{state2}</div>;
};
```

### 2. 在 Hook 内部处理条件逻辑

```typescript
// ✅ 正确：条件逻辑在 hook 内部
const data = useMemo(() => {
  if (!rawData) return null;
  return processData(rawData);
}, [rawData]);

// ❌ 错误：hook 本身在条件语句中
if (rawData) {
  const data = useMemo(() => processData(rawData), [rawData]);
}
```

### 3. 使用 ESLint 插件

安装 `eslint-plugin-react-hooks` 来自动检测错误：

```bash
npm install eslint-plugin-react-hooks --save-dev
```

`.eslintrc.json` 配置：
```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 4. 常见错误模式

#### ❌ 错误：在循环中使用 Hook
```typescript
const MyComponent = ({ items }) => {
  items.forEach(item => {
    const [selected, setSelected] = useState(false); // ❌ 错误！
  });
};
```

#### ✅ 正确：创建子组件
```typescript
const Item = ({ item }) => {
  const [selected, setSelected] = useState(false); // ✅ 正确
  return <div>{item.name}</div>;
};

const MyComponent = ({ items }) => {
  return items.map(item => <Item key={item.id} item={item} />);
};
```

#### ❌ 错误：在条件语句中使用 Hook
```typescript
const MyComponent = ({ shouldFetch }) => {
  if (shouldFetch) {
    const data = useFetch('/api/data'); // ❌ 错误！
  }
};
```

#### ✅ 正确：Hook 在顶层，条件逻辑在内部
```typescript
const MyComponent = ({ shouldFetch }) => {
  const data = useFetch(shouldFetch ? '/api/data' : null); // ✅ 正确
};
```

---

## 调试技巧

### 1. 检查 Hook 调用顺序

在开发环境中，可以添加临时日志：

```typescript
const MyComponent = () => {
  console.log('Hook 1: useParams');
  const { id } = useParams();

  console.log('Hook 2: useState');
  const [count, setCount] = useState(0);

  console.log('Hook 3: useMemo');
  const data = useMemo(() => { ... }, []);

  if (loading) {
    console.log('Early return at loading');
    return <Spinner />;
  }

  console.log('Hook 4: useEffect');
  useEffect(() => { ... }, []); // ❌ 这个可能不会总是被调用！
};
```

### 2. 使用 React DevTools

React DevTools 可以显示组件使用的所有 hooks：

1. 打开 Chrome DevTools
2. 切换到 "Components" 标签
3. 选择组件
4. 查看右侧的 "hooks" 部分

### 3. 查看错误堆栈

错误信息会告诉你具体在哪一行：

```
Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (chunk-NXESFFTV.js:11726:21)
    at StringDetail (StringDetail.tsx:420:18)  ← 错误在这一行！
```

---

## 总结

### 关键要点

1. **所有 Hooks 必须在组件的最顶层调用**
2. **不要在条件语句、循环或早期返回之后调用 Hooks**
3. **Hook 的调用顺序在每次渲染时必须保持一致**
4. **条件逻辑应该放在 Hook 内部，而不是 Hook 外部**
5. **使用 ESLint 插件自动检测违规**

### 记忆口诀

```
Hooks 在顶层，顺序要一致，
条件放里边，千万别跳过。
早期返回前，所有 Hook 调用，
React 才能正确追踪每个状态。
```

### 检查清单

在编写组件时，问自己：

- [ ] 所有 hooks 都在组件顶层吗？
- [ ] 没有 hooks 在 if 语句中吗？
- [ ] 没有 hooks 在循环中吗？
- [ ] 没有 hooks 在早期返回之后吗？
- [ ] 条件逻辑都在 hooks 内部吗？

---

## 参考资源

- [React 官方文档 - Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [React 官方文档 - Hooks FAQ](https://react.dev/reference/react/hooks#rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**编写日期：** 2025-10-01
**相关文件：** `src/pages/SoilWatch/StringDetail.tsx`
**错误代码：** 第 420 行（已修复）
