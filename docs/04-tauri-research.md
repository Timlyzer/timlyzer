# Tauri 技术调研

## 1. Tauri 概述

### 1.1 什么是 Tauri

Tauri 是一个用于构建跨平台桌面应用的工具包。它允许开发者使用 **Web 技术**（HTML, CSS, JavaScript）构建前端 UI，同时使用 **Rust** 编写后端逻辑。

### 1.2 核心优势

| 特性         | Tauri       | Electron | 说明                   |
| ------------ | ----------- | -------- | ---------------------- |
| **打包大小** | ~3-10 MB    | ~150 MB+ | Tauri 使用系统 WebView |
| **内存占用** | 低          | 高       | 不需要打包 Chromium    |
| **安全性**   | 高          | 一般     | Rust 内存安全 + 沙箱   |
| **启动速度** | 快          | 较慢     | 原生二进制             |
| **后端能力** | Rust (强大) | Node.js  | 系统级 API 访问        |

### 1.3 系统 WebView

Tauri 使用各操作系统内置的 WebView：

| 平台        | WebView                  |
| ----------- | ------------------------ |
| **macOS**   | WebKit (Safari 引擎)     |
| **Windows** | WebView2 (Edge/Chromium) |
| **Linux**   | WebKitGTK                |

## 2. Tauri 2.x 新特性

Tauri 2.0 于 2024 年发布，带来重大更新：

### 2.1 主要变化

- **移动端支持** - iOS 和 Android
- **插件系统重构** - 更灵活的插件架构
- **权限系统** - 细粒度的安全控制
- **新的 API 设计** - 更简洁的 Rust 和 JS API

### 2.2 核心 API

```rust
// Tauri 2.x 命令系统
#[tauri::command]
async fn greet(name: &str) -> Result<String, String> {
    Ok(format!("Hello, {}!", name))
}

// 注册命令
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// 前端调用
import { invoke } from "@tauri-apps/api/core";

const greeting = await invoke<string>("greet", { name: "World" });
```

## 3. 关键功能实现

### 3.1 系统托盘 (Tray)

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    Manager,
};

pub fn setup_tray(app: &tauri::App) -> Result<TrayIcon, tauri::Error> {
    // 创建菜单
    let menu = Menu::with_items(app, &[
        &MenuItem::new(app, "Open Timlyzer", true, None::<&str>)?,
        &MenuItem::new(app, "Quit", true, None::<&str>)?,
    ])?;

    // 创建托盘
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => app.exit(0),
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)
}
```

### 3.2 多窗口管理

```json
// tauri.conf.json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Timlyzer",
        "width": 1200,
        "height": 800,
        "center": true,
        "resizable": true
      },
      {
        "label": "tray",
        "title": "Quick View",
        "width": 320,
        "height": 400,
        "visible": false,
        "decorations": false,
        "skipTaskbar": true,
        "alwaysOnTop": true
      }
    ]
  }
}
```

```rust
// 动态创建/显示窗口
use tauri::Manager;

#[tauri::command]
async fn show_tray_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("tray") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

### 3.3 后台任务

```rust
use std::time::Duration;
use tokio::time::interval;
use tauri::async_runtime::spawn;

pub fn start_background_tracker(app_handle: tauri::AppHandle) {
    spawn(async move {
        let mut interval = interval(Duration::from_secs(3));

        loop {
            interval.tick().await;

            // 执行追踪逻辑
            if let Err(e) = track_active_window(&app_handle).await {
                eprintln!("Tracking error: {}", e);
            }
        }
    });
}

async fn track_active_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // 获取活动窗口信息
    let window_info = get_active_window()?;

    // 保存到数据库
    // ...

    // 发送事件到前端（可选）
    app.emit("track-item-updated", &window_info)?;

    Ok(())
}
```

### 3.4 事件系统

```rust
// Rust 发送事件到前端
use tauri::Emitter;

#[tauri::command]
async fn start_tracking(app: tauri::AppHandle) -> Result<(), String> {
    // 发送事件
    app.emit("tracking-started", ()).map_err(|e| e.to_string())?;
    Ok(())
}
```

```typescript
// 前端监听事件
import { listen } from "@tauri-apps/api/event";

// 监听追踪更新
const unlisten = await listen<TrackItem>("track-item-updated", (event) => {
  console.log("New track item:", event.payload);
  updateTimeline(event.payload);
});

// 清理监听器
unlisten();
```

### 3.5 文件系统访问

```rust
use tauri_plugin_fs::FsExt;

#[tauri::command]
async fn save_export(app: tauri::AppHandle, data: String) -> Result<(), String> {
    use std::fs;

    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let file_path = app_dir.join("export.csv");
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(())
}
```

### 3.6 自动更新

```rust
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY",
      "endpoints": [
        "https://releases.timlyzer.com/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

```typescript
import { check } from "@tauri-apps/plugin-updater";

async function checkForUpdates() {
  const update = await check();

  if (update) {
    console.log(`New version ${update.version} available`);

    // 下载并安装
    await update.downloadAndInstall();
  }
}
```

## 4. 跨平台活动窗口检测

### 4.1 使用 active-win-pos-rs Crate

```toml
# Cargo.toml
[dependencies]
active-win-pos-rs = "0.8"
```

```rust
use active_win_pos_rs::get_active_window;

