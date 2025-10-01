# `getStringPerformanceForDay` 方法逻辑分析

## 问题发现

方法名称：`getStringPerformanceForDay(day: number)`
功能：获取指定某一天的 String 性能数据

**用户提出的关键问题：**
> "既然是 get string performance for day, why map the data from data.strings, shouldn't from dailydata.stringdata?"

## 当前实现（有问题）

```typescript
const getStringPerformanceForDay = useCallback(
  (day: number): StringPerformance[] => {
    if (!data) return [];

    const dayData = getDataForDay(day);
    if (!dayData) return data.strings;

    // ❌ 问题：从 data.strings 映射，而不是从 dayData.stringData
    return data.strings.map((string) => {
      const stringDailyData = dayData.stringData.find(
        (sd) => sd.stringId === string.id
      );

      // ❌ 问题：只在 offline 时更新 performance
      if (stringDailyData?.isOffline) {
        return {
          ...string,
          performance: 0,
          status: -1,
        };
      }

      // ❌ 严重问题：在线时返回基准性能，没有考虑 soiling 损失！
      return string;
    });
  },
  [data, getDataForDay],
);
```

## 数据结构分析

### 1. `data.strings` - 基准性能数据
```json
{
  "id": "string-1",
  "name": "String 1",
  "performance": 95.2,  // ← 这是 clean/baseline 性能
  "status": 0
}
```

### 2. `dayData.stringData` - 某一天的实际状态
```json
{
  "stringId": "string-1",
  "soilingPercentage": 1.47,  // ← 当天的 soiling 损失百分比
  "isOffline": false
}
```

### 3. 时间演变示例

| Day | soilingPercentage | 说明 |
|-----|------------------|------|
| 1   | 0.0 - 0.01      | 刚清洁，几乎无soiling |
| 30  | 0.25 - 0.35     | 累积了一些soiling |
| 60  | 1.47            | 累积更多soiling |

## 逻辑错误分析

### 错误 1：数据源选择错误

**当前逻辑：**
```typescript
return data.strings.map((string) => { ... });
```

**问题：**
- `data.strings` 包含的是**基准性能**（clean condition）
- 方法名是 `getStringPerformanceForDay`，应该返回**特定某天的性能**
- 某天的性能 = 基准性能 - soiling损失

### 错误 2：只考虑 offline 情况

**当前逻辑：**
```typescript
if (stringDailyData?.isOffline) {
  return { ...string, performance: 0, status: -1 };
}
return string;  // ← 返回基准性能，忽略 soilingPercentage！
```

**问题示例：**

假设 String 1 的基准性能是 95.2%

- Day 1: soilingPercentage = 0
  - **期望**：performance ≈ 95.2%
  - **实际**：返回 95.2%（碰巧正确）

- Day 60: soilingPercentage = 1.47
  - **期望**：performance = 95.2 × (1 - 1.47/100) = 93.8%
  - **实际**：返回 95.2%（❌ 错误！）

**结论：当前代码完全忽略了 `soilingPercentage` 字段！**

### 错误 3：没有使用 stringData 的核心数据

`stringData` 中的 `soilingPercentage` 字段完全没有被使用，这导致：
- 所有在线的 string 都显示基准性能
- 无法反映 soiling 随时间累积的影响
- UI 上的性能数据不准确

## 正确的实现

### 方案 1：保持从 data.strings 映射（推荐）

这个方案保留了所有 string 的完整信息，即使某些 string 在某天没有数据。

```typescript
const getStringPerformanceForDay = useCallback(
  (day: number): StringPerformance[] => {
    if (!data) return [];

    const dayData = getDataForDay(day);
    if (!dayData) return data.strings;

    // ✅ 从 data.strings 映射，但使用 dayData 更新性能
    return data.strings.map((string) => {
      const stringDailyData = dayData.stringData.find(
        (sd) => sd.stringId === string.id
      );

      // 如果当天没有该 string 的数据，返回基准性能
      if (!stringDailyData) {
        return string;
      }

      // ✅ 处理 offline 情况
      if (stringDailyData.isOffline) {
        return {
          ...string,
          performance: 0,
          status: -1,
        };
      }

      // ✅ 关键修复：根据 soilingPercentage 计算实际性能
      return {
        ...string,
        performance: string.performance * (1 - stringDailyData.soilingPercentage / 100),
        status: 1,
      };
    });
  },
  [data, getDataForDay],
);
```

### 方案 2：从 dayData.stringData 映射（用户建议）

这个方案更直接，但需要确保 dayData.stringData 包含所有 string。

