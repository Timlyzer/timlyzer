# UI 设计规范

## 1. 设计原则

### 1.1 核心理念

- **简洁高效**: 信息一目了然，减少认知负担
- **数据为主**: 突出时间数据的可视化展示
- **专业精致**: 现代化设计风格，提升用户体验
- **一致性**: 统一的视觉语言和交互模式

### 1.2 设计语言

- 采用 **扁平化设计** 与 **微立体** 结合
- 使用 **阴影** 和 **圆角** 增加层次感
- 支持 **深色/浅色** 双主题

## 2. 色彩系统

### 2.1 品牌色

```css
:root {
  /* 主色调 - 蓝色系 */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6; /* 主色 */
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
}
```

### 2.2 语义色

```css
:root {
  /* 状态色 */
  --success: #22c55e; /* 在线/成功 */
  --warning: #f59e0b; /* 空闲/警告 */
  --error: #ef4444; /* 错误 */
  --info: #3b82f6; /* 信息 */

  /* 追踪状态色 */
  --status-online: #22c55e;
  --status-idle: #f59e0b;
  --status-offline: #6b7280;
}
```

### 2.3 中性色

```css
:root {
  /* 浅色模式 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}

/* 深色模式 */
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
}

/* 浅色模式 */
.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
}
```

### 2.4 应用默认颜色

为追踪项自动生成的颜色调色板：

```typescript
const APP_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
];
```

## 3. 排版

### 3.1 字体

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### 3.2 字号

| 名称 | 大小 | 行高 | 用途           |
| ---- | ---- | ---- | -------------- |
| xs   | 12px | 16px | 辅助文字、标签 |
| sm   | 14px | 20px | 正文、列表项   |
| base | 16px | 24px | 主要正文       |
| lg   | 18px | 28px | 小标题         |
| xl   | 20px | 28px | 卡片标题       |
| 2xl  | 24px | 32px | 页面标题       |
| 3xl  | 30px | 36px | 大标题         |

### 3.3 字重

| 名称     | 值  | 用途       |
| -------- | --- | ---------- |
| normal   | 400 | 正文       |
| medium   | 500 | 强调文字   |
| semibold | 600 | 标题、按钮 |
| bold     | 700 | 主标题     |

## 4. 间距

### 4.1 间距规范

使用 **4px 基础单位** 的倍数：

| 名称 | 值   | Tailwind |
| ---- | ---- | -------- |
| 0    | 0px  | space-0  |
| 1    | 4px  | space-1  |
| 2    | 8px  | space-2  |
| 3    | 12px | space-3  |
| 4    | 16px | space-4  |
| 5    | 20px | space-5  |
| 6    | 24px | space-6  |
| 8    | 32px | space-8  |
| 10   | 40px | space-10 |
| 12   | 48px | space-12 |
| 16   | 64px | space-16 |

### 4.2 布局间距

| 场景         | 间距                  |
| ------------ | --------------------- |
| 页面边距     | 24px (p-6)            |
| 卡片间距     | 16px (gap-4)          |
| 列表项间距   | 8px (gap-2)           |
| 表单元素间距 | 12px (gap-3)          |
| 按钮内边距   | 12px 16px (px-4 py-3) |

## 5. 圆角

| 名称 | 值     | 用途           |
| ---- | ------ | -------------- |
| sm   | 4px    | 按钮、输入框   |
| md   | 6px    | 卡片、下拉菜单 |
| lg   | 8px    | 大卡片、对话框 |
| xl   | 12px   | 特殊卡片       |
| full | 9999px | 圆形元素、标签 |

## 6. 阴影

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

## 7. 组件规范

### 7.1 按钮

```jsx
// Primary Button
<button className="px-4 py-2 bg-primary-500 text-white rounded-md
  hover:bg-primary-600 transition-colors font-medium">
  Primary
</button>

// Secondary Button
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md
  hover:bg-gray-200 transition-colors font-medium dark:bg-gray-800 dark:text-gray-200">
  Secondary
</button>

// Ghost Button
<button className="px-4 py-2 text-gray-600 rounded-md
  hover:bg-gray-100 transition-colors font-medium dark:text-gray-300 dark:hover:bg-gray-800">
  Ghost
</button>
```

### 7.2 卡片

```jsx
<div
  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm 
  border border-gray-200 dark:border-slate-700 p-6"
>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Card Title
  </h3>
  <p className="text-gray-600 dark:text-gray-300">Card content...</p>
</div>
```

### 7.3 输入框