#[derive(serde::Serialize)]
pub struct WindowInfo {
    pub app_name: String,
    pub title: String,
    pub process_id: u32,
}

#[tauri::command]
pub fn get_current_window() -> Result<WindowInfo, String> {
    match get_active_window() {
        Ok(window) => Ok(WindowInfo {
            app_name: window.app_name,
            title: window.title,
            process_id: window.process_id as u32,
        }),
        Err(e) => Err(e.to_string()),
    }
}
```

### 4.2 macOS 原生实现 (可选)

```rust
#[cfg(target_os = "macos")]
mod macos {
    use core_foundation::base::{CFType, TCFType};
    use core_graphics::display::CGDisplay;

    pub fn get_frontmost_app() -> Option<String> {
        // 使用 NSWorkspace API
        // ...
    }
}
```

### 4.3 Windows 原生实现 (可选)

```rust
#[cfg(target_os = "windows")]
mod windows {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW,
    };

    pub fn get_active_window_title() -> String {
        unsafe {
            let hwnd = GetForegroundWindow();
            let mut title: [u16; 256] = [0; 256];
            GetWindowTextW(hwnd, &mut title);
            String::from_utf16_lossy(&title)
        }
    }
}
```

## 5. 数据库集成

### 5.1 使用 rusqlite

```toml
# Cargo.toml
[dependencies]
rusqlite = { version = "0.31", features = ["bundled"] }
```

```rust
use rusqlite::{Connection, Result};
use std::sync::{Arc, Mutex};

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;

        // 创建表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS track_items (
                id INTEGER PRIMARY KEY,
                app TEXT NOT NULL,
                title TEXT NOT NULL,
                task_name TEXT NOT NULL,
                begin_date INTEGER NOT NULL,
                end_date INTEGER NOT NULL,
                color TEXT,
                url TEXT
            )",
            [],
        )?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn insert_track_item(&self, item: &TrackItem) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO track_items (app, title, task_name, begin_date, end_date, color, url)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &item.app,
                &item.title,
                &item.task_name,
                &item.begin_date.to_string(),
                &item.end_date.to_string(),
                &item.color.clone().unwrap_or_default(),
                &item.url.clone().unwrap_or_default(),
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }
}
```

### 5.2 使用 sea-orm (可选)

```toml
# Cargo.toml
[dependencies]
sea-orm = { version = "0.12", features = ["sqlx-sqlite", "runtime-tokio-native-tls"] }
```

## 6. 权限与安全

### 6.1 Tauri 2.x 权限配置

```json
// src-tauri/capabilities/main.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Main window capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "fs:allow-app-read-write",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### 6.2 CSP 配置

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost"
    }
  }
}
```

## 7. 打包与分发

### 7.1 平台特定配置

```json
// tauri.conf.json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.timlyzer.app",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "macOS": {
      "minimumSystemVersion": "10.15",
      "dmg": {
        "contents": [
          { "x": 140, "y": 150, "type": "file" },
          { "x": 400, "y": 150, "type": "link", "path": "/Applications" }
        ]
      }
    },
    "windows": {
      "wix": null,
      "nsis": null
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": false
      },
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0"]
      }
    }
  }
}
```

### 7.2 构建命令

```bash
# 开发模式
pnpm tauri dev

# 生产构建 (当前平台)
pnpm tauri build

# 构建特定目标
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target universal-apple-darwin  # macOS Universal

# Windows 交叉编译 (需要配置)
pnpm tauri build --target x86_64-pc-windows-msvc
```

## 8. 常见问题

### 8.1 macOS 代码签名

```bash
# 开发时跳过签名
export APPLE_SIGNING_IDENTITY="-"

# 或在 tauri.conf.json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "-"
    }
  }
}
```

### 8.2 Windows WebView2

WebView2 运行时需要在 Windows 上安装。Tauri 提供两种策略：

- **FixedRuntime**: 打包 WebView2 运行时（增加包大小）
- **DownloadBootstrapper**: 安装时下载（需要网络）

### 8.3 Linux 依赖

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
  gtk3-devel librsvg2-devel
```

## 9. 进阶主题

### 9.1 Sidecar 二进制

对于需要运行外部程序的场景：

```json
// tauri.conf.json
{
  "bundle": {
    "externalBin": ["binaries/some-tool"]
  }
}
```

### 9.2 自定义协议

```rust
// 注册自定义协议
tauri::Builder::default()
    .register_uri_scheme_protocol("asset", |app, request| {
        // 处理 asset:// 协议
    })
```

### 9.3 Deep Link

```json
// tauri.conf.json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["timlyzer"]
      }
    }
  }
}
```

## 10. 资源链接

- [Tauri 2.x 官方文档](https://v2.tauri.app/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [Tauri Discord](https://discord.com/invite/tauri)
- [Tauri Awesome](https://github.com/tauri-apps/awesome-tauri)
- [Tauri Plugins](https://github.com/tauri-apps/plugins-workspace)

---

_文档最后更新: 2026-01-01_
