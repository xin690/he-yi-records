# 贡献指南

感谢您对合一记账的兴趣！我们欢迎任何形式的贡献，包括但不限于报告 bug、提交功能建议、改进文档或提交代码。

## 如何贡献

### 报告 Bug

1. 搜索现有的 [Issues](https://github.com/xin690/he-yi-records/issues) 确保没有重复
2. 使用 Bug 模板创建新的 Issue
3. 提供详细的问题描述，包括：
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、版本等）

### 功能建议

1. 搜索现有的 Issues 和 PR 确保没有重复
2. 使用 Feature Request 模板创建 Issue
3. 详细描述功能需求和用例

### 代码贡献

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 进行开发并提交更改
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/xin690/he-yi-records.git
cd he-yi-records

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

## 代码规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码规范
- 使用 Prettier 格式化代码
- 提交前确保通过 lint 检查

## 提交信息规范

请使用语义化的提交信息：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

示例：
```
feat: 添加账单导入功能
fix: 修复分类引擎错误
docs: 更新 README 文档
```

## Pull Request 审查

- 确保所有 CI 检查通过
- 描述清楚 PR 的目的和改动内容
- 关联相关的 Issue

## 许可证

贡献本项目即表示您同意按 MIT 许可证开源您的贡献。