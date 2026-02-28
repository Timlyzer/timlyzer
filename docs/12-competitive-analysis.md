# Timlyzer 竞品分析与扩展规划

> 📅 创建日期: 2026-02-28
> 📋 版本: v1.0

---

## 1. 项目概况

Timlyzer 是一个**自动时间追踪桌面应用**，参考 [Tockler](https://github.com/MayGo/tockler) 并用现代技术栈重写。

| 维度         | 详情                                                    |
| ------------ | ------------------------------------------------------- |
| **技术栈**   | Tauri 2.x (Rust) + React 19 + Tailwind CSS 4 + SQLite  |
| **定位**     | 本地化、隐私优先的自动时间追踪工具                      |
| **当前进度** | ~97% MVP 完成                                           |
| **核心能力** | 自动追踪活动窗口、系统状态监控、三轨道时间线、统计报表、搜索导出 |

### 1.1 已完成功能

- 活动窗口自动追踪（应用名 + 窗口标题）
- 系统空闲/休眠检测
- 三轨道时间线可视化（Task/Status/App）
- 日/周/月统计报表
- 搜索 + CSV/JSON 导出
- 系统托盘（最小化到托盘）
- 完整设置页面（主题/追踪参数/颜色管理/数据清理）
- 国际化（i18next）

### 1.2 待完成

- 开机自启动
- 多平台测试

---

## 2. 竞品分析

### 2.1 竞品矩阵

| 竞品                                              | 类型      | 开源 | 定价        | 平台                |
| ------------------------------------------------- | --------- | ---- | ----------- | ------------------- |
| [ActivityWatch](https://activitywatch.net/)        | 桌面应用  | 是   | 免费        | Windows/macOS/Linux |
| [Tockler](https://github.com/MayGo/tockler)       | 桌面应用  | 是   | 免费        | Windows/macOS/Linux |
| [RescueTime](https://www.rescuetime.com/)          | SaaS      | 否   | 免费增值    | 全平台              |
| [ManicTime](https://www.manictime.com/)            | 桌面应用  | 否   | $67 买断    | Windows             |
| [Timely](https://timelyapp.com/)                   | SaaS      | 否   | $11+/月     | 全平台              |
| [WakaTime](https://wakatime.com/)                  | SaaS      | 部分 | 免费增值    | IDE 插件            |
| [DeskTime](https://desktime.com/)                  | SaaS      | 否   | $7+/月      | 全平台              |

### 2.2 详细对比

#### ActivityWatch — 最直接的竞品

| 对比项     | ActivityWatch              | Timlyzer                    |
| ---------- | -------------------------- | --------------------------- |
| 技术栈     | Python + Vue.js            | Rust (Tauri) + React        |
| 打包大小   | ~100-150MB                 | ~10-30MB                    |
| 内存占用   | 较高                       | 低                          |
| 插件体系   | 成熟的 watcher 架构        | 暂无                        |
| 社区       | 活跃（GitHub 12k+ Stars）  | 新项目                      |
| 数据可视化 | 基础                       | 三轨道时间线，更直观        |

**Timlyzer 优势**: Tauri 更轻量，Rust 性能更优，UI 更现代。
**ActivityWatch 优势**: 成熟的插件生态，社区规模大。

#### Tockler — 参考原型

| 对比项   | Tockler              | Timlyzer              |
| -------- | -------------------- | --------------------- |
| 框架     | Electron             | Tauri 2.x             |
| 打包大小 | ~150MB               | ~10-30MB              |
| 内存占用 | 高（Electron 通病）  | 低                    |
| 维护状态 | 较活跃               | 开发中                |

**Timlyzer 优势**: 去掉 Electron 臃肿，架构更现代，性能更好。

#### RescueTime — 商业标杆

| 对比项     | RescueTime               | Timlyzer              |
| ---------- | ------------------------ | --------------------- |
| 数据存储   | 云端                     | 完全本地              |
| 隐私性     | 数据上传到服务器         | 数据不出设备          |
| 智能分类   | AI 自动分类 + 生产力评分 | 暂无                  |
| 定价       | 免费版有限，Pro $12/月   | 免费开源              |
| 离线使用   | 需要网络同步             | 完全离线可用          |

**Timlyzer 优势**: 隐私优先，免费，无需订阅，完全离线。
**RescueTime 优势**: 智能分析、生产力洞察、跨设备同步。

### 2.3 市场定位

```
                    隐私性高
                      │
         Timlyzer ●   │   ● ActivityWatch
                      │
                      │   ● Tockler
    免费 ─────────────┼─────────────── 付费
                      │
                      │   ● ManicTime
         WakaTime ●   │
                      │   ● RescueTime
                      │   ● Timely
                    隐私性低
```

**Timlyzer 核心差异化**: 隐私优先 + 轻量高性能 + 免费开源

---

## 3. 扩展方向规划

### 3.1 第一梯队：高价值差异化功能

#### 3.1.1 AI 智能分类与生产力洞察

**价值**: 填补与 RescueTime 的最大功能差距，同时保持本地隐私

- 基于窗口标题自动识别项目/任务归属（本地 LLM 或规则引擎）
- 生产力评分：将应用自动分为「专注工作」「沟通协作」「娱乐消遣」
- 每日/周报自动生成："今天你在项目 X 上专注了 3.5 小时"
- 本地推理，数据不离开设备

**实现思路**:

| 方案           | 优点             | 缺点           |
| -------------- | ---------------- | -------------- |
| 规则引擎       | 轻量、无依赖     | 需手动配置     |
| 本地小模型     | 智能、自动       | 增加打包体积   |
| 混合方案（推荐）| 规则优先 + AI 兜底 | 实现稍复杂     |

#### 3.1.2 专注模式（Focus Mode / Pomodoro）

**价值**: 与项目"专注时间"主题高度契合，形成追踪 + 主动管理的闭环

- 内置番茄钟，与时间追踪数据自然融合
- 专注期间可选屏蔽通知/提醒
- 统计专注时长 vs 碎片化时间的比例
- 专注目标设定与达成率统计

#### 3.1.3 项目/标签系统

**价值**: 将被动追踪转化为主动的时间管理工具

- 将自动追踪的应用活动关联到用户定义的项目
- 规则引擎：`VSCode + 标题含 "timlyzer"` → 自动归到 "Timlyzer 项目"
- 多项目时间报表，方便自由职业者做时间记账
- 标签支持（一个活动可属于多个标签）

### 3.2 第二梯队：体验增强

#### 3.2.1 日历热力图 + 趋势分析

- GitHub 风格的年度活跃热力图
- 周对比：本周 vs 上周的时间分配变化
- 检测习惯模式："你通常在周三下午效率最高"
- 月度/季度趋势报告

#### 3.2.2 网站/URL 追踪增强

- 浏览器扩展（Chrome/Firefox），精确追踪网站访问
- 网站分类与时间统计
- 配合生产力评分，识别"黑洞网站"

#### 3.2.3 多设备同步（可选云端）

- 本地优先 + 可选的端到端加密同步
- 支持自托管（Self-hosted）后端
- 保持隐私优先的核心理念
- 方案选项：CRDTs / SQLite + Litestream / 自建同步协议

#### 3.2.4 团队/组织版本

- 管理者可查看团队时间分配（需获授权）
- 项目级时间汇总
- 匿名化聚合统计
- **潜在的商业化路径**

### 3.3 第三梯队：生态与集成

#### 3.3.1 插件/扩展系统

- 参考 ActivityWatch 的 watcher 插件架构
- 社区可开发自定义数据源（IDE 插件、浏览器扩展等）
- 插件 API + 开发者文档

#### 3.3.2 第三方集成

- 日历同步（Google Calendar / Apple Calendar / Outlook）
- 项目管理工具导出（Jira / Linear / Notion / Todoist）
- Webhook / REST API 支持
- Zapier / n8n 集成

#### 3.3.3 移动端陪伴 App

- iOS/Android 查看每日报告（Tauri 2.x 已支持移动端构建）
- 手动任务记录（会议、线下活动）
- 推送通知（每日总结、专注提醒）

---

## 4. 推荐路线图

```
Phase 1 — MVP 收尾（当前）
├── 开机自启动
└── 多平台测试与发布

Phase 2 — 差异化（短期 1-2 个月）
├── 专注模式 / 番茄钟
├── 项目/标签系统 + 自动分类规则
└── 日历热力图

Phase 3 — 竞争力提升（中期 3-6 个月）
├── AI 生产力洞察（本地推理）
├── 浏览器扩展
└── 趋势分析报表

Phase 4 — 生态建设（长期 6-12 个月）
├── 插件系统
├── 可选云同步（E2E 加密）
├── 移动端 App
└── 团队版（商业化探索）
```

---

## 5. 核心策略总结

> **本地隐私 + 轻量性能** 是 Timlyzer 相对 RescueTime / Timely 等 SaaS 产品的核心护城河。
>
> 在此基础上叠加智能分析能力（本地 AI），目标是实现：
>
> **「RescueTime 的洞察力 + ActivityWatch 的隐私性」**

### 关键成功指标

| 指标               | 目标值          |
| ------------------ | --------------- |
| 安装包大小         | < 30MB          |
| 内存占用           | < 100MB         |
| 首次启动到追踪开始 | < 3 秒          |
| 数据不离开设备     | 100%（默认模式）|

---

## 参考链接

- [ActivityWatch](https://activitywatch.net/)
- [ActivityWatch Alternatives - AlternativeTo](https://alternativeto.net/software/activitywatch/)
- [Best Automated Time Tracking Software 2026 - TMetric](https://tmetric.com/best-software/the-best-10-automated-time-tracking-software-for-2026)
- [Best Time Tracking Apps 2026 - Zapier](https://zapier.com/blog/best-time-tracking-apps/)

---

_文档最后更新: 2026-02-28_
