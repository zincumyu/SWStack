# SWStack Web

面向高校开发者的技术问答前端. 视觉参考 Stack Overflow, 采用浅色密排布局. 当前版本包含问答, 全站搜索, 开发者目录, 项目投稿与开发日志, 图片上传与审核, 管理员与授权作者共同维护的专栏, 站内通知, 项目展示与管理后台, 使用 Mock 数据, API 层已按 FastAPI 后端对接方式隔离.

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
git clone https://github.com/zincumyu/SWStack.git
cd SWStack
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`.

## 常用脚本

| 命令                | 说明                           |
| ------------------- | ------------------------------ |
| `npm run dev`       | 启动开发服务器                 |
| `npm run build`     | 类型检查并构建到 `dist/`       |
| `npm run preview`   | 预览生产构建                   |
| `npm run typecheck` | 只运行 Vue/TypeScript 类型检查 |

构建产物位于 `dist/`. 部署到静态托管时需要将未知路径回退到 `index.html`.

## 页面路由

| 路由                          | 页面                                         |
| ----------------------------- | -------------------------------------------- |
| `/`                           | 问题列表与排序                               |
| `/search?q=&type=&page=`      | 全站搜索, 覆盖问题, 项目, 专栏, 标签与开发者 |
| `/questions/:id`              | 问题详情, Markdown 正文, 回答与投票          |
| `/tags`                       | 标签目录                                     |
| `/tags/:slug`                 | 标签下的问题                                 |
| `/projects`                   | 项目展示, 支持状态与需求筛选                 |
| `/projects/:slug`             | 项目详情, 截图画廊, README, 成员与开发日志   |
| `/my/projects`                | 我的项目工作台, 需要登录                     |
| `/my/projects/new`            | 发布项目, 上传封面与截图并提交审核, 需要登录 |
| `/my/projects/:id/edit`       | 编辑自己的项目并重新提交审核, 需要登录       |
| `/my/projects/:id/updates`    | 管理自己项目的开发日志, 需要登录             |
| `/columns`                    | 专栏列表, 支持关键词, 难度与标签筛选         |
| `/columns/:slug`              | 专栏详情, Markdown 正文与资源清单            |
| `/my/columns`                 | 我的专栏工作台, 需要专栏写作权限             |
| `/my/columns/new`             | 新建自己的专栏, 需要专栏写作权限             |
| `/my/columns/:id/edit`        | 编辑自己的专栏, 需要专栏写作权限             |
| `/users`                      | 开发者目录                                   |
| `/users/:handle`              | 开发者主页                                   |
| `/ask`                        | 提问表单, 需要登录                           |
| `/notifications`              | 站内通知, 需要登录                           |
| `/login`                      | 登录页                                       |
| `/welcome`                    | 新手指南                                     |
| `/admin`                      | 管理总览, 需要管理员                         |
| `/admin/questions`            | 问题管理                                     |
| `/admin/projects`             | 项目管理, 审核队列与板块可见性               |
| `/admin/projects/:id/review`  | 审核单个项目, 通过或驳回                     |
| `/admin/projects/:id/updates` | 删除项目中的违规开发日志                     |
| `/admin/columns`              | 专栏管理                                     |
| `/admin/columns/new`          | 新建专栏                                     |
| `/admin/columns/:id/edit`     | 编辑专栏                                     |
| `/admin/users`                | 用户管理                                     |
| `/admin/tags`                 | 标签管理                                     |

游客仅可访问 `/welcome` 与 `/login`. 访问其他路由会跳转到 `/welcome`, 并保留登录后返回的目标页面.

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
    projects/   项目卡片, 截图画廊, 状态, 审核徽标, 开发日志管理, 板块关闭提示
    columns/    共享专栏编辑器, 支持管理员与作者两种模式
    search/     分组结果, 关键词高亮与各范围结果行
    sidebar/    右侧统计与推荐面板
    markdown/   Markdown 渲染器
    admin/      管理后台外壳与分页
  views/        路由页面
    admin/      管理总览, 问题, 项目, 开发日志, 专栏, 用户, 标签
  assets/       全局样式与主题变量
  utils/        格式化, 剪贴板, Markdown, 错误, 专栏元信息
```

## 登录与演示账号

Mock 环境提供两个演示账号.

| 角色   | 邮箱                  | 密码         |
| ------ | --------------------- | ------------ |
| 管理员 | `admin@swstack.dev`   | `admin123`   |
| 学生   | `student@swstack.dev` | `student123` |

