# 合一记账 (He-Yi Records)

> 纯本地运行的个人财务管理应用

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28+-brightgreen.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 简介

合一记账是一款纯本地运行的个人财务管理桌面应用，支持导入支付宝、微信、京东、银行等平台的账单，进行自动分类、去重和统计分析。

## 功能特性

- **多平台导入**：支持支付宝、微信、京东、银行等平台的账单导入
  - 支付宝 CSV 账单（GBK 编码支持）
  - 微信 Excel 账单
  - 京东 CSV 账单
  - 银行卡账单
- **智能分类**：基于规则引擎和商户库的自动分类
- **去重引擎**：精确匹配 + 模糊匹配双重去重
- **统计分析**：
  - 月度收支统计
  - 分类占比分析
  - 趋势图表
  - 消费排行
- **数据安全**：纯本地存储，数据保存在浏览器 localStorage中
- **桌面特性**：支持窗口最小化、最大化、关闭等操作

## 技术栈

- **框架**：Electron + React + TypeScript
- **状态管理**：Zustand
- **样式**：Tailwind CSS
- **图表**：ECharts
- **文件解析**：PapaParse (CSV) + ExcelJS (Excel)
- **构建工具**：Vite + electron-builder

## 开发环境

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
cd he-yi-records
npm install
```

### 开发模式

```bash
npm run dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

### 构建打包

#### Windows

```bash
# 构建安装包
npm run pack

# 构建便携版（免安装）
npm run build:app
```

#### macOS

```bash
npm run build:mac
```

#### Linux

```bash
npm run build:linux
```

#### 全平台

```bash
npm run build:all
```

打包完成后，安装包/便携版位于 `release/` 目录下。

## 项目结构

```
he-yi-records/
├── electron/           # Electron 主进程代码
│   ├── main.ts        # 主进程入口
│   ├── preload.ts    # 预加载脚本
│   └── tsconfig.json
├── src/               # React 渲染进程代码
│   ├── components/   # React 组件
│   ├── hooks/        # 自定义 Hooks
│   ├── lib/          # 核心库（解析器、分类引擎等）
│   ├── pages/        # 页面组件
│   ├── stores/       # Zustand 状态管理
│   ├── styles/       # 全局样式
│   ├── types/        # TypeScript 类型定义
│   └── App.tsx       # React 应用入口
├── scripts/           # 构建脚本
├── resources/        # 构建资源（图标等）
├── package.json      # 项目配置
└── vite.config.ts    # Vite 配置
```

## 数据存储

应用使用 localStorage 进行本地数据存储，数据存储键名为 `heyi_records_db`。数据格式为 JSON，包含以下内容：

- 交易记录 (transactions)
- 账户信息 (accounts)
- 分类规则 (category_rules)
- 设置项 (settings)

## 支持的平台数据格式

### 支付宝 CSV

- 文件格式：CSV
- 编码：GBK
- 关键字段：交易时间、金额、收/支、商品说明、订单号

### 微信 Excel

- 文件格式：XLSX
- 关键字段：交易时间、交易类型、金额(元)、交易状态、交易描述

### 京东 CSV

- 文件格式：CSV
- 编码：UTF-8
- 关键字段：交易时间、订单金额、交易说明、商户名称

### 银行卡

- 支持 CSV 格式
- 自动识别收支方向

## 分类说明

系统内置了以下默认分类规则：

- **餐饮**：外卖、快餐、饮品、正餐
- **购物**：网购、日用品、食品
- **交通**：打车、公共交通、加油、停车、火车、飞机
- **通讯**：话费、网费
- **娱乐**：会员、音乐、游戏、文化、旅游
- **医疗**：药品、医疗
- **教育**：培训、书籍
- **居住**：房租、水电煤
- **金融**：保险
- **收入**：工资、兼职、退款
- **社交**：红包、转账、聚餐
- **其他**：其他支出

## 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](LICENSE) 文件。

## 移动端支持 (Android/iOS)

使用 CapacitorJS 将应用转换为移动端应用。

### 前置要求

- Android Studio (Android 构建)
- Xcode (iOS 构建，仅 macOS)

### 构建 Android APK

```bash
# 安装 Capacitor 依赖（仅首次）
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android

# 构建 Web
npm run build

# 同步到 Android
npx cap sync android

# 使用 Android Studio 打开项目
# Build → Build APK
```

APK 输出路径：`android/app/build/outputs/apk/debug/app-debug.apk`

### 构建 iOS

```bash
# 添加 iOS 平台
npx cap add ios

# 同步到 iOS
npx cap sync ios

# 使用 Xcode 打开项目
# Product → Build
```

### 注意事项

- 移动端使用 WebView 加载，数据存储在 localStorage
- 部分桌面端特性（如文件选择器）在移动端需使用 Capacitor 插件
- 建议使用 HashRouter (已在配置中启用)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ECharts](https://echarts.apache.org/)