```jsx
<input
  type="text"
  className="w-full px-3 py-2 rounded-md border border-gray-300 
    focus:ring-2 focus:ring-primary-500 focus:border-transparent
    dark:bg-slate-800 dark:border-slate-600 dark:text-white
    placeholder:text-gray-400 dark:placeholder:text-gray-500"
  placeholder="Enter text..."
/>
```

### 7.4 时间线条

```jsx
// 时间线追踪项
<div
  className="h-8 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
  style={{
    backgroundColor: item.color || "#3b82f6",
    width: `${calculateWidth(item)}%`,
    marginLeft: `${calculateOffset(item)}%`,
  }}
  title={`${item.app}: ${item.title}`}
/>
```

## 8. 页面布局

### 8.1 主窗口布局

```
┌─────────────────────────────────────────────────────────────────┐
│                          Header (48px)                          │
│  [Logo] [Title]                    [Search] [Theme] [Settings]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│   Sidebar    │                 Main Content                      │
│    (240px)   │                                                   │
│              │                                                   │
│  □ Timeline  │                                                   │
│  □ Summary   │                                                   │
│  □ Search    │                                                   │
│  □ Settings  │                                                   │
│              │                                                   │
│              │                                                   │
│              │                                                   │
│              │                                                   │
├──────────────┴──────────────────────────────────────────────────┤
│                       Status Bar (24px)                          │
│  [Tracking: Code Editor - main.tsx]            [Online] 4h 32m  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 托盘窗口布局

```
┌─────────────────────────┐
│  Timlyzer        [×]    │
├─────────────────────────┤
│                         │
│  Current: VS Code       │
│  Duration: 0:45         │
│                         │
├─────────────────────────┤
│  Today                  │
│  ████████████████░░░░   │
│  5h 23m online          │
│                         │
├─────────────────────────┤
│  [Start Task] [Open]    │
└─────────────────────────┘
```

## 9. 时间线设计

### 9.1 三轨道布局

```
┌─────────────────────────────────────────────────────────────────┐
│                        Time Ruler                               │
│  09:00   10:00   11:00   12:00   13:00   14:00   15:00   16:00  │
├─────────────────────────────────────────────────────────────────┤
│ Task   │                                                         │
│  (32px)│ █████ Meeting ████ │      │ ████ Development █████████│
├────────┼────────────────────────────────────────────────────────┤
│ Status │                                                         │
│  (32px)│ ████████████████████████████████████████████ │░░Idle░░│
├────────┼────────────────────────────────────────────────────────┤
│ App    │                                                         │
│  (32px)│ █Chrome█│██VSCode███│█Slack█│████████ VSCode █████████│
└────────┴────────────────────────────────────────────────────────┘
```

### 9.2 追踪项样式

```css
.track-item {
  height: 28px;
  border-radius: 4px;
  font-size: 12px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: white;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.track-item:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.track-item.selected {
  outline: 2px solid white;
  outline-offset: 1px;
}
```

## 10. 动画

### 10.1 过渡

```css
/* 默认过渡 */
.transition-default {
  transition: all 150ms ease-in-out;
}

/* 颜色过渡 */
.transition-colors {
  transition: background-color 150ms, border-color 150ms, color 150ms;
}

/* 大小过渡 */
.transition-transform {
  transition: transform 200ms ease-out;
}
```

### 10.2 微动画

```css
/* 悬停放大 */
.hover-scale:hover {
  transform: scale(1.02);
}

/* 按下缩小 */
.active-scale:active {
  transform: scale(0.98);
}

/* 淡入 */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 200ms ease-out;
}

/* 滑入 */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 200ms ease-out;
}
```

## 11. 响应式设计

### 11.1 断点

| 名称 | 宽度   | 说明      |
| ---- | ------ | --------- |
| sm   | 640px  | 小屏桌面  |
| md   | 768px  | 平板/中屏 |
| lg   | 1024px | 标准桌面  |
| xl   | 1280px | 大屏桌面  |

### 11.2 最小窗口尺寸

- 主窗口: 800 x 600 px
- 托盘窗口: 300 x 400 px

## 12. 图标

使用 **Lucide React** 图标库：

```tsx
import {
  Clock,
  Calendar,
  Search,
  Settings,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  BarChart3,
} from "lucide-react";

// 使用示例
<Clock className="w-5 h-5 text-gray-500" />;
```

常用图标映射：

| 功能     | 图标      |
| -------- | --------- |
| 时间线   | Clock     |
| 日历     | Calendar  |
| 搜索     | Search    |
| 设置     | Settings  |
| 开始任务 | Play      |
| 停止任务 | Pause     |
| 统计     | BarChart3 |
| 应用     | Monitor   |
| 浅色模式 | Sun       |
| 深色模式 | Moon      |

---

_文档最后更新: 2026-01-01_
