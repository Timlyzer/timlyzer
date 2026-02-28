# Timlyzer 新架构设计

## 1. 技术选型

### 1.1 核心框架对比

| 特性         | Electron               | Tauri                  |
| ------------ | ---------------------- | ---------------------- |
| **后端语言** | Node.js                | Rust                   |
| **打包大小** | ~150MB                 | ~10-30MB               |
| **内存占用** | 较高                   | 低                     |
| **启动速度** | 慢                     | 快                     |
| **安全性**   | 一般                   | 高（沙箱机制）         |
| **跨平台**   | ✅ Windows/macOS/Linux | ✅ Windows/macOS/Linux |
| **系统 API** | 通过 Node.js           | 通过 Rust              |

### 1.2 新技术栈

| 类别          | 技术                      | 说明                     |
| ------------- | ------------------------- | ------------------------ |
| **桌面框架**  | Tauri 2.x                 | Rust 后端，轻量高效      |
| **前端框架**  | React 18+                 | 稳定成熟的 UI 框架       |
| **样式方案**  | Tailwind CSS 3.x          | 实用优先的 CSS 框架      |
| **UI 组件库** | shadcn/ui                 | 基于 Radix UI 的现代组件 |
| **状态管理**  | Zustand                   | 轻量级状态管理           |
| **路由**      | React Router 6            | SPA 路由                 |
| **图表库**    | Recharts / Apache ECharts | 数据可视化               |
| **日期处理**  | date-fns                  | 轻量日期库               |
| **数据库**    | SQLite (rusqlite)         | Rust 原生 SQLite 支持    |
| **ORM**       | sea-orm / diesel          | Rust ORM 选项            |
| **构建工具**  | Vite                      | 快速前端构建             |

## 2. 项目结构设计

```
timlyzer/
├── src-tauri/                  # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── main.rs             # 应用入口
│   │   ├── lib.rs              # 库入口
│   │   ├── commands/           # Tauri 命令处理器
│   │   │   ├── mod.rs
│   │   │   ├── track_item.rs   # 追踪项相关命令
│   │   │   ├── settings.rs     # 设置相关命令
│   │   │   └── app.rs          # 应用控制命令
│   │   ├── database/           # 数据库层
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs       # 数据库模式
│   │   │   ├── models.rs       # 数据模型
│   │   │   └── repository.rs   # 数据仓库
│   │   ├── services/           # 业务服务
│   │   │   ├── mod.rs
│   │   │   ├── tracker.rs      # 追踪服务
│   │   │   ├── active_window.rs # 活动窗口检测
│   │   │   └── state_monitor.rs # 状态监控
│   │   ├── system/             # 系统交互
│   │   │   ├── mod.rs
│   │   │   ├── idle.rs         # 空闲检测
│   │   │   └── power.rs        # 电源状态
│   │   └── utils/              # 工具函数
│   ├── Cargo.toml              # Rust 依赖配置
│   ├── tauri.conf.json         # Tauri 配置
│   └── icons/                  # 应用图标
│
├── src/                        # 前端 (React + TypeScript)
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件 (shadcn)
│   │   ├── layout/             # 布局组件
│   │   ├── timeline/           # 时间线组件
│   │   ├── charts/             # 图表组件
│   │   ├── settings/           # 设置组件
│   │   └── tray/               # 托盘窗口组件
│   ├── pages/                  # 页面组件
│   │   ├── Timeline.tsx
│   │   ├── Summary.tsx
│   │   ├── Search.tsx
│   │   └── Settings.tsx
│   ├── hooks/                  # 自定义 Hooks
│   ├── stores/                 # Zustand 状态存储
│   ├── services/               # API 服务层
│   │   └── tauri-api.ts        # Tauri 命令调用封装
│   ├── types/                  # TypeScript 类型
│   ├── lib/                    # 工具库
│   ├── App.tsx                 # 应用入口
│   ├── main.tsx                # React 入口
│   └── index.css               # 全局样式 (Tailwind)
│
├── public/                     # 静态资源
├── index.html                  # HTML 入口
├── package.json                # Node.js 依赖
├── postcss.config.js           # PostCSS 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
└── docs/                       # 文档目录
```

## 3. 核心架构设计

### 3.1 整体架构图

