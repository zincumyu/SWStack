# 贡献指南

## 环境要求

- Node.js 20.19+ 或 22.12+, 推荐 22 LTS
- npm >= 10

## 本地开发

```bash
npm install
npm run dev
```

默认使用 Mock 数据. 对接 FastAPI 时参考 `README.md` 的切换说明.

## 提交前检查

```bash
npm run typecheck
npm run build
```

## 分支与提交

- 从 `main` 创建短生命周期分支, 例如 `feat/login-page`, `fix/header-overflow`.
- 提交信息使用 Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- 一个提交只处理一件事.
- 不提交 `.env`, 真实密钥, `node_modules` 或 `dist`.

## Pull Request

- 说明改动内容与验证方式.
- UI 改动附上桌面端和移动端截图.
- 确保 GitHub Actions 的 `CI` 工作流通过.
- 关联相关 Issue.
