# Google Play 发布指南

> 合一记账 (He-Yi Records) 发布文档

---

## 📋 发布前检查清单

### 必需材料

- [x] 隐私政策 URL
- [x] 应用图标 (1024x1024)
- [x] 应用截图 (至少2张)
- [x] 应用描述
- [x] 签名密钥 (已生成)
- [x] Release APK

### Google Play 账号

- 开发者账号：https://play.google.com/console
- 注册费用：$25 (一次性)

---

## 🔧 构建 Release APK

### 方式1：Android Studio (推荐)

1. 用 Android Studio 打开 `android` 文件夹
2. 菜单 → Build → Generate Signed Bundle/APK
3. 选择 APK
4. 选择签名密钥：`android/app/heyi-key.jks`
   - Key alias: `heyi-key`
   - 密码: `heyi123456`
5. 选择 Build Variant: `release`
6. 点击 Generate

### 方式2：命令行

```powershell
# 设置 JDK 路径
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# 进入 Android 目录
cd android

# 构建 Release
.\gradlew.bat assembleRelease
```

### 输出位置

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 提交到 Google Play

### 步骤1：创建应用

1. 访问 https://play.google.com/console
2. 登录开发者账号
3. 点击「创建应用」
4. 选择默认语言：中文
5. 填写应用名称：**合一记账**
6. 点击创建

### 步骤2：填写商店信息

| 字段 | 内容 |
|------|------|
| 应用名称 | 合一记账 |
| 简短说明 | 纯本地运行的个人财务管理应用 |
| 完整描述 | 合一记账是一款纯本地运行的个人财务管理桌面应用，支持导入支付宝、微信、京东、银行等平台的账单，进行自动分类、去重和统计分析。 |
| 应用图标 | 1024x1024 PNG |
| 截图 | 至少2张手机截图 |

### 步骤3：设置定价和分发

- **价格**：免费
- **分发国家/地区**：选择所有国家

### 步骤4：上传 APK

1. 点击「正式版」轨道
2. 上传 `app-release.apk`
3. 填写版本信息

### 步骤5：提交审核

1. 检查所有信息
2. 点击「提交审核」
3. 等待审核 (通常1-3天)

---

## 📄 隐私政策

**URL**: https://github.com/xin690/he-yi-records/blob/master/PRIVACY.md

**内容要点**：
- 不收集任何个人信息
- 纯本地存储 (localStorage)
- 不上传任何数据
- 仅请求存储权限

---

## 🔑 签名密钥信息

| 项目 | 值 |
|------|-----|
| 密钥文件 | android/app/heyi-key.jks |
| Key Alias | heyi-key |
| 密码 | heyi123456 |
| 有效期限 | 10000天 (~27年) |

**⚠️ 重要提示**：
- 妥善保管密钥文件
- 丢失密钥将无法更新应用
- 建议备份到安全位置

---

## 📊 应用信息

| 项目 | 值 |
|------|-----|
| 应用名称 | 合一记账 |
| 包名 | com.heyi.records |
| 版本 | 1.0.0 |
| 版本代码 | 1 |
| Target SDK | 34 (Android 14) |
| Min SDK | 22 (Android 5.1) |

---

## ❓ 常见问题

### Q1: 审核需要多长时间？
A: 通常1-3个工作日

### Q2: 需要软著吗？
A: 不需要，Google Play 不要求软著

### Q3: 应用内可以放广告吗？
A: 可以，但需要遵守 Google Play 广告政策

### Q4: 如何更新应用？
A: 使用相同密钥签名新版本 APK，上传到同一应用即可

### Q5: 应用图标有什么要求？
A: 1024x1024 PNG，Google Play 会自动生成各尺寸

---

## 📞 联系信息

- 开发者：xin
- 邮箱：xsfw687@gmail.com
- GitHub：https://github.com/xin690/he-yi-records

---

*最后更新：2026年4月9日*