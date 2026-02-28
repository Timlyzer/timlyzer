# Timlyzer 开发计划

> 📅 创建日期: 2026-01-01
> 📋 版本: v1.0

## 1. 项目现状评估

### 1.1 已完成的基础设施

| 类别           | 已完成项                                             | 状态 |
| -------------- | ---------------------------------------------------- | ---- |
| **项目初始化** | Tauri 2.x + React + TypeScript 项目搭建              | ✅   |
| **样式系统**   | Tailwind CSS 配置、深色/浅色主题                     | ✅   |
| **路由系统**   | React Router 配置 (Timeline/Summary/Search/Settings) | ✅   |
| **状态管理**   | Zustand store (settings-store, timeline-store)       | ✅   |
| **数据库**     | SQLite + rusqlite 集成，基础 schema                  | ✅   |
| **API 层**     | 基础 Tauri commands (CRUD 操作)                      | ✅   |

### 1.2 已创建的页面

| 页面       | 文件               | 完成度        |
| ---------- | ------------------ | ------------- |
| **时间线** | `TimelinePage.tsx` | 🔧 框架已搭建 |
| **统计**   | `SummaryPage.tsx`  | 🔧 基础 UI    |
| **搜索**   | `SearchPage.tsx`   | 🔧 基础 UI    |
| **设置**   | `SettingsPage.tsx` | 🔧 基础 UI    |

### 1.3 已创建的组件

| 组件目录    | 组件                               | 状态        |
| ----------- | ---------------------------------- | ----------- |
| `timeline/` | Timeline, TimelineTrack, TimeRuler | 🔧 基础框架 |
| `layout/`   | 布局组件                           | ✅          |
| `ui/`       | 基础 UI 组件                       | 🔧 部分完成 |

### 1.4 后端 (Rust) 现状

| 模块             | 状态      | 说明                            |
| ---------------- | --------- | ------------------------------- |
| `commands.rs`    | ✅ 已实现 | 基础 CRUD 命令                  |
| `database.rs`    | ✅ 已实现 | TrackItem 数据模型，SQLite 操作 |
| **追踪服务**     | ❌ 未实现 | 核心功能缺失                    |
| **活动窗口检测** | ❌ 未实现 | 核心功能缺失                    |
| **系统托盘**     | ❌ 未实现 | 需要实现                        |

---

## 2. 开发计划总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         开发阶段总览                                  │
├───────────────────┬───────────────────┬───────────────────────────────┤
│  Sprint 1 (5天)   │  Sprint 2 (5天)   │      Sprint 3 (5天)           │
│  核心追踪服务      │  前端时间线完善    │      高级功能                  │
├───────────────────┼───────────────────┼───────────────────────────────┤
│ • 活动窗口检测     │ • 时间线三轨道     │ • 统计报表完善                 │
│ • 空闲状态检测     │ • 缩放和平移       │ • 搜索功能完善                 │
│ • 追踪服务后台任务  │ • 追踪项详情       │ • 数据导出                    │
│ • 系统状态监控     │ • 日期选择器       │ • 系统托盘                    │
├───────────────────┴───────────────────┴───────────────────────────────┤
│                         Sprint 4 (5天)                                │
│              优化与打包：性能优化、多平台测试、发布准备                  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Sprint 1: 核心追踪服务 (5 天)

> **目标**: 实现后端核心追踪功能，使应用能够自动检测和记录用户活动

### Day 1-2: 活动窗口检测模块

#### 任务清单

- [ ] **1.1** 添加 `active-win-pos-rs` 依赖到 `Cargo.toml`

  ```toml
  active-win-pos-rs = "0.8"
  ```

- [ ] **1.2** 创建 `src-tauri/src/services/` 目录结构

  ```
  src-tauri/src/services/
  ├── mod.rs
  ├── active_window.rs    # 活动窗口检测
  ├── tracker.rs          # 追踪服务
  └── state_monitor.rs    # 状态监控
  ```

- [ ] **1.3** 实现 `active_window.rs`

  ```rust
  // 功能：获取当前活动窗口信息
  pub struct WindowInfo {
      pub app_name: String,
      pub title: String,
      pub process_id: u32,
  }

  pub fn get_active_window() -> Result<WindowInfo, String>;
  ```

- [ ] **1.4** 添加测试命令验证窗口检测
  ```rust
  #[tauri::command]
  pub fn get_current_window() -> Result<WindowInfo, String>;
  ```

### Day 3: 空闲状态检测