登录页支持一键填入演示账号. 勾选 `保持登录` 时登录状态写入 `localStorage`, 否则写入 `sessionStorage`. 退出登录会清除两者. 接入 FastAPI 后建议改用服务端 Cookie 会话.

权限规则:

- 游客只能访问 `/welcome` 与 `/login`. 其他路由统一跳转到 `/welcome`, 登录后按 `redirect` 返回目标页面.
- `/search` 与搜索接口需要登录, 只返回当前账号可见的公开内容.
- `/ask` 需要登录.
- `/my/projects` 及其子路由需要登录, 成员只能编辑自己负责的项目.
- `/my/columns` 及其子路由需要登录, 并且需要专栏写作权限. 无权限时跳转回专栏列表.
- `/notifications` 需要登录, 只能读取当前账号的通知.
- `/admin` 及其子路由需要管理员角色.
- 管理员可以精选, 隐藏, 删除问题, 调整用户角色与状态, 创建标签, 编辑标签描述与公开状态.
- 隐藏的问题会立即从公共列表和详情中移除.
- 停用账号不能登录, 同时从公开用户目录隐藏.
- 成员发布或编辑项目后, 项目进入待审核状态. 只有审核通过且板块公开时才会出现在项目展示.
- 登录成员可以上传项目封面与详情截图. 前端限制 JPG, PNG, WebP, 单张 5MB, 详情截图最多 4 张. 真实后端必须再次校验文件类型, 体积与访问权限.
- 管理员审核通过项目会立即上线, 驳回时必须填写审核备注.
- 管理员可以精选, 隐藏或删除已上线项目, 也可以关闭整个项目板块.
- 项目板块关闭后, 公共导航与页脚入口隐藏, 项目列表和详情显示暂未开放, 成员仍可在工作台维护项目, 管理员入口保持可用.
- 项目负责人可以新增, 编辑和删除自己项目的开发日志. 日志操作不会重置项目审核状态, 编辑已上线项目资料仍会重新审核.
- 未上线项目的日志会先保存在工作台, 项目通过审核后随项目一起公开. 已上线项目的新日志会直接进入公开详情页时间线.
- 管理员可以从项目管理进入开发日志管理页删除违规日志. 项目审核页保持只读.
- 管理员可以在用户管理中授予或撤销成员的专栏写作权限. 管理员默认拥有该权限.
- 获得权限的成员可以在我的专栏工作台创建, 编辑, 发布, 下线与删除自己的专栏. 草稿仅作者本人与管理员可见.
- 管理员可以管理全部专栏, 设置精选, 下线或删除. 成员不能修改精选标记.
- 管理员下线专栏后会锁定为草稿, 作者可以继续修改, 但需要管理员重新发布后才会公开.
- 项目审核通过或驳回时, 系统会向项目负责人发送通知. 驳回通知包含审核备注.
- 管理员开通或撤销专栏写作权限, 下线专栏时, 系统会向对应用户发送通知.
- 自己的问题收到新回答时, 系统会向提问者发送通知. 自己回答自己的问题不会触发通知.
- 顶部铃铛与个人菜单显示未读数. 通知页支持全部与未读筛选, 单条已读与全部已读.
- 全站搜索覆盖问题, 项目, 专栏, 标签与开发者. 全部范围先展示分组预览, 单独范围支持分页, 标题, 简介与标签中的关键词会高亮.

前端路由守卫只负责界面导航. 真实后端必须在每个管理接口上再次校验角色与账号状态.

## 后台管理

管理后台位于 `/admin`, 采用管理导航与内容区两栏布局.

- 总览: 问题, 回答, 用户, 标签, 项目指标, 待审核项目, 治理队列与最近活跃数据.
- 问题管理: 按关键词与状态筛选, 精选, 隐藏, 恢复, 删除.
- 项目管理: 按关键词, 审核状态, 可见性与需求筛选, 精选, 隐藏, 恢复, 删除, 关闭或开启整个项目板块.
- 项目审核: 核验封面, 详情截图, README, 成员与链接, 通过并上线或填写备注后驳回. 已通过项目只读展示审核记录.
- 开发日志管理: 查看项目全部日志并删除违规内容, 不改变项目审核状态.
- 专栏管理: 管理全部作者的专栏, 按关键词, 状态与难度筛选, 新建, 编辑, 发布, 下线, 精选与删除. 编辑器提供 Markdown 实时预览.
- 待审核项目优先排在项目管理列表前部, 总览治理队列提供待审核入口.
- 用户管理: 搜索, 按角色与状态筛选, 调整角色, 授予或撤销专栏写作权限, 停用或恢复账号.
- 标签管理: 搜索, 按状态筛选, 新建标签, 编辑描述, 隐藏或公开标签.
- 当前登录管理员不能修改自己的角色, 状态或专栏权限.
- 审核项目, 调整专栏权限或下线专栏时, 系统会向对应用户发送站内通知.
- 删除问题或项目需要二次确认, 删除不可撤销.

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