```
┌───────────────────────────────────────────────────────────────────┐
│                         Timlyzer 应用                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  前端 (WebView/Renderer)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  React   │  │ Tailwind │  │ Recharts │  │   Zustand   │  │  │
│  │  │   18+    │  │   CSS    │  │  Charts  │  │  State Mgmt │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       │             │             │               │          │  │
│  │       └─────────────┴─────────────┴───────────────┘          │  │
│  │                           │                                   │  │
│  │              ┌────────────┴────────────┐                     │  │
│  │              │      tauri-api.ts       │                     │  │
│  │              │   (Tauri IPC Wrapper)   │                     │  │
│  │              └────────────┬────────────┘                     │  │
│  └───────────────────────────┼──────────────────────────────────┘  │
│                              │ Tauri IPC (invoke)                   │
│  ┌───────────────────────────┼──────────────────────────────────┐  │
│  │                    Rust 后端 (Main Process)                   │  │
│  │              ┌────────────┴────────────┐                     │  │
│  │              │   commands/ (handlers)  │                     │  │
│  │              │    #[tauri::command]    │                     │  │
│  │              └────────────┬────────────┘                     │  │
│  │                           │                                   │  │
│  │  ┌────────────────────────┴────────────────────────────────┐ │  │
│  │  │                  services/ (业务逻辑)                    │ │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │ │  │
│  │  │  │   Tracker    │ │ActiveWindow  │ │  StateMonitor  │  │ │  │
│  │  │  │   Service    │ │   Service    │ │    Service     │  │ │  │
│  │  │  └──────┬───────┘ └──────┬───────┘ └───────┬────────┘  │ │  │
│  │  └─────────┼────────────────┼─────────────────┼───────────┘ │  │
│  │            │                │                 │              │  │
│  │  ┌─────────┴────────────────┴─────────────────┴───────────┐ │  │
│  │  │                   database/ (数据层)                    │ │  │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │  │
│  │  │  │                    SQLite                           │ │ │  │
│  │  │  │     [track_items]  [app_settings]  [settings]       │ │ │  │
│  │  │  └────────────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────┐                                         │  │
│  │  │   system/ API  │  空闲检测、电源状态、活动窗口             │  │
│  │  └────────────────┘                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │   Main Window  │  │  Tray Window   │  │  System Tray (Menu)    │ │
│  └────────────────┘  └────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 前端-后端通信

#### Tauri 命令定义 (Rust)

```rust
// src-tauri/src/commands/track_item.rs

use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackItem {
    pub id: Option<i64>,
    pub app: String,
    pub task_name: String,
    pub title: String,
    pub url: Option<String>,
    pub color: Option<String>,
    pub begin_date: i64,
    pub end_date: i64,
}

#[tauri::command]
pub async fn find_all_day_items(
    state: State<'_, AppState>,
    from: i64,
    to: i64,
    task_name: String,
) -> Result<Vec<TrackItem>, String> {
    // 从数据库查询
    let items = state.db.find_items(from, to, &task_name)
        .map_err(|e| e.to_string())?;
    Ok(items)
}

#[tauri::command]
pub async fn create_track_item(
    state: State<'_, AppState>,
    track_item: TrackItem,
) -> Result<TrackItem, String> {
    let item = state.db.create_item(track_item)
        .map_err(|e| e.to_string())?;
    Ok(item)
}
```

#### 前端调用封装 (TypeScript)

```typescript
// src/services/tauri-api.ts

import { invoke } from "@tauri-apps/api/core";

export interface TrackItem {
  id?: number;
  app: string;
  taskName: string;
  title: string;
  url?: string;
  color?: string;
  beginDate: number;
  endDate: number;
}

export const trackItemApi = {
  findAllDayItems: async (from: number, to: number, taskName: string) => {
    return invoke<TrackItem[]>("find_all_day_items", { from, to, taskName });
  },

  createTrackItem: async (trackItem: TrackItem) => {
    return invoke<TrackItem>("create_track_item", { trackItem });
  },

  updateTrackItem: async (trackItem: TrackItem) => {
    return invoke<TrackItem>("update_track_item", { trackItem });
  },

  deleteByIds: async (ids: number[]) => {
    return invoke<void>("delete_by_ids", { ids });
  },

  searchItems: async (params: SearchParams) => {
    return invoke<SearchResult>("search_items", params);
  },
};
```

### 3.3 后台任务服务

```rust
// src-tauri/src/services/tracker.rs

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::interval;

pub struct TrackerService {
    state: Arc<RwLock<TrackerState>>,
    db: Arc<Database>,
}

impl TrackerService {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            state: Arc::new(RwLock::new(TrackerState::default())),
            db,
        }
    }

    /// 启动追踪循环
    pub async fn start(&self) {
        let mut interval = interval(Duration::from_secs(3));

        loop {
            interval.tick().await;

            // 检查系统状态
            if self.is_system_idle().await {
                continue;
            }

            // 获取活动窗口
            if let Some(window) = self.get_active_window().await {
                self.update_track_item(window).await;
            }
        }
    }

    async fn update_track_item(&self, window: ActiveWindow) {
        let mut state = self.state.write().await;
        let now = chrono::Utc::now().timestamp_millis();

        // 如果窗口变化，保存当前项并创建新项
        if state.current_app != window.app || state.current_title != window.title {
            if let Some(current) = state.current_item.take() {
                let mut item = current;
                item.end_date = now;
                self.db.insert_track_item(&item).await.ok();
            }

            state.current_item = Some(TrackItem {
                app: window.app.clone(),
                title: window.title.clone(),
                task_name: "AppTrackItem".to_string(),
                begin_date: now,
                end_date: now,
                ..Default::default()
            });
            state.current_app = window.app;
            state.current_title = window.title;
        }
    }
}
```

## 4. 关键技术实现

### 4.1 跨平台活动窗口检测

Tauri/Rust 可以使用以下 crate：

| 平台        | 解决方案                          |
| ----------- | --------------------------------- |
| **macOS**   | `core-graphics` + `cocoa` crates  |
| **Windows** | `windows-sys` crate               |
| **Linux**   | `x11rb` / `wayland-client` crates |

推荐使用 [`active-win-pos-rs`](https://crates.io/crates/active-win-pos-rs) 或 [`windows`](https://crates.io/crates/windows) crate。

### 4.2 系统空闲检测

```rust
// src-tauri/src/system/idle.rs