- [ ] **2.1** 创建 `src-tauri/src/system/` 目录

  ```
  src-tauri/src/system/
  ├── mod.rs
  ├── idle.rs      # 空闲检测
  └── power.rs     # 电源状态 (可选)
  ```

- [ ] **2.2** 实现 macOS 空闲检测

  ```rust
  // 使用 IOKit 获取用户空闲时间
  #[cfg(target_os = "macos")]
  pub fn get_idle_time() -> Duration;
  ```

- [ ] **2.3** 添加跨平台条件编译支持

### Day 4-5: 追踪服务核心

- [ ] **3.1** 实现 `tracker.rs` 追踪服务

  ```rust
  pub struct TrackerService {
      db: Arc<Database>,
      config: TrackerConfig,
  }

  impl TrackerService {
      pub fn start(&self, app_handle: AppHandle);
      async fn tracking_loop(&self);
      async fn update_track_item(&self, window: WindowInfo);
  }
  ```

- [ ] **3.2** 实现 `state_monitor.rs` 状态管理

  ```rust
  pub enum SystemState {
      Online,
      Idle,
      Offline,
  }

  pub struct StateMonitor {
      current_state: SystemState,
      idle_threshold: Duration,
  }
  ```

- [ ] **3.3** 在应用启动时启动后台追踪任务

  ```rust
  // lib.rs setup 函数中
  .setup(|app| {
      // ... 现有代码

      // 启动追踪服务
      let tracker = TrackerService::new(db.clone());
      tracker.start(app.handle().clone());
  })
  ```

- [ ] **3.4** 实现 StatusTrackItem 追踪逻辑

- [ ] **3.5** 添加追踪控制命令

  ```rust
  #[tauri::command]
  pub fn start_tracking() -> Result<(), String>;

  #[tauri::command]
  pub fn stop_tracking() -> Result<(), String>;

  #[tauri::command]
  pub fn get_tracking_status() -> TrackingStatus;
  ```

### Sprint 1 验收标准

- [ ] 应用启动后自动开始追踪
- [ ] 正确识别当前活动应用和窗口标题
- [ ] 应用切换时正确记录时间段
- [ ] 系统空闲超过阈值（默认 5 分钟）时停止追踪
- [ ] 数据正确保存到 SQLite 数据库

---

## 4. Sprint 2: 前端时间线完善 (5 天)

> **目标**: 完善时间线页面的交互和可视化功能

### Day 1-2: 时间线核心组件

- [ ] **4.1** 完善 `Timeline.tsx` 三轨道显示

  ```typescript
  // 三个轨道：Task / Status / App
  interface TimelineProps {
    date: Date;
    tracks: {
      task: TrackItem[];
      status: TrackItem[];
      app: TrackItem[];
    };
  }
  ```

- [ ] **4.2** 实现 `TimeRuler.tsx` 时间刻度

  - 显示小时刻度 (00:00 - 24:00)
  - 当前时间指示器
  - 刻度自适应缩放

- [ ] **4.3** 完善 `TimelineTrack.tsx` 追踪项显示

  - 追踪项颜色渲染
  - 追踪项宽度计算
  - 追踪项 hover 效果

- [ ] **4.4** 实现追踪项点击选中和详情弹窗

### Day 3: 时间线交互

- [ ] **5.1** 实现时间线缩放功能

  ```typescript
  // 使用 wheel 事件缩放
  const [zoomLevel, setZoomLevel] = useState(1);
  // 缩放范围: 0.5x - 4x
  ```

- [ ] **5.2** 实现时间线平移功能

  - 拖拽移动时间范围
  - 滚轮水平滚动

- [ ] **5.3** 添加快捷按钮
  - "今天" 按钮
  - "实时" 模式切换
  - 缩放重置

### Day 4: 日期选择和数据加载

- [ ] **6.1** 实现日期选择器组件

  ```typescript
  // 显示: ◀ 2026-01-01 ▶
  interface DateSelector {
    currentDate: Date;
    onDateChange: (date: Date) => void;
  }
  ```

- [ ] **6.2** 完善 `timeline-store.ts` 数据管理

  ```typescript
  interface TimelineState {
    selectedDate: Date;
    timeRange: [number, number];
    visibleRange: [number, number];
    zoomLevel: number;
    trackItems: {
      task: TrackItem[];
      status: TrackItem[];
      app: TrackItem[];
    };
    isLoading: boolean;
    isLiveMode: boolean;
  }
  ```

