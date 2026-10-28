# SWStack Web

面向高校开发者的技术问答前端. 视觉参考 Stack Overflow, 采用浅色密排布局. 当前版本使用 Mock 数据, API 层已按 FastAPI 后端对接方式隔离.

## 技术栈

- Vue 3 + TypeScript + `<script setup lang="ts">`
- Vite 7
- Pinia
- Vue Router
- axios
- markdown-it + highlight.js + DOMPurify

## 环境要求

- Node.js 20.19+ 或 22.12+, 推荐 22 LTS
- npm >= 10

## 快速开始

```bash
git clone <repository-url>
cd swstack-web
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`.

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查并构建到 `dist/` |
| `npm run preview` | 预览生产构建 |
| `npm run typecheck` | 只运行 Vue/TypeScript 类型检查 |

构建产物位于 `dist/`. 部署到静态托管时需要将未知路径回退到 `index.html`.

## 页面路由

| 路由 | 页面 |
| --- | --- |
| `/` | 问题列表与排序 |
| `/search?q=` | 搜索结果 |
| `/questions/:id` | 问题详情, Markdown 正文, 回答与投票 |
| `/tags` | 标签目录 |
| `/tags/:slug` | 标签下的问题 |
| `/users` | 开发者目录 |
| `/users/:handle` | 开发者主页 |
| `/ask` | 提问表单, 需要登录 |
| `/login` | 登录页 |
| `/admin` | 管理总览, 需要管理员 |
| `/admin/questions` | 问题管理 |
| `/admin/users` | 用户管理 |
| `/admin/tags` | 标签管理 |

## 目录结构

```text
src/
  api/          API 契约, axios transport, mock switch
  mocks/        Mock 数据与内存路由
  stores/       Pinia setup stores
  components/
    layout/     Header, Footer
    common/     Avatar, Tag, Toast, EmptyState
    questions/  问题列表, 详情, 回答, 投票
    sidebar/    右侧统计与推荐面板
    markdown/   Markdown 渲染器
    admin/      管理后台外壳与分页
  views/        路由页面
    admin/      管理总览, 问题, 用户, 标签
  assets/       全局样式与主题变量
  utils/        格式化, 剪贴板, Markdown, 错误
```

## 登录与演示账号

Mock 环境提供两个演示账号.

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | `admin@swstack.dev` | `admin123` |
| 学生 | `student@swstack.dev` | `student123` |

登录页支持一键填入演示账号. 勾选 `保持登录` 时登录状态写入 `localStorage`, 否则写入 `sessionStorage`. 退出登录会清除两者. 接入 FastAPI 后建议改用服务端 Cookie 会话.

权限规则:

- `/ask` 需要登录.
- `/admin` 及其子路由需要管理员角色.
- 游客投票, 收藏, 关注或回答时跳转登录页, 登录后回到原页面.
- 管理员可以精选, 隐藏, 删除问题, 调整用户角色与状态, 创建标签, 编辑标签描述与公开状态.
- 隐藏的问题会立即从公共列表和详情中移除.
- 停用账号不能登录, 同时从公开用户目录隐藏.

前端路由守卫只负责界面导航. 真实后端必须在每个管理接口上再次校验角色与账号状态.

## 后台管理

管理后台位于 `/admin`, 采用管理导航与内容区两栏布局.

- 总览: 问题, 回答, 用户, 标签指标, 治理队列与最近活跃数据.
- 问题管理: 按关键词与状态筛选, 精选, 隐藏, 恢复, 删除.
- 用户管理: 搜索, 按角色与状态筛选, 调整角色, 停用或恢复账号.
- 标签管理: 搜索, 按状态筛选, 新建标签, 编辑描述, 隐藏或公开标签.
- 当前登录管理员不能修改自己的角色或停用自己.
- 删除问题需要二次确认, 删除不可撤销.

## Mock 与 FastAPI 切换

默认启用 Mock. 需要对接真实后端时创建 `.env`:

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
```

开发服务器已将 `/api` 代理到 `http://127.0.0.1:8000`. 部署时可直接将 `VITE_API_BASE_URL` 指向后端地址.

