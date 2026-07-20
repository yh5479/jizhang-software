# 消耗品比价 · 记账 App（v1）

把设计原型落成的**真·功能 App 第一版**：技术栈为 **Vite + React + TypeScript + Capacitor + @capacitor-community/sqlite**。
v1 只做两块、但数据全部**真实本地持久化**（不是写死的演示数据）：

- **记一笔**：记录每一笔支出（金额 / 品类 / 备注 / 可选关联某消耗品），首页看本月总支出 + 预算进度环 + 最近记录。
- **消耗品比价**：维护商品库，每次购买录入「规格 + 价格」，自动把 `100抽×4包` 这类混淆单位**换算成可比单价（元/抽）**，并标注「比上次贵 / 便宜 X%」、历史最低 / 均价，给出「现在买划不划算」结论。

视觉上端口了原设计稿的**双主题玻璃质感**：白天 = Apple 玻璃、黑夜 = Spotify 暗色能量；底部长条孔 Tab（蓝色高亮段）、56px 克制 FAB、降噪背景 blob。

---

## 技术栈与目录

```
consumption-tracker/
├── capacitor.config.ts        # Capacitor 配置（appId / appName / webDir=dist）
├── index.html                 # Vite 入口
├── src/
│   ├── main.tsx App.tsx       # 入口 + 手机壳/导航/Tab/FAB 编排
│   ├── theme/ThemeContext.tsx # 亮/暗主题切换（data-theme）
│   ├── styles/tokens.css      # 双主题设计令牌（亮=A / 暗=B）
│   ├── styles/global.css      # 玻璃卡 / Tab / FAB / 手机壳 等
│   ├── db/db.ts               # SQLite 初始化（Web→IndexedDB / Native→系统SQLite）
│   ├── db/repo.ts             # 增删查 + 首次 seed
│   ├── logic/unit.ts          # 规格解析与单位换算（核心）
│   ├── logic/compare.ts       # 比价计算（核心）
│   ├── logic/categories.ts    # 品类常量
│   ├── components/            # GlassCard / TopNav / TabBar / FAB / ProgressRing / BarCompare / Modal / icons
│   └── screens/               # Home（记一笔）/ Compare（比价）/ Settings（主题）/ ExpenseModal
├── dist/                      # 构建产物（已同步进安卓）
└── android/                   # Capacitor 安卓原生工程（已 add + sync）
```

依赖：`react` `react-dom` `@capacitor/core` `@capacitor-community/sqlite`；开发依赖：`vite` `@vitejs/plugin-react` `typescript` `@capacitor/cli` `@capacitor/android`。

---

## 本地运行（看效果，最快）

```bash
cd consumption-tracker
npm install          # 安装依赖（首次）
npm run dev          # 启动 Vite 开发服务器，浏览器打开提示的 http://localhost:5173
```

在浏览器里即可操作：记账、加消耗品、录购买看比价。数据存在浏览器 **IndexedDB**，刷新不丢。

> 想切换亮/暗主题：点右上角太阳/月亮按钮，或在「我的」页切换。

## 构建 Web 产物

```bash
npm run build       # tsc 类型检查 + vite 生产构建 → 输出到 dist/
npm run preview     # 本地预览构建产物
```

## 打包成安卓 APK（重点）

本工程**已执行过 `npx cap add android` 与 `npx cap sync android`**，安卓原生工程 `android/` 已就绪、Web 产物也已同步进去。
但**编译 APK 需要本机安装 Android SDK + JDK + Android Studio**（当前开发环境没有装，所以没在这里直接编出 .apk）。在你自己的电脑上：

1. 安装 [Android Studio](https://developer.android.com/studio)（会顺带装好 Android SDK、Gradle、JDK）。
2. 确保已同步最新 Web 产物：
   ```bash
   npm run build
   npx cap sync android
   ```
3. 用 Android Studio 打开本目录下的 `android/` 文件夹（File → Open）。
4. 等待 Gradle 同步完成（首次会下载依赖，需联网）。
5. 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**。
6. 编译完成后，APK 在 `android/app/build/outputs/apk/debug/app-debug.apk`。
7. 手机开启「开发者模式 → 未知来源安装」，把 apk 传过去安装即可；或用 USB 线直接 **Run ▶ app**（选已连接的手机）。

> 真机一键运行（需手机 USB 调试已开）：`npx cap run android`
> 改了 Web 代码后，务必先 `npm run build` 再 `npx cap sync android`，否则安卓里还是旧页面。

---

## 数据怎么存的

- 用 `@capacitor-community/sqlite`：
  - **浏览器（Web / dev）**：走其 Web 实现，数据落 **IndexedDB**（需 `initWebStore()`，代码里已处理）。
  - **安卓（安装后的 App）**：走系统原生 SQLite，数据在 App 私有沙盒，卸载即清。
- 三张表：`expenses`（记账）、`consumption_items`（消耗品）、`purchases`（每次购买 + 换算后的可比单价）。
- 首次启动若库为空，会自动 seed 两条示例（维达抽纸 / 可口可乐）方便直接看比价效果；之后不再插入。

## 单位换算规则（logic/unit.ts）

- `"100抽×4包"` → 数字 `[100, 4]` 相乘 = 400，单位取首个「抽」 → 可比单价 = 价 ÷ 400，标签「元/抽」。
- `"500ml"` → 500 ml；`"1.5kg"` → 1.5 kg；纯数字 `"5"` → 视为 1 个「份」。
- 支持的单价单位含：抽/张/片/包/瓶/盒/份/支/卷/条/袋/罐/听/块/个/双/组/件/ml/g/kg/l/L 等。
- 在「添加购买」表单里实时预览：`￥39.9 ÷ (100抽 × 4) = ￥0.10 / 抽`。

---

## 已知限制 / 后续路线

- v1 仅「记一笔 + 比价」两块；**资产（实体+金钱）、时间统计、随记** 尚未做（设计稿里已有对应页面，可后续按同框架补）。
- 本环境未装 Android SDK，故**没有在此直接产出 .apk**，需你在本机用 Android Studio 按上面步骤编译。
- 后续可加：云端同步、预算/重复购买提醒、数据导出 CSV、把 emoji 图标换成统一线性 SVG。