- [ ] **6.3** 实现实时数据刷新 (5 秒间隔)
  ```typescript
  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(fetchTrackItems, 5000);
      return () => clearInterval(interval);
    }
  }, [isLiveMode]);
  ```

### Day 5: 追踪项编辑

- [ ] **7.1** 创建追踪项详情/编辑对话框

  ```typescript
  // 显示：应用名、标题、时间范围、颜色
  // 操作：编辑、删除、修改颜色
  ```

- [ ] **7.2** 实现追踪项颜色修改

  - 颜色选择器组件
  - 保存颜色到 app_settings

- [ ] **7.3** 实现追踪项删除确认

### Sprint 2 验收标准

- [ ] 时间线显示三个轨道 (Task/Status/App)
- [ ] 支持缩放和平移操作
- [ ] 可以选择不同日期查看历史
- [ ] 实时模式可以自动刷新数据
- [ ] 可以查看和编辑追踪项详情

---

## 5. Sprint 3: 高级功能 (5 天)

> **目标**: 实现统计、搜索、导出和系统托盘功能

### Day 1-2: 统计报表

- [ ] **8.1** 完善 `SummaryPage.tsx` 布局

  ```typescript
  // 主要区域：
  // - 应用使用饼图
  // - 使用时长列表
  // - 日期范围选择
  ```

- [ ] **8.2** 实现应用使用饼图

  - 使用 Recharts PieChart
  - 按应用分组统计时长
  - 显示百分比和时长

- [ ] **8.3** 添加后端统计 API

  ```rust
  #[tauri::command]
  pub fn get_app_usage_stats(
      from: i64,
      to: i64
  ) -> Result<Vec<AppUsageStats>, String>;

  pub struct AppUsageStats {
      app: String,
      total_duration: i64,
      percentage: f64,
      color: Option<String>,
  }
  ```

- [ ] **8.4** 实现日/周/月视图切换
  - 今日统计
  - 本周统计
  - 本月统计

### Day 3: 搜索功能完善

- [ ] **9.1** 完善 `SearchPage.tsx`

  ```typescript
  // 功能：
  // - 关键词搜索 (应用名/标题)
  // - 日期范围筛选
  // - 追踪类型筛选
  // - 分页显示
  ```

- [ ] **9.2** 优化后端搜索性能

  - 在 SQL 层面实现筛选
  - 添加全文索引 (FTS5)

- [ ] **9.3** 实现搜索结果分页
  ```typescript
  interface SearchResult {
    data: TrackItem[];
    total: number;
    page: number;
    pageSize: number;
  }
  ```

### Day 4: 数据导出

- [ ] **10.1** 实现 CSV 导出功能

  ```rust
  #[tauri::command]
  pub fn export_to_csv(
      from: i64,
      to: i64,
      file_path: String
  ) -> Result<(), String>;
  ```

- [ ] **10.2** 实现 JSON 导出功能

- [ ] **10.3** 添加导出对话框
  - 选择日期范围
  - 选择导出格式
  - 选择保存位置

### Day 5: 系统托盘

- [ ] **11.1** 实现系统托盘图标

  ```rust
  use tauri::tray::{TrayIcon, TrayIconBuilder};

  fn setup_tray(app: &tauri::App) -> Result<TrayIcon, tauri::Error>;
  ```

- [ ] **11.2** 实现托盘菜单

  - Open Timlyzer
  - Today's Summary
  - Settings

  ***

  - Quit

- [ ] **11.3** 托盘图标状态更新

  - 在线 (绿色)
  - 空闲 (黄色)
  - 离线 (灰色)

- [ ] **11.4** 窗口关闭时最小化到托盘

### Sprint 3 验收标准

- [ ] 统计页面显示饼图和使用列表
- [ ] 搜索功能可以按关键词和日期筛选
- [ ] 可以导出数据为 CSV/JSON 格式
- [ ] 系统托盘正常工作，可以快速访问应用

---

## 6. Sprint 4: 优化与打包 (5 天)

> **目标**: 性能优化、完善设置、多平台测试、发布准备

### Day 1: 设置页面完善

- [ ] **12.1** 完善通用设置

  - 主题选择 (Light/Dark/System)
  - 开机自启动开关
  - 最小化到托盘设置
  - 显示当前版本

- [ ] **12.2** 完善追踪设置

  ```typescript
  interface TrackingSettings {
    pollingInterval: number; // 3-10秒
    idleThreshold: number; // 1-30分钟
    trackUrls: boolean;
  }
  ```