| 方法   | 路径                                   | 返回                              |
| ------ | -------------------------------------- | --------------------------------- |
| POST   | `/api/auth/login`                      | `AuthResult`                      |
| POST   | `/api/auth/logout`                     | `{ "success": true }`             |
| GET    | `/api/session/me`                      | `AuthUser`                        |
| POST   | `/api/uploads/images`                  | `UploadedImage`                   |
| GET    | `/api/questions`                       | `PageResult<QuestionSummary>`     |
| GET    | `/api/questions/:id`                   | `QuestionDetail`                  |
| POST   | `/api/questions`                       | `QuestionSummary`                 |
| POST   | `/api/questions/:id/vote`              | `VoteResult`                      |
| POST   | `/api/questions/:id/bookmark`          | `BookmarkResult`                  |
| POST   | `/api/questions/:id/answers`           | `Answer`                          |
| POST   | `/api/answers/:id/vote`                | `VoteResult`                      |
| GET    | `/api/tags`                            | `Tag[]`                           |
| GET    | `/api/users`                           | `UserProfile[]`                   |
| GET    | `/api/users/:handle`                   | `UserProfile`                     |
| GET    | `/api/search`                          | `SearchResults`                   |
| GET    | `/api/community/overview`              | `CommunityOverview`               |
| GET    | `/api/projects/board`                  | `ProjectBoardSettings`            |
| GET    | `/api/projects`                        | `PageResult<ProjectSummary>`      |
| GET    | `/api/projects/:slug`                  | `ProjectDetail`                   |
| GET    | `/api/projects/mine`                   | `MyProject[]`                     |
| GET    | `/api/projects/mine/:id`               | `ProjectEditData`                 |
| GET    | `/api/projects/mine/:id/updates`       | `ProjectUpdatesWorkspace`         |
| POST   | `/api/projects/mine/:id/updates`       | `ProjectUpdate`                   |
| PATCH  | `/api/project-updates/mine/:updateId`  | `ProjectUpdate`                   |
| DELETE | `/api/project-updates/mine/:updateId`  | `ProjectUpdateDeleteResult`       |
| POST   | `/api/projects`                        | `MyProject`                       |
| PATCH  | `/api/projects/:id`                    | `MyProject`                       |
| GET    | `/api/columns`                         | `PageResult<ColumnSummary>`       |
| GET    | `/api/columns/:slug`                   | `ColumnDetail`                    |
| GET    | `/api/my/columns`                      | `PageResult<ColumnWorkspaceItem>` |
| GET    | `/api/my/columns/:id`                  | `ColumnWorkspaceDetail`           |
| POST   | `/api/my/columns`                      | `ColumnWorkspaceDetail`           |
| PUT    | `/api/my/columns/:id`                  | `ColumnWorkspaceDetail`           |
| PATCH  | `/api/my/columns/:id`                  | `ColumnWorkspaceItem`             |
| DELETE | `/api/my/columns/:id`                  | `AdminDeleteResult`               |
| GET    | `/api/notifications`                   | `PageResult<NotificationItem>`    |
| GET    | `/api/notifications/unread-count`      | `NotificationUnreadCount`         |
| PATCH  | `/api/notifications/:id`               | `NotificationItem`                |
| POST   | `/api/notifications/read-all`          | `NotificationReadAllResult`       |
| GET    | `/api/admin/overview`                  | `AdminOverview`                   |
| GET    | `/api/admin/questions`                 | `PageResult<AdminQuestion>`       |
| PATCH  | `/api/admin/questions/:id`             | `AdminQuestion`                   |
| DELETE | `/api/admin/questions/:id`             | `AdminDeleteResult`               |
| GET    | `/api/admin/projects`                  | `AdminProjectsResult`             |
| GET    | `/api/admin/projects/:id`              | `AdminProjectDetail`              |
| GET    | `/api/admin/projects/:id/updates`      | `AdminProjectUpdatesWorkspace`    |
| DELETE | `/api/admin/project-updates/:updateId` | `ProjectUpdateDeleteResult`       |
| PATCH  | `/api/admin/projects/board`            | `ProjectBoardSettings`            |
| PATCH  | `/api/admin/projects/:id`              | `AdminProject`                    |
| DELETE | `/api/admin/projects/:id`              | `AdminDeleteResult`               |
| GET    | `/api/admin/columns`                   | `PageResult<AdminColumn>`         |
| GET    | `/api/admin/columns/:id`               | `AdminColumnDetail`               |
| POST   | `/api/admin/columns`                   | `AdminColumnDetail`               |
| PUT    | `/api/admin/columns/:id`               | `AdminColumnDetail`               |
| PATCH  | `/api/admin/columns/:id`               | `AdminColumn`                     |
| DELETE | `/api/admin/columns/:id`               | `AdminDeleteResult`               |
| GET    | `/api/admin/users`                     | `PageResult<AdminUser>`           |
| PATCH  | `/api/admin/users/:id`                 | `AdminUser`                       |
| GET    | `/api/admin/tags`                      | `AdminTag[]`                      |
| POST   | `/api/admin/tags`                      | `AdminTag`                        |
| PATCH  | `/api/admin/tags/:slug`                | `AdminTag`                        |