响应格式支持两种:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 20 }
```

```json
{ "data": { "items": [], "total": 0, "page": 1, "pageSize": 20 } }
```

错误响应读取 `message` 或 `detail` 字段.

## API 契约

| 方法 | 路径 | 返回 |
| --- | --- | --- |
| POST | `/api/auth/login` | `AuthResult` |
| POST | `/api/auth/logout` | `{ "success": true }` |
| GET | `/api/session/me` | `AuthUser` |
| GET | `/api/questions` | `PageResult<QuestionSummary>` |
| GET | `/api/questions/:id` | `QuestionDetail` |
| POST | `/api/questions` | `QuestionSummary` |
| POST | `/api/questions/:id/vote` | `VoteResult` |
| POST | `/api/questions/:id/bookmark` | `BookmarkResult` |
| POST | `/api/questions/:id/answers` | `Answer` |
| POST | `/api/answers/:id/vote` | `VoteResult` |
| GET | `/api/tags` | `Tag[]` |
| GET | `/api/users` | `UserProfile[]` |
| GET | `/api/users/:handle` | `UserProfile` |
| GET | `/api/community/overview` | `CommunityOverview` |
| GET | `/api/admin/overview` | `AdminOverview` |
| GET | `/api/admin/questions` | `PageResult<AdminQuestion>` |
| PATCH | `/api/admin/questions/:id` | `AdminQuestion` |
| DELETE | `/api/admin/questions/:id` | `AdminDeleteResult` |
| GET | `/api/admin/users` | `PageResult<AdminUser>` |
| PATCH | `/api/admin/users/:id` | `AdminUser` |
| GET | `/api/admin/tags` | `AdminTag[]` |
| POST | `/api/admin/tags` | `AdminTag` |
| PATCH | `/api/admin/tags/:slug` | `AdminTag` |

登录请求:

```json
{ "email": "admin@swstack.dev", "password": "admin123", "remember": true }
```

问题列表查询参数: `page`, `pageSize`, `sort`, `tag`, `q`.
排序值: `newest`, `active`, `unanswered`, `votes`.

管理问题查询参数: `page`, `pageSize`, `q`, `status`.
`status` 取值: `all`, `published`, `hidden`, `unanswered`.

管理用户查询参数: `page`, `pageSize`, `q`, `role`, `status`.
`role` 取值: `all`, `admin`, `member`.
`status` 取值: `all`, `active`, `suspended`.

创建问题请求:

```json
{ "title": "标题", "body": "Markdown 正文", "tags": ["vue", "typescript"] }
```

投票请求:

```json
{ "value": 1 }
```

`value` 取值为 `-1`, `0`, `1`. 收藏请求为 `{ "bookmarked": true }`.

管理问题更新请求支持 `{ "status": "hidden" }` 与 `{ "featured": true }`.
管理用户更新请求支持 `{ "role": "admin" }` 与 `{ "status": "suspended" }`.
新建标签请求:

```json
{ "name": "机器学习", "slug": "machine-learning", "description": "标签描述" }
```

完整类型定义见 `src/api/types.ts`.

## 主题与样式

颜色, 圆角, 阴影, 代码块与排版变量集中定义在 `src/assets/styles/base.css` 的 `body[data-theme='light']` 作用域. 主题通过 `data-theme` 切换, 当前仅开放浅色. 新增暗色时只需添加对应 token 块, 无需改动组件.

核心色值:

- 页面背景 `#F6F6F6`
- 卡片背景 `#FFFFFF`
- 边框 `#E4E6E8`
- 品牌橙 `#F48024`, 仅用于按钮, Logo 与强调

## Markdown 安全

正文经 markdown-it 渲染, highlight.js 高亮, DOMPurify 清洗后再注入. 外部链接自动添加安全属性. 代码块支持一键复制.

## 说明

Mock 数据仅用于演示. 刷新页面后投票, 收藏, 新增内容与管理操作会重置. 登录状态根据 `保持登录` 设置保留在浏览器存储中.

演示账号和密码仅用于 Mock 环境. 接入真实后端时请删除演示账号提示并改为服务端认证.

## 持续集成

`.github/workflows/ci.yml` 在 push 到 `main` 和 pull request 时执行 `npm ci`, 类型检查与生产构建.

## 参与贡献

见 `CONTRIBUTING.md`. 提交前至少运行:

```bash
npm run typecheck
npm run build
```

## 许可

MIT, 见 `LICENSE`.