- [ ] **12.3** 应用颜色管理
  - 显示所有已追踪应用
  - 修改应用颜色
  - 重置为默认颜色

### Day 2: 数据管理

- [ ] **13.1** 数据清理功能

  - 清理指定日期之前的数据
  - 清理所有数据确认

- [ ] **13.2** 数据备份/恢复

  ```rust
  #[tauri::command]
  pub fn backup_database(path: String) -> Result<(), String>;

  #[tauri::command]
  pub fn restore_database(path: String) -> Result<(), String>;
  ```

- [ ] **13.3** 数据库优化
  - 添加 VACUUM 定期清理
  - 优化索引

### Day 3: 性能优化

- [ ] **14.1** 前端性能优化

  - 时间线组件虚拟化 (大量追踪项)
  - React.memo 优化重渲染
  - 懒加载页面组件

- [ ] **14.2** 后端性能优化

  - 数据库查询优化
  - 减少锁竞争
  - 内存使用监控

- [ ] **14.3** 打包体积优化
  - 移除未使用依赖
  - 代码分割

### Day 4: 多平台测试

- [ ] **15.1** macOS 测试

  - 活动窗口检测测试
  - 空闲检测测试
  - 系统托盘测试
  - 打包测试 (DMG)

- [ ] **15.2** Windows 测试 (如适用)

  - 安装 Windows 依赖
  - 测试核心功能
  - 打包测试 (MSI/NSIS)

- [ ] **15.3** Linux 测试 (如适用)
  - 安装 Linux 依赖
  - X11 活动窗口检测
  - 打包测试 (AppImage)

### Day 5: 发布准备

- [ ] **16.1** 文档完善

  - 更新 README.md
  - 添加 CHANGELOG.md
  - 添加使用说明

- [ ] **16.2** 应用图标

  - 准备各尺寸图标
  - macOS .icns
  - Windows .ico
  - Linux PNG

- [ ] **16.3** 构建配置

  ```json
  // tauri.conf.json
  {
      "bundle": {
          "identifier": "com.timlyzer.app",
          "icon": ["icons/..."],
          "macOS": { ... },
          "windows": { ... }
      }
  }
  ```

- [ ] **16.4** 生成发布包
  ```bash
  pnpm tauri build
  ```

### Sprint 4 验收标准

- [ ] 设置页面功能完整
- [ ] 应用性能良好（内存 <100MB, CPU <1%）
- [ ] macOS 平台测试通过
- [ ] 可以成功生成发布包

---

## 7. 后续迭代 (P2/P3 功能)

以下功能在 MVP 发布后考虑：

### Phase 2: 增强功能

- [ ] 手动任务追踪 (LogTrackItem)
- [ ] 日历热力图视图
- [ ] 休息提醒通知
- [ ] 忽略特定应用规则
- [ ] URL 追踪 (浏览器)

### Phase 3: 高级功能

- [ ] 多语言支持 (i18n)
- [ ] 自动更新功能
- [ ] 数据同步 (多设备)
- [ ] 插件系统
- [ ] 报表生成 (PDF)

---

## 8. 技术债务清单

开发过程中需要关注的技术债务：

| 项目         | 优先级 | 说明                      |
| ------------ | ------ | ------------------------- |
| 错误处理统一 | 高     | 统一 Rust/TS 错误处理模式 |
| 日志系统     | 高     | 添加完善的日志记录        |
| 类型安全     | 中     | 确保前后端类型同步        |
| 单元测试     | 中     | 关键功能添加测试覆盖      |
| 代码文档     | 低     | 添加关键函数注释          |

---

## 9. 每日进度跟踪模板

```markdown
## 日期: YYYY-MM-DD

### 今日目标

- [ ] 任务 1
- [ ] 任务 2

### 完成情况

- [x] 任务 1 - 备注
- [ ] 任务 2 - 阻塞原因

### 遇到的问题

1. 问题描述
   - 解决方案

### 明日计划

- 任务 A
- 任务 B
```

---

## 10. 快速命令参考

```bash
# 开发模式运行
pnpm tauri dev

# 仅前端开发
pnpm dev

# 构建生产版本
pnpm tauri build

# Rust 格式化
cd src-tauri && cargo fmt

# Rust 检查
cd src-tauri && cargo check

# 查看 Rust 测试
cd src-tauri && cargo test
```

---

_文档最后更新: 2026-01-01_
