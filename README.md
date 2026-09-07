# Frontend UI Gallery Pro

一个单文件（零依赖）的前端 UI 组件图库，收录常见的前端设计模式与组件样式，点击任意卡片即可查看对应的 **AI 提示词**，一键复制后交给 AI 生成对应的 UI / 前端代码。

## 特性

- **单文件、零依赖**：整个图库就是一个 `frontend-ui.html`，无需构建、无需安装，双击即用。
- **391 个组件**：覆盖 10 大分类的 UI 设计模式与组件样式。
- **搜索 + 过滤**：支持关键词搜索，并按分类快速筛选。
- **动效控制**：可统一暂停循环动效，并自动尊重系统“减少动态效果”设置。
- **可切换技术栈**：Prompt 支持原生 HTML、React 和 Vue 技术栈覆盖。
- **一键复制提示词**：点击卡片弹出详情，展示组件名称、典型场景和可直接复制的 AI 提示词。
- **一键复制代码**：每个组件都附带可直接运行的 React + TypeScript + Tailwind CSS 实现代码，弹窗中切换「📋 Prompt / 💻 代码」即可查看复制。

## 快速开始

直接用浏览器打开 `frontend-ui.html` 即可，无需任何环境：

```bash
# 直接双击文件，或在浏览器中打开
start frontend-ui.html   # Windows
open frontend-ui.html    # macOS
```

## 分类

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
| 移动端 (mobile) | iOS HIG 组件（Large Title、Search Bar、Context Menu、Action Sheet、Alert、Tab Bar with Badges、List Row、Settings Cell、Pull Down、Date Picker Wheel、Picker Inline、Page Indicator、Progress HUD）+ Material Design 3 组件（Top App Bar、Navigation Drawer/Rail、FAB Variants、Chip Set、Snackbar、Banner、Card Elevated、Text Field）+ Cross-platform（Safe Area、Bottom Tab、Search/Slider/Switch）等 |
| 电商 (mobile interaction / form / data) | Mini Cart、Cart Item、Checkout Steps、Payment Method、Order Summary、Order Tracking、Shipping Method、Invoice、Discount Code、Product Card Pro/Horizontal、Image Gallery、SKU Selector、Price Tag、Flash Sale、Compare Bar、Coupon、Points、Sign-in Calendar、Membership Card、Referral Code、Address Card/Form、Logistics Tracker、Review Card 等 |

## 使用方式

1. 在顶部搜索框输入关键词，或点击分类标签筛选组件。
2. 点击任意卡片，查看该组件的名称、分类与典型使用场景。
3. 可在弹窗中切换目标技术栈，再点击「复制 Prompt」生成对应 UI / 前端代码。
4. 需要逐帧观察时，点击筛选栏中的「暂停动效」。

## 项目结构

```
front-ui/
├── frontend-ui.html   # 单文件图库（HTML + CSS + JS）
├── README.md          # 项目介绍
└── .gitignore         # Git 忽略规则
```
