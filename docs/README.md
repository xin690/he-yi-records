# 合一记账

> 纯本地运行的个人财务管理应用

## 简介

合一记账是一款纯本地运行的个人财务管理桌面应用，支持导入支付宝、微信、京东、银行等平台的账单，进行自动分类、去重和统计分析。

## 功能特性

- **多平台导入**：支持支付宝、微信、京东、银行等平台的账单导入
- **智能分类**：基于规则引擎和商户库的自动分类
- **去重引擎**：精确匹配 + 模糊匹配双重去重
- **统计分析**：月度收支、分类占比、趋势图表、消费排行
- **数据安全**：纯本地存储，数据保存在 localStorage 中
- **跨平台**：支持 Windows、macOS、Android

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
# Windows
npm run pack

# Android
npm run cap:sync
```

## 技术栈

- Electron + React + TypeScript
- Zustand (状态管理)
- Tailwind CSS
- ECharts
- Capacitor (移动端)

## 文档导航

- [产品设计](./PRODUCT_DESIGN.md)
- [隐私政策](./PRIVACY.md)
- [Google Play 上架指南](./GOOGLE_PLAY_RELEASE.md)
- [贡献指南](./CONTRIBUTING.md)

## 许可证

MIT License
