# Frontend UI Gallery Pro

一个零依赖的前端 UI 图库，包含两大板块：

- **组件库**：391 个 UI 组件 / 效果速查，点击卡片查看 AI 提示词与可运行代码。
- **页面模板**：6 大业务场景分类、30 个完整前端页面，支持全屏预览、桌面/移动视口切换、一键复制整页源码。

交付物仍是单个 `frontend-ui.html`，双击即用，无需构建、无需安装。

## 特性

- **单文件、零依赖**：HTML + CSS + JS 全在一个文件；交付不含任何 npm 依赖。
- **双视图**：顶部切换「🧩 组件库 / 🖥 页面模板」，互不干扰。
- **整页模板**：每个模板是独立完整的 HTML 页面，含真实中文文案、示例数据和轻量交互，不是组件卡片。
- **全屏预览**：点卡片全屏打开，可切桌面 / 390px 移动视口、刷新、复制源码、新窗口打开，Esc 关闭。
- **搜索 + 分类**：组件库按 10 类筛选，页面模板按 6 大业务场景筛选，均支持关键词搜索。
- **缩略图懒加载**：iframe 缩略图进入视口才渲染，30 个整页不拖慢首屏。
- **URL 深链**：`#components` / `#pages/<分类>` / `#page/<模板 id>` 可直接定位。
- **动效控制 / 技术栈切换 / 一键复制**：组件库原有能力全部保留。

## 快速开始

直接用浏览器打开即可：

```bash
start frontend-ui.html   # Windows
open frontend-ui.html    # macOS
```

## 双视图用法

| 视图 | 操作 |
| --- | --- |
| 组件库 | 搜索框输入关键词 → 点分类标签筛选 → 点卡片查看 Prompt / 代码 → 可切换技术栈、暂停动效 |
| 页面模板 | 点顶部分类（或搜索）→ 点卡片全屏预览 → 顶部切换桌面/移动、复制源码、新窗口打开 → Esc 或「返回图库」关闭 |

## 搜索

| 入口 | 能力 |
| --- | --- |
| 全局搜索（⌘/Ctrl + K、顶部按钮、`/`） | 一次搜 391 个组件 + 30 个页面模板；分组结果、↑↓ 选择 / Enter 打开、命中高亮、热词与最近搜索 |
| 组件库 / 页面模板搜索框 | 空格多词 AND、逗号或竖线 OR、中英文同义词与缩写、按匹配度排序、命中高亮、一键清空 |
| 分类 + 搜索 | 两者叠加生效，结果计数 `N / 总数`，无结果时给可点击建议词 |

查询示例：`玻璃 modal`（同时包含）、`落地页,电商`（任一匹配）、`ht`（缩写 → 后台）、`dashboard`（英文 → 仪表盘）、`ss`（→ 搜索）。

预览态支持 `←` / `→` 切换上下一个模板，顶栏显示 `n / 总数`。

**优化**：三处输入分别防抖（60–90ms）；页面卡片只创建一次，搜索/分类仅切换 `hidden` 与 CSS `order`，iframe 不重建、不闪烁；缩略图仍懒加载；组件高亮限量 120 张；结果计数带 `aria-live`。

## 页面模板分类

| 分类 | 页面 |
| --- | --- |
| ◈ 落地页 | SaaS 产品官网、新品发布活动页、创作者作品集、定价方案页、行业峰会报名页 |
| ▦ 后台仪表盘 | 数据分析总览、电商订单管理、客户管理详情、系统监控大屏、项目组合概览 |
| ◇ 电商 | 商品详情页、购物车与结算、商品列表页、订单物流跟踪、商品对比页 |
| ✎ 内容社区 | 资讯/博客首页、文章阅读页、社区话题列表、个人主页、课程/播客列表 |
| ⌘ 工具应用 | AI 聊天工作台、在线代码编辑器、项目看板、团队日历、设计系统文档站 |
| ▯ 移动端 App | 音乐播放器、外卖点餐、健康数据、钱包记账、天气 App |