use std::time::Duration;

#[cfg(target_os = "macos")]
pub fn get_idle_time() -> Duration {
    // 使用 IOKit 获取空闲时间
    use core_foundation::number::CFNumber;
    // ... implementation
}

#[cfg(target_os = "windows")]
pub fn get_idle_time() -> Duration {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::GetLastInputInfo;
    // ... implementation
}

#[cfg(target_os = "linux")]
pub fn get_idle_time() -> Duration {
    // 使用 X11 ScreenSaver 扩展
    // ... implementation
}
```

### 4.3 系统托盘

Tauri 2.x 内置系统托盘支持：

```rust
// src-tauri/src/main.rs

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
};

fn setup_tray(app: &tauri::App) -> Result<TrayIcon, tauri::Error> {
    let menu = Menu::with_items(app, &[
        &MenuItem::new(app, "Open", true, None)?,
        &MenuItem::new(app, "Settings", true, None)?,
        &MenuItem::new(app, "Quit", true, None)?,
    ])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => app.exit(0),
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().unwrap();
                    }
                }
                _ => {}
            }
        })
        .build(app)
}
```

### 4.4 多窗口支持

```json
// src-tauri/tauri.conf.json
{
  "app": {
    "windows": [
      {
        "title": "Timlyzer",
        "label": "main",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      },
      {
        "title": "Timlyzer Tray",
        "label": "tray",
        "width": 300,
        "height": 400,
        "resizable": false,
        "decorations": false,
        "visible": false,
        "skipTaskbar": true
      }
    ]
  }
}
```

## 5. 前端设计规范

### 5.1 Tailwind CSS 配置

```javascript
// tailwind.config.js
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 自定义调色板
        primary: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          900: "#0c4a6e",
        },
        // 追踪项状态颜色
        status: {
          online: "#22c55e",
          idle: "#f59e0b",
          offline: "#6b7280",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
};
```

### 5.2 shadcn/ui 组件使用

```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 添加常用组件
npx shadcn@latest add button card dialog dropdown-menu input
npx shadcn@latest add select tabs table tooltip calendar
```

### 5.3 状态管理 (Zustand)

```typescript
// src/stores/timeline-store.ts

import { create } from "zustand";
import { TrackItem } from "@/types";

interface TimelineState {
  // State
  timeRange: [number, number];
  visibleRange: [number, number];
  trackItems: TrackItem[];
  isLoading: boolean;
  selectedItem: TrackItem | null;

  // Actions
  setTimeRange: (range: [number, number]) => void;
  setVisibleRange: (range: [number, number]) => void;
  fetchTrackItems: () => Promise<void>;
  selectItem: (item: TrackItem | null) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timeRange: [getTodayStart(), getTodayEnd()],
  visibleRange: [Date.now() - 3600000, Date.now() + 3600000],
  trackItems: [],
  isLoading: false,
  selectedItem: null,

  setTimeRange: (range) => set({ timeRange: range }),
  setVisibleRange: (range) => set({ visibleRange: range }),

  fetchTrackItems: async () => {
    set({ isLoading: true });
    const { timeRange } = get();
    const items = await trackItemApi.findAllDayItems(
      timeRange[0],
      timeRange[1],
      "AppTrackItem",
    );
    set({ trackItems: items, isLoading: false });
  },

  selectItem: (item) => set({ selectedItem: item }),
}));
```

## 6. 开发工作流

### 6.1 环境准备

```bash
# 1. 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. 安装 Node.js (推荐 v20+)
# 使用 nvm 或 fnm

# 3. 安装 Tauri CLI
cargo install tauri-cli

# 4. 安装前端依赖
pnpm install

# 5. 开发模式运行
pnpm tauri dev

# 6. 构建发布包
pnpm tauri build
```

### 6.2 开发命令

| 命令               | 说明                    |
| ------------------ | ----------------------- |
| `pnpm dev`         | 仅运行前端开发服务器    |
| `pnpm tauri dev`   | 运行完整 Tauri 开发环境 |
| `pnpm tauri build` | 构建生产包              |
| `pnpm build`       | 仅构建前端              |
| `pnpm lint`        | 代码检查                |
| `pnpm test`        | 运行测试                |

## 7. 下一步计划

详见 `02-implementation-plan.md`
