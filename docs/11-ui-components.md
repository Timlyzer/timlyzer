# UI 组件库文档

> 📅 创建日期: 2026-01-01
> 🎨 样式系统: 纯 Tailwind CSS

本项目使用纯 Tailwind CSS 实现所有 UI 组件，不依赖任何第三方 UI 组件库（如 shadcn/ui、Radix UI 等）。

---

## 设计原则

1. **纯 Tailwind**: 所有样式都使用 Tailwind CSS 类名
2. **深色模式**: 所有组件都支持 `dark:` 变体
3. **响应式**: 使用 Tailwind 的响应式前缀
4. **可访问性**: 使用语义化 HTML 和 ARIA 属性
5. **可组合**: 组件设计为可组合使用

---

## 组件列表

### 基础组件

| 组件          | 路径                              | 说明       |
| ------------- | --------------------------------- | ---------- |
| `Button`      | `@/components/ui/button.tsx`      | 按钮组件   |
| `Card`        | `@/components/ui/card.tsx`        | 卡片组件   |
| `ColorPicker` | `@/components/ui/ColorPicker.tsx` | 颜色选择器 |

### 布局组件

| 组件     | 路径                             | 说明               |
| -------- | -------------------------------- | ------------------ |
| `Layout` | `@/components/layout/Layout.tsx` | 主布局，包含侧边栏 |

### 功能组件

| 组件            | 路径                                      | 说明         |
| --------------- | ----------------------------------------- | ------------ |
| `Timeline`      | `@/components/timeline/Timeline.tsx`      | 时间线主组件 |
| `TimelineTrack` | `@/components/timeline/TimelineTrack.tsx` | 时间线轨道   |
| `TimeRuler`     | `@/components/timeline/TimeRuler.tsx`     | 时间刻度尺   |

---

## 组件使用示例

### Button 组件

```tsx
import { Button } from "@/components/ui";

// 默认按钮
<Button>Click me</Button>

// 不同变体
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>

// 不同尺寸
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card 组件

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### ColorPicker 组件

```tsx
import { ColorPicker } from "@/components/ui";

const [color, setColor] = useState("#3b82f6");

<ColorPicker color={color} onChange={setColor} size="md" />;
```

---

## 颜色系统

项目使用 Tailwind CSS 默认的颜色调色板，主要颜色：

| 用途     | 浅色模式    | 深色模式    |
| -------- | ----------- | ----------- |
| 主色调   | `blue-500`  | `blue-500`  |
| 背景     | `white`     | `slate-900` |
| 卡片背景 | `white`     | `slate-900` |
| 文字     | `slate-900` | `slate-100` |
| 次要文字 | `slate-500` | `slate-400` |
| 边框     | `slate-200` | `slate-700` |

---

## 工具函数

### cn() - 类名合并

```tsx
import { cn } from "@/lib/utils";

// 合并多个类名
<div className={cn("base-class", isActive && "active-class", className)} />;
```

### 其他工具

- `formatDuration(ms)` - 格式化毫秒为可读时间
- `stringToColor(str)` - 从字符串生成一致的颜色
- `getGreeting()` - 获取当前时段的问候语

---

## 添加新组件

1. 在 `src/components/ui/` 目录创建组件文件
2. 使用纯 Tailwind CSS 类名
3. 支持 `className` prop 以允许覆盖样式
4. 使用 `cn()` 函数合并类名
5. 在 `src/components/ui/index.ts` 中导出

示例：

```tsx
// src/components/ui/badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
```

---

## 样式约定

1. **间距**: 使用 4 的倍数 (`p-2`, `p-4`, `p-6`)
2. **圆角**: 使用 `rounded-lg` 或 `rounded-xl`
3. **阴影**: 使用 `shadow-sm` 或 `shadow-md`
4. **过渡**: 使用 `transition-all` 或 `transition-colors`
5. **深色模式**: 始终添加 `dark:` 变体

---

_文档最后更新: 2026-01-01_