## 组件库分类

| 分类 | 说明 |
| --- | --- |
| 设计风格 (style) | 玻璃拟态、新拟态、扁平、材质、极简、暗色、极光、黏土等风格 |
| 导航 (navigation) | 顶部导航、侧边栏、面包屑、标签页、分页、步骤条、底部导航、命令面板、锚点等 |
| 反馈 (feedback) | 弹窗、抽屉、下拉菜单、气泡提示、Popover、Toast、Snackbar、骨架屏、通知中心、向导、Tour、评论、对话气泡、@Mention、表情、404、维护页等 |
| 表单 (form) | 基础输入、复选/单选/开关/滑块、日期/时间/范围、Cascader/Tree/Transfer/Segmented、RichText/Markdown/Block Editor、Color/Icon/Font/Emoji Picker、Signature/Star/Slider Range/Captcha/Autocomplete/PIN/Masked/Voice、Block/JSON/Cron/Code Diff/SQL/LaTeX/Hex Color Editor、Avatar Cropper/URL Preview/Phone Picker/Address Cascader、Gradient Picker/Image Annotation/PDF/Audio Waveform/Kanban/Form Builder/Mind Map/DB Table/Spreadsheet/Regex Tester 等 |
| 数据展示 (data) | Bar/Area/Pie/Donut/Radar/Heatmap/Sankey/Funnel/Gauge/Candlestick/TreeMap/Stream/BoxPlot/Waterfall/KPI/Sparkline/Table/Calendar/Timeline/Activity/Trending/ProgressRing/LiveCounter/MiniStats/GeoHeatmap/Leaderboard/Pict/Score 等基础图表 + Combo/Dual Axis/Stacked&Range Area/Radial Bar/Waffle/Sunburst/Icicle/Treemap Advanced/Parallel Coordinates/Gantt/Waterfall Advanced/Violin/Histogram/Scatter+Trendline/Correlation Matrix/Heatmap Calendar/Force Network/Chord/Arc/Mind Map Tree/Org Chart/Word Cloud/Polar Area/Pictograph/Radar Filled/Marimekko/Population Pyramid/Slope/Bump Chart 等高级图表 |
| 布局 (layout) | Bento、Masonry、CardStack、Carousel、3D Flip、Holy Grail、Dashboard、Magazine、Resizable、Sticky、Accordion、Multi-col、Aspect、Bento Pro、Split、Comparison 等 |
| 动效 (motion) | Hover Button、Transition、Like、Parallax、Reveal、Shimmer、Pulse、Marquee、Success、Page Trans、Glitch、Liquid、Holographic、Particles、Blob、Spotlight、Sound Wave 等 |
| 视觉效果 (visual) | Glass Card Pro、Gradient Mesh、Animated Gradient、Text Gradient、Sticker、Magnetic Button 等 |
| 交互 (interaction) | Kanban、Calendar Month/Week、Timeline H、Drag&Drop、Resize、Swipe Card、Like Counter、Star Rating、Stepper、Sortable Header、Filter Chips、Chat Bot、Code Editor、Terminal、Markdown Preview、Diff、AI Image、Prompt Input、Streaming、Token Counter、Bottom Sheet、Pull Refresh、Swipe Delete、iOS Toggle、App Bar、FAB Speed Dial、Tab Bar、Action Sheet、Picker Wheel、Command Menu、Mega Menu、Anchor Nav 等 |
| 移动端 (mobile) | iOS HIG 组件 + Material Design 3 组件 + 跨平台 Safe Area、Bottom Tab、Search/Slider/Switch 等 |
| 电商 | Mini Cart、Cart Item、Checkout Steps、Payment Method、Order Summary、Order Tracking、Product Card、SKU Selector、Flash Sale、Coupon、Points、Address Form、Logistics Tracker、Review Card 等 |

## 二次开发

模板源码、分类与页面板块的运行时逻辑全部用 **TypeScript** 编写，集中在 `build_pages.ts`：

```bash
node build_pages.ts       # Node >= 22.18，原生 TS 类型擦除，无需 npm install
# 或
npm run build
```