```typescript
const getStringPerformanceForDay = useCallback(
  (day: number): StringPerformance[] => {
    if (!data) return [];

    const dayData = getDataForDay(day);
    if (!dayData) return data.strings;

    // ✅ 直接从 dayData.stringData 映射
    return dayData.stringData.map((stringDailyData) => {
      // 查找基准信息
      const baseString = data.strings.find(
        (s) => s.id === stringDailyData.stringId
      );

      if (!baseString) {
        // 如果找不到基准信息，跳过（理论上不应该发生）
        return null;
      }

      // 处理 offline
      if (stringDailyData.isOffline) {
        return {
          ...baseString,
          performance: 0,
          status: -1,
        };
      }

      // 计算实际性能
      return {
        ...baseString,
        performance: baseString.performance * (1 - stringDailyData.soilingPercentage / 100),
        status: 1,
      };
    }).filter(Boolean) as StringPerformance[];
  },
  [data, getDataForDay],
);
```

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| 方案1 (从 data.strings) | - 确保返回所有 string<br>- 即使某天数据缺失也能处理 | - 需要 find 查询 |
| 方案2 (从 dayData.stringData) | - 更符合方法名语义<br>- 直接使用当天数据 | - 如果数据不完整可能丢失 string<br>- 需要反向查找基准信息 |

**推荐使用方案1**，因为它更健壮。

## 性能计算公式

### 公式推导

假设：
- `basePerformance` = 基准性能（clean condition）= 95.2%
- `soilingPercentage` = soiling 损失百分比 = 1.47%

则：
```
actualPerformance = basePerformance × (1 - soilingPercentage / 100)
                  = 95.2 × (1 - 1.47 / 100)
                  = 95.2 × 0.9853
                  = 93.8%
```

### 公式验证

| 场景 | soilingPercentage | 计算 | 结果 |
|------|------------------|------|------|
| 刚清洁 | 0% | 95.2 × (1 - 0/100) | 95.2% ✅ |
| 轻度污染 | 0.5% | 95.2 × (1 - 0.5/100) | 94.7% ✅ |
| 中度污染 | 1.47% | 95.2 × (1 - 1.47/100) | 93.8% ✅ |
| 严重污染 | 5% | 95.2 × (1 - 5/100) | 90.4% ✅ |
| 离线 | - | 固定返回 | 0% ✅ |

## 影响范围分析

这个 bug 影响了所有调用 `getStringPerformanceForDay` 的地方：

### 1. SoilWatchOverview.tsx
```typescript
const stringsForSelectedDay = useMemo(() => {
  return getStringPerformanceForDay(selectedDay);
}, [selectedDay, getStringPerformanceForDay]);
```

**影响：**
- Overview 页面显示的 String 性能都是基准值
- 不会随选择的天数变化（除了 offline 状态）
- Heatmap 颜色不准确

### 2. 可能的其他使用场景
- 任何需要显示特定日期 String 性能的组件
- 性能趋势图表
- 性能统计计算

## 测试验证

修复后应该验证：

### 测试用例 1：在线 String 的性能计算
```typescript
// 给定
const basePerformance = 95.2;
const day60SoilingPercentage = 1.47;

// 期望
const expectedPerformance = 95.2 * (1 - 1.47/100);  // ≈ 93.8

// 验证
const result = getStringPerformanceForDay(60);
const string1 = result.find(s => s.id === 'string-1');
expect(string1.performance).toBeCloseTo(93.8, 1);
```

### 测试用例 2：离线 String
```typescript
// 验证
const result = getStringPerformanceForDay(60);
const string19 = result.find(s => s.id === 'string-19');
expect(string19.performance).toBe(0);
expect(string19.status).toBe(-1);
```

### 测试用例 3：不同天数的性能变化
```typescript
const day1Result = getStringPerformanceForDay(1);
const day60Result = getStringPerformanceForDay(60);

const string1Day1 = day1Result.find(s => s.id === 'string-1');
const string1Day60 = day60Result.find(s => s.id === 'string-1');

// Day 1 的性能应该更高（soiling 更少）
expect(string1Day1.performance).toBeGreaterThan(string1Day60.performance);
```

## 总结

### 核心问题
1. **没有使用 `soilingPercentage`**：忽略了最重要的当天性能数据
2. **返回基准性能**：返回 clean condition 的性能，而不是考虑 soiling 后的实际性能
3. **方法名与实现不符**：名为 "get performance for day"，实际返回的是基准性能

### 修复要点
1. ✅ 使用 `stringDailyData.soilingPercentage` 计算性能
2. ✅ 公式：`actualPerformance = basePerformance × (1 - soilingPercentage / 100)`
3. ✅ 处理三种情况：
   - 无数据：返回基准性能
   - 离线：performance = 0, status = -1
   - 在线：根据 soiling 计算性能

### 学习要点
1. **方法名要准确**：方法名应该准确反映其功能
2. **理解数据结构**：区分基准数据和实时数据
3. **不要忽略字段**：如果数据结构中有字段，很可能是有用的
4. **测试边界情况**：测试不同天数、不同状态的数据

---

**日期：** 2025-10-01
**相关文件：** `src/pages/SoilWatch/hooks/useSoilingModelData.ts`
**问题行数：** 151-176