登录请求:

```json
{ "email": "admin@swstack.dev", "password": "admin123", "remember": true }
```

问题列表查询参数: `page`, `pageSize`, `sort`, `tag`, `q`.
排序值: `newest`, `active`, `unanswered`, `votes`.

全站搜索查询参数: `q`, `type`, `page`, `pageSize`.
`type` 取值: `all`, `questions`, `projects`, `columns`, `tags`, `users`.
`type=all` 时每个范围最多返回 4 条预览, 并保留各范围的完整计数; 指定 `type` 时按 `page` 与 `pageSize` 分页, 默认 8 条, 最大 20 条.
搜索只包含公开内容: 隐藏问题, 未发布专栏, 隐藏标签, 停用账号以及项目板块关闭时的项目不会返回. 当前 Mock 会匹配标题, 简介, 正文, 标签, 作者信息与项目技术栈等字段.

管理问题查询参数: `page`, `pageSize`, `q`, `status`.
`status` 取值: `all`, `published`, `hidden`, `unanswered`.

管理用户查询参数: `page`, `pageSize`, `q`, `role`, `status`.
`role` 取值: `all`, `admin`, `member`.
`status` 取值: `all`, `active`, `suspended`.

项目查询参数: `page`, `pageSize`, `q`, `status`, `need`.
`status` 取值: `all`, `idea`, `building`, `beta`, `launched`, `archived`.
`need` 取值: `all`, `feedback`, `teammates`.

管理项目查询参数: `page`, `pageSize`, `q`, `review`, `visibility`, `need`.
`review` 取值: `all`, `pending`, `approved`, `rejected`.
`visibility` 取值: `all`, `published`, `hidden`.

项目板块开关请求为 `{ "enabled": false }`.
管理项目更新请求支持 `{ "visibility": "hidden" }` 与 `{ "featured": true }`.
审核请求支持:

```json
{ "reviewStatus": "approved", "reviewNote": "资料完整, 通过上线" }
```

```json
{ "reviewStatus": "rejected", "reviewNote": "请在 README 补充本地启动步骤" }
```

驳回时 `reviewNote` 至少 5 个字符. 通过时备注可选, 且默认将项目可见性设为 `published`.

开发日志请求:

```json
{ "title": "完成课程表冲突检测", "body": "本周补上了跨周课程的处理, 并修复了 ..." }
```

日志标题为 4-80 个字符, 正文为 20-3000 个字符. 只有项目负责人可以调用成员端口的日志接口. 日志增删改不会调用项目审核流程, 也不会改变项目的 `reviewStatus` 或 `visibility`.

专栏查询参数: `page`, `pageSize`, `q`, `level`, `tag`.
`level` 取值: `all`, `beginner`, `intermediate`, `advanced`.
公开接口只返回 `published` 专栏. 管理专栏查询还支持 `status`: `all`, `draft`, `published`.

我的专栏接口需要登录且账号拥有专栏写作权限. 列表只返回当前账号创建的专栏. 成员创建专栏时 `featured` 会被忽略, 更新时保留管理员设置的精选状态. 成员只能通过 `PATCH` 修改 `status`. 管理员下线专栏后, 成员更新或发布时会保持草稿状态, 重新发布需要管理员操作. `AuthUser` 与 `AdminUser` 通过 `canWriteColumns` 表示专栏写作权限, 管理员恒为 `true`. 工作台专栏额外返回 `moderationLocked`, 表示专栏是否被管理员下线.