生成脚本会读取 `CATS`（分类）与 `DEMOS`（30 个整页模板），把样式、结构、运行时注入 `frontend-ui.html`。
脚本**幂等**：只替换 `PT:` 标记的区块，原有 391 个组件卡片不受影响。

新增页面的方式：在 `DEMOS` 里调用 `add(分类 id, 名称, 描述, 标签, 页面标题, CSS, HTML)`，重新运行脚本。

> 说明：`frontend-ui.html` 是构建产物，浏览器只能运行 JS，因此注入到 HTML 里的是类型擦除后的运行时代码；所有源码仍以 TS 维护，零构建依赖。

### 视觉基调

30 个页面共用一套「高级感」处理，改一处即可全量生效：

| 机制 | 作用 |
| --- | --- |
| `polishCss()` | hex 自动降饱和 36%、大圆角收敛到 10–16px、阴影透明度上限 0.16、字重上限 700 |
| `polishText()` | 彩色 emoji → 单色几何符号（◈ ▦ ◇ ✎ ⌘ ▯ 等） |
| `REFINE_CSS` | 统一字距/行高、tabular 数字、细线表格、克制的 hover 过渡、首屏细网格与墨色底 |
| `[data-demo]` 补丁 | 针对单个模板的定点微调（监控告警点色、文章排版、移动端留白等） |

外壳同步收敛为中性底、衬线展示标题、1px 细线卡片与深色预览工具条。

外壳的视觉值由 `build_pages.ts` 中 `BLOCK_CSS` 末尾的 `Design system / Quiet editorial` 层统一治理：颜色、圆角、阴影、字重、字号全部从该处的一组语义 token 派生，上方区块仅作布局基线；维护时改这一处即可全站生效。组件预览内部的彩色属于「展品」，刻意不收敛——中性画框衬彩色作品是这套画廊感的关键。

### 动效与交互

每个整页模板都注入同一套零依赖运行时（`MOTION_CSS` / `MOTION_JS`），不是静态截图：

| 类别 | 行为 |
| --- | --- |
| 鼠标 | 柔光光晕 + 跟随光标环（遇可交互元素放大）、按钮磁吸、卡片 3D 倾斜 ±5°、图片 hover 缩放、外壳卡片 spotlight |
| 点击 | 按钮涟漪、Tab / 筛选 / 分页互斥选中、列表行选中态、无处理器按钮的轻提示、原有 inline 交互（加购、订阅、点赞、步进器）保留 |
| 滚动 | 区块入场淡入（首屏仅位移，不闪白）、KPI 数字递增、顶部 2px 滚动进度条 |
| 输入 | 搜索框实时筛选商品 / 帖子 / 表格行（透明度淡出，不跳布局） |
| 背景 | 粒子 canvas（漂浮点 + 近距连线，深色页更亮）、极淡噪点纸感、双光斑缓慢漂移、首屏细网格滚动、封面渐变呼吸 |
| 多卡片 | 卡片组错落入场；hover 一张时同组其它卡片退让（透明度 / 位移 / 饱和度），新增 6 个卡片密集型页面 |

**列表也能看到动效**：缩略图 iframe 默认静置（不跑循环、不建 canvas），鼠标悬停时外层注入 `fx-active`，只激活这一张的 CSS 动效与粒子，同时卡片高亮、缩略图轻微放大。

**约束**：30 个文档不会同时跑动画；粒子用 25fps 定时驱动、缩略图按需创建 canvas；`prefers-reduced-motion` 自动关闭位移动画；主页面「暂停动效」同步到所有 iframe；卡片 / 按钮保留 focus-visible 与 Esc 关闭。

## 项目结构

```
frontend-ui/
├── frontend-ui.html   # 交付物：单文件图库（组件库 + 页面模板）
├── build_pages.ts     # TypeScript 生成脚本（模板数据 + 运行时 + 注入逻辑）
├── package.json       # build 脚本（无依赖）
└── README.md
```
