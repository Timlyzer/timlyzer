# 开发指南

## 1. 环境要求

### 必需软件

| 软件        | 版本要求 | 安装方式              |
| ----------- | -------- | --------------------- |
| **Node.js** | 20+      | https://nodejs.org/   |
| **Rust**    | stable   | https://rustup.rs/    |
| **pnpm**    | 8+       | `npm install -g pnpm` |

### macOS 额外要求

- Xcode Command Line Tools: `xcode-select --install`

### Windows 额外要求

- Visual Studio Build Tools (C++ 工具链)
- WebView2 Runtime

### Linux 额外要求

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
  gtk3-devel librsvg2-devel
```

## 2. 项目安装

```bash
# 克隆项目
git clone <repository-url>
cd timlyzer

# 安装依赖
pnpm install
```

## 3. 开发模式

### 启动应用

```bash
pnpm tauri dev
```

这会同时启动：

- **Vite 开发服务器** - http://localhost:1420
- **Tauri 应用窗口** - 自动打开

### 端口冲突处理

如果遇到 "Port 1420 is already in use" 错误：

```bash
# 方法 1: 清理端口后启动
lsof -ti:1420 | xargs kill -9 2>/dev/null
pnpm tauri dev

# 方法 2: 一条命令解决
pkill -f "vite" 2>/dev/null; pkill -f "timlyzer" 2>/dev/null; sleep 1 && pnpm tauri dev
```

### 仅启动前端

如果只想开发前端界面（不启动 Tauri）：

```bash
pnpm dev
```

然后在浏览器访问 http://localhost:1420

## 4. 生产构建

### 构建应用

```bash
pnpm tauri build
```

构建产物位置：

- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Windows**: `src-tauri/target/release/bundle/nsis/`
- **Linux**: `src-tauri/target/release/bundle/appimage/`

### 仅构建前端

```bash
pnpm build
```

产物位置: `dist/`

## 5. 项目结构

```
timlyzer/
├── src/                        # 前端源码 (React + TypeScript)
│   ├── components/             # React 组件
│   │   ├── layout/             # 布局组件
│   │   ├── timeline/           # 时间线组件
│   │   └── ui/                 # 基础 UI 组件
│   ├── pages/                  # 页面组件
│   ├── stores/                 # Zustand 状态管理
│   ├── services/               # API 服务层
│   ├── types/                  # TypeScript 类型定义
│   ├── lib/                    # 工具函数
│   ├── App.tsx                 # 应用入口
│   ├── main.tsx                # React 入口
│   └── index.css               # Tailwind CSS 入口
│
├── src-tauri/                  # 后端源码 (Rust)
│   ├── src/
│   │   ├── main.rs             # 应用入口
│   │   ├── lib.rs              # 初始化逻辑
│   │   ├── commands.rs         # Tauri 命令处理器
│   │   └── database.rs         # SQLite 数据库操作
│   ├── Cargo.toml              # Rust 依赖配置
│   ├── tauri.conf.json         # Tauri 配置文件
│   └── icons/                  # 应用图标
│
├── docs/                       # 项目文档
├── public/                     # 静态资源
├── index.html                  # HTML 入口
├── package.json                # Node.js 配置
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 项目说明
```

## 6. 常用命令

| 命令               | 说明                 |
| ------------------ | -------------------- |
| `pnpm install`     | 安装 Node.js 依赖    |
| `pnpm dev`         | 仅启动前端开发服务器 |
| `pnpm tauri dev`   | 启动完整开发环境     |
| `pnpm build`       | 构建前端             |
| `pnpm tauri build` | 构建桌面应用         |
| `pnpm lint`        | 代码检查             |

## 7. 开发工作流

### 前端开发

1. 修改 `src/` 目录下的文件
2. 保存后 Vite 会自动热更新
3. 在应用窗口中查看变化

### 后端开发

1. 修改 `src-tauri/src/` 目录下的 Rust 文件
2. 保存后 Tauri 会自动重新编译
3. 应用会自动重启

### 添加 Tauri 命令

1. 在 `src-tauri/src/commands.rs` 添加命令函数：

```rust
#[tauri::command]
pub fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Hello, {}!", param))
}
```

2. 在 `src-tauri/src/lib.rs` 注册命令：

```rust
.invoke_handler(tauri::generate_handler![
    // ... 其他命令
    my_command,
])
```

3. 在前端调用：

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<string>("my_command", { param: "World" });
```

## 8. 数据库

### 位置

数据库文件存储在应用数据目录：

- **macOS**: `~/Library/Application Support/com.timlyzer.app/timlyzer.db`
- **Windows**: `%APPDATA%/com.timlyzer.app/timlyzer.db`
- **Linux**: `~/.config/com.timlyzer.app/timlyzer.db`

### 查看数据库

```bash
# 安装 SQLite CLI
brew install sqlite  # macOS

# 打开数据库
sqlite3 ~/Library/Application\ Support/com.timlyzer.app/timlyzer.db

# 查看表
.tables

# 查看数据
SELECT * FROM track_items LIMIT 10;
```

## 9. 调试

### 前端调试

在 Tauri 窗口中右键 → "检查元素" 打开开发者工具

### 后端调试

查看 Rust 日志输出在终端中

启用更详细的日志：

```bash
RUST_LOG=debug pnpm tauri dev
```

## 10. 常见问题

### Q: 应用窗口不显示？

检查是否有 Rust 编译错误，查看终端输出。

### Q: 前后端通信失败？

确保命令名称匹配（Rust 中的蛇形命名会自动转换为 camelCase）。

### Q: 数据库操作报错？

检查应用数据目录是否有写权限。

---

_最后更新: 2026-01-01_