通知接口需要登录, 只返回当前账号的通知. 查询参数为 `page`, `pageSize`, `filter`. `filter` 取值: `all`, `unread`. 单条已读请求为 `{ "read": true }`. 项目审核通过或驳回, 专栏权限开通或撤销, 专栏被管理员下线, 自己的问题收到新回答时会产生通知. 通知返回 `type`, `title`, `body`, `read`, `createdAt` 与 `link`.

新建或更新专栏请求:

```json
{
  "title": "Vue 3 工程化入门路径",
  "slug": "vue3-engineering-path",
  "summary": "按阶段梳理 Vue 3 与 TypeScript 的学习顺序.",
  "level": "beginner",
  "tags": ["vue3", "typescript"],
  "body": "# Vue 3 工程化入门路径\n\n...",
  "resources": [
    {
      "title": "Vue 3 官方文档",
      "url": "https://cn.vuejs.org/guide/",
      "description": "组合式 API 与组件通信的权威入口."
    }
  ],
  "status": "published",
  "featured": true
}
```

专栏标题为 4-80 个字符, 摘要为 20-200 个字符, 正文为 100-20000 个字符. 标签从现有社区标签中选择 1-5 个, 资源最多 8 条, 链接必须为 http(s) 地址. 更新已发布专栏会立即生效, 转为草稿后会立即从公开列表和详情下线.

成员项目提交请求:

```json
{
  "name": "CampusFlow",
  "slug": "campus-flow",
  "tagline": "面向课程小组的任务协作工具",
  "coverImage": "/uploads/projects/campus-flow-cover.png",
  "screenshots": [
    "/uploads/projects/campus-flow-dashboard.png",
    "/uploads/projects/campus-flow-tasks.png"
  ],
  "techStack": ["Vue 3", "FastAPI"],
  "status": "building",
  "needs": ["feedback"],
  "teamName": "CampusFlow Team",
  "githubUrl": "https://github.com/example/campus-flow",
  "demoUrl": "https://example.com/campus-flow",
  "readme": "## 项目说明\n\n..."
}
```

创建与编辑都会把项目重置为 `pending`, 并清空上一次审核备注. 编辑已上线项目会暂时将其从公开项目展示下线, 直到重新审核通过.

`coverImage` 必填, `screenshots` 可选且最多 4 张. 两者都保存图片地址, 不保存原始文件. 未上传封面时前端使用 `/projects/project-default.svg` 作为占位封面.

图片上传请求使用 `multipart/form-data`, 文件字段名为 `file`. 示例省略会话凭证, 真实请求需要携带登录 Cookie:

```bash
curl -X POST http://127.0.0.1:8000/api/uploads/images \
  -F "file=@cover.png"
```

成功响应:

```json
{
  "url": "/uploads/projects/2026/10/cover.png",
  "name": "cover.png",
  "mimeType": "image/png",
  "size": 184320
}
```

上传规则:

- 仅支持 JPG, PNG 与 WebP.
- 单张图片不超过 5MB.
- 需要登录会话.
- Mock 环境会把图片读成 data URL 并直接返回, 因此刷新页面后上传图片会丢失.
- 真实 FastAPI 后端应校验扩展名, MIME 与文件头, 生成随机文件名, 存入对象存储或静态上传目录, 返回可访问的图片 URL, 并限制请求体大小.
- 建议后端保留上传记录并在项目保存时校验图片归属, 避免引用其他用户的私有文件.

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
管理用户更新请求支持 `{ "role": "admin" }`, `{ "status": "suspended" }` 与 `{ "canWriteColumns": true }`. 管理员不能修改自己的角色, 状态或专栏权限.
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

Mock 数据仅用于演示. 刷新页面后投票, 收藏, 新增内容, 开发日志, 专栏, 专栏权限, 通知与管理操作会重置. 登录状态根据 `保持登录` 设置保留在浏览器存储中.

内置演示项目的封面位于 `public/projects/`, 使用本地 SVG, 不依赖外部图片. 默认项目封面为 `public/projects/project-default.svg`. 项目中的 GitHub 与 Demo 地址是演示占位链接. 成员上传的封面与详情截图在 Mock 中保存为 data URL, 刷新页面后恢复默认. 项目板块开关, 单个项目的隐藏状态, 审核状态和开发日志也只保存在当前页面内存中, 刷新后恢复默认. 专栏草稿与发布状态同样只保存在当前页面内存中.

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
