# Timlyzer 实施计划

## 1. 项目概述

**项目名称**: Timlyzer  
**项目目标**: 基于 Tauri + React + Tailwind CSS 构建轻量级跨平台时间追踪应用

## 2. 开发阶段

### Phase 1: 项目初始化与基础架构 (Week 1-2)

#### 1.1 项目脚手架搭建

- [ ] 使用 `pnpm create tauri-app` 创建 Tauri 2.x 项目
- [ ] 配置 TypeScript
- [ ] 配置 Tailwind CSS 3.x
- [ ] 安装配置 shadcn/ui
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Vite 构建优化

#### 1.2 Rust 后端基础

- [ ] 设计数据库 schema
- [ ] 集成 rusqlite 或 sea-orm
- [ ] 实现数据库迁移机制
- [ ] 创建基础数据仓库层
- [ ] 设置日志系统 (tracing)

#### 1.3 项目结构搭建

- [ ] 创建前端目录结构
- [ ] 创建 Rust 后端目录结构
- [ ] 配置 Tauri 窗口设置
- [ ] 实现基础 IPC 通信测试

### Phase 2: 核心追踪功能 (Week 3-4)

#### 2.1 活动窗口检测

- [ ] 研究跨平台活动窗口检测方案
- [ ] 实现 macOS 活动窗口检测
- [ ] 实现 Windows 活动窗口检测
- [ ] 实现 Linux 活动窗口检测 (X11)
- [ ] 创建统一的窗口信息接口

#### 2.2 系统状态监控

- [ ] 实现空闲时间检测
- [ ] 实现系统休眠/唤醒监听
- [ ] 实现状态机管理 (Online/Idle/Offline)
- [ ] 创建状态变化事件系统

#### 2.3 追踪服务核心

- [ ] 实现后台轮询任务
- [ ] 实现 AppTrackItem 追踪逻辑
- [ ] 实现 StatusTrackItem 追踪逻辑
- [ ] 实现追踪数据持久化
- [ ] 处理跨越午夜的追踪项

### Phase 3: 前端核心功能 (Week 5-6)

#### 3.1 基础 UI 组件

- [ ] 创建通用布局组件
- [ ] 创建主题切换 (Light/Dark)
- [ ] 创建导航/侧边栏组件
- [ ] 创建日期选择器组件
- [ ] 创建颜色选择器组件

#### 3.2 时间线页面

- [ ] 实现时间线图表组件
- [ ] 实现时间范围选择器
- [ ] 实现追踪项列表视图
- [ ] 实现追踪项编辑对话框
- [ ] 实现实时数据更新

#### 3.3 状态管理

- [ ] 设置 Zustand store 结构
- [ ] 实现时间线状态管理
- [ ] 实现设置状态管理
- [ ] 实现数据同步逻辑

### Phase 4: 高级功能 (Week 7-8)

#### 4.1 统计与报表

- [ ] 实现应用使用饼图
- [ ] 实现每日/每周使用统计
- [ ] 实现日历热力图
- [ ] 实现导出功能 (CSV/JSON)

#### 4.2 搜索功能

- [ ] 实现全文搜索后端
- [ ] 实现搜索界面
- [ ] 实现分页和排序
- [ ] 实现高级筛选

#### 4.3 手动任务记录

- [ ] 实现 LogTrackItem 创建
- [ ] 实现任务计时器
- [ ] 实现任务切换
- [ ] 实现任务编辑/删除

### Phase 5: 系统集成 (Week 9-10)

#### 5.1 系统托盘

- [ ] 实现系统托盘图标
- [ ] 实现托盘菜单
- [ ] 实现托盘弹出窗口
- [ ] 实现托盘状态更新

#### 5.2 通知系统

- [ ] 实现休息提醒功能
- [ ] 实现系统通知
- [ ] 实现通知设置

#### 5.3 自动启动

- [ ] 实现开机自启动
- [ ] 实现最小化到托盘
- [ ] 实现单实例检查

### Phase 6: 设置与优化 (Week 11-12)

#### 6.1 设置页面

- [ ] 实现通用设置 UI
- [ ] 实现追踪设置 (轮询间隔、空闲阈值)
- [ ] 实现应用颜色管理
- [ ] 实现数据管理 (导入/导出/清理)

#### 6.2 性能优化

- [ ] 优化数据库查询
- [ ] 优化前端渲染性能
- [ ] 减少内存占用
- [ ] 优化打包体积

#### 6.3 多平台测试

- [ ] macOS 测试与修复
- [ ] Windows 测试与修复
- [ ] Linux 测试与修复

## 3. 技术风险与解决方案

### 3.1 跨平台窗口检测

| 风险                | 解决方案                                  |
| ------------------- | ----------------------------------------- |
| 不同平台 API 差异大 | 使用 trait 抽象，各平台单独实现           |
| Windows API 复杂    | 使用 `windows-rs` crate，参考现有开源实现 |
| Wayland 支持        | 优先支持 X11，Wayland 作为后续优化        |

### 3.2 后台任务资源占用

| 风险             | 解决方案                           |
| ---------------- | ---------------------------------- |
| 持续轮询消耗 CPU | 使用 async/await，合理设置轮询间隔 |
| 内存泄漏         | 使用 Rust 内存安全特性，定期检测   |

### 3.3 数据库性能

| 风险           | 解决方案               |
| -------------- | ---------------------- |
| 大量数据查询慢 | 添加合适索引，分页查询 |
| 并发访问冲突   | 使用连接池，WAL 模式   |

## 4. 里程碑

| 里程碑                   | 目标                     | 时间    |
| ------------------------ | ------------------------ | ------- |
| **M1: Skeleton**         | 项目可运行，基础架构完成 | Week 2  |
| **M2: Core Tracking**    | 核心追踪功能工作         | Week 4  |
| **M3: Timeline MVP**     | 时间线页面可用           | Week 6  |
| **M4: Feature Complete** | 全功能版本               | Week 10 |
| **M5: Release Ready**    | 可发布版本               | Week 12 |

## 5. 资源参考

### 5.1 Tauri

- [Tauri 官方文档](https://tauri.app/v2/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [Tauri Plugins](https://github.com/tauri-apps/tauri-plugin-shell)

### 5.2 Rust Crates

- [`active-win-pos-rs`](https://crates.io/crates/active-win-pos-rs) - 活动窗口检测
- [`rusqlite`](https://crates.io/crates/rusqlite) - SQLite
- [`sea-orm`](https://crates.io/crates/sea-orm) - ORM
- [`tokio`](https://crates.io/crates/tokio) - 异步运行时
- [`tracing`](https://crates.io/crates/tracing) - 日志

### 5.3 前端

- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org/)
- [date-fns](https://date-fns.org/)

### 5.4 类似项目参考

- [ActivityWatch](https://github.com/ActivityWatch/activitywatch) - Python 版本
- [RescueTime](https://www.rescuetime.com/) - 商业产品参考

## 6. 开发规范

### 6.1 Git 提交规范

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

### 6.2 分支策略

- `main` - 稳定发布分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支

### 6.3 代码审查

- 所有 PR 需要至少一人审查
- 确保 CI 通过
- 遵循项目代码风格

## 7. 下一步行动

1. **创建项目 GitHub 仓库**
2. **初始化 Tauri 项目**
3. **配置开发环境**
4. **开始 Phase 1 开发**

---

_文档最后更新: 2026-01-01_
