# SWStack 修复日志 (AI 交接)

- 日期: 2026-11-19
- 对象: `swstack-web`
- 目标读者: 后续接手本项目的 AI / 开发者
- 审计基线: `bug.MD`
- 本轮性质: 定向修复高风险竞态, 数据隔离和确定性边界问题, 不是全量重构
- 提交状态: 已提交到 `feat/follow-search` (先合并 `origin/main` 的 PR #6)

## 一, 当前结果

| 检查         | 结果                          |
| ------------ | ----------------------------- |
| 前端测试     | 20 个测试文件, 109 项全部通过 |
| 前端类型检查 | 通过                          |
| 前端 ESLint  | 通过                          |
| 前端生产构建 | 通过                          |
| 后端测试     | 50 项全部通过                 |

新增测试覆盖了跨账号请求清理, 跨路由逆序响应, 通知部分失败, 项目分页, 隐藏问题, 隐藏标签, 内存数据库和后端聚合计数.

## 二, 已修复问题

| 编号 | 原问题                            | 修复结果                                                                          | 主要文件                                                                                                                       |
| ---- | --------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| B-01 | Mock 开发者资料泄露隐藏问题       | 公开资料聚合时过滤非 published 问题                                               | `src/mocks/data.ts`, `src/mocks/server.ts`                                                                                     |
| B-02 | 问题写响应可污染另一个问题        | 所有写操作响应都校验发起时的问题 ID; `reset()` 使读取失效                         | `src/stores/question-detail.ts`                                                                                                |
| B-03 | 旧账号关注请求回填新账号          | 关注 store 引入作用域 generation, 重置时作废旧请求和 `statusPromise`              | `src/stores/follows.ts`                                                                                                        |
| B-04 | 旧账号通知请求修改新账号          | 通知 store 引入作用域 generation, 所有异步操作提交前校验作用域                    | `src/stores/notifications.ts`                                                                                                  |
| B-10 | 旧项目申请显示到新项目            | 提交前捕获项目 ID 和提交 generation, 响应后双重校验                               | `src/components/projects/ProjectApplicationPanel.vue`                                                                          |
| B-11 | 项目日志/申请审核写响应跨项目污染 | 路由切换立即作废读写; 日志, 审核, 管理员删除全部使用项目 ID + mutation generation | `src/views/MyProjectUpdatesView.vue`, `src/views/MyProjectApplicationsView.vue`, `src/views/admin/AdminProjectUpdatesView.vue` |
| B-12 | 项目列表只能看第一页              | 增加页码状态, 分页控件和筛选回第一页; 末页失效时自动回退                          | `src/views/ProjectsView.vue`                                                                                                   |
| B-13 | 关注响应把计数写到新页面          | 用户页和标签页捕获原 handle/slug, 响应后校验当前路由对象                          | `src/views/UserProfileView.vue`, `src/views/TagDetailView.vue`                                                                 |
| B-14 | 未读数失败清空通知列表            | 列表和未读数改为 `Promise.allSettled()`, 辅助请求失败不影响主列表                 | `src/stores/notifications.ts`                                                                                                  |
| B-17 | 浏览量非原子读改写                | 改为数据库原子 `view_count = view_count + 1`                                      | `server/app/routers/questions.py`                                                                                              |
| B-18 | 新增内容后统计不更新              | 创建问题时增加作者计数和标签计数; 创建回答时增加作者回答数                        | `server/app/routers/questions.py`                                                                                              |
| B-19 | 隐藏标签仍进入关注动态            | 关注标签查询只接受 `Tag.status == "active"`                                       | `server/app/routers/follows.py`                                                                                                |
| B-06 | Mock 投票/收藏跨账号共享          | 由 PR #6 完成: 投票与收藏改为按用户 ID 索引的 Map, 总分单独聚合                   | `src/mocks/data.ts`, `src/mocks/server.ts`                                                                                     |
| B-21 | 删除全部问题后 ID 为 `-Infinity`  | PR #6 改用单调递增计数器, 删除后也不复用 ID                                       | `src/mocks/server.ts`                                                                                                          |
| B-22 | 剪贴板失败仍提示成功              | 检查 `execCommand()` 返回值, 并用 `finally` 清理临时节点                          | `src/utils/clipboard.ts`, `src/components/markdown/MarkdownRenderer.vue`                                                       |
| B-24 | 超大通知页码导致 500              | 页码上限固定为 1,000,000                                                          | `server/app/routers/notifications.py`                                                                                          |
| B-25 | 内存 SQLite 请求报无表            | 内存 SQLite 使用 `StaticPool` 共享连接                                            | `server/app/database.py`                                                                                                       |

## 三, 关键实现约束

后续修改以下模块时, 不要移除这些保护:

### 1. 问题详情写操作

`src/stores/question-detail.ts` 中投票, 收藏, 回答和回答投票都必须在发起时捕获 `questionId`, 响应后确认当前问题 ID 一致再写入. `reset()` 必须递增 `requestSequence`.

不要恢复成"只判断 `question.value` 是否存在"的写法, 否则 A 问题响应会写入 B 问题.

### 2. 通知作用域

`src/stores/notifications.ts` 使用 `scope` 区分账号生命周期:

- `clear()` 必须递增 `scope` 和 `sequence`.
- `load()`, `refreshUnread()`, `markRead()`, `markAllRead()` 都必须捕获 `scope`.
- 响应提交前必须确认 `scope` 未变化.
- 主列表和未读数不能重新改成 `Promise.all()`; 辅助未读数失败不能清空主列表.

### 3. 关注作用域

`src/stores/follows.ts` 同样使用 `scope`:

- `reset()` 必须递增 `scope` 并立即清空 `statusPromise`.
- 旧 `loadStatus()` 的 `.then()`, `.catch()`, `.finally()` 在作用域不匹配时不得修改状态.
- 旧 toggle 响应不得修改新账号的 `userHandles`, `tagSlugs` 或 pending 列表.

### 4. 项目工作台路由作用域

三个项目工作台在路由 ID 变化时必须同时:

- 递增 `loadSequence`
- 递增 `mutationSequence`
- 将 `loading`, `saving`, `reviewing`, `deletingId` 复位
- 才调用新项目的加载

写操作必须使用 `beginMutation()` 捕获项目 ID 和 mutation generation, 响应后通过 `isMutationCurrent()` 校验. 不要只检查 `workspace.value` 是否存在.

`ProjectEditorView`, `ColumnEditorForm` 同样使用提交 generation; `useMyProjectsStore.update()` 只允许清除当前正在编辑的同一项目, 不能无条件清空 `editor`.

### 5. 项目列表分页

`src/views/ProjectsView.vue` 的 `load()` 必须发送当前 `page`, 筛选变化必须通过 `applyFilters()` 回到第 1 页. 不要恢复固定 `page: 1`.

### 6. 后端统计

创建问题时当前实现会同时更新:

- `user.profile_question_count`
- 每个标签的 `base_question_count`
- 每个标签的 `weekly_count`

创建回答时更新 `user.profile_answer_count`.

如果未来改为"基础种子计数 + 运行期增量"的序列化方案, 必须移除这里的直接累加, 避免重复计数.

### 7. 后端浏览量

`GET /api/questions/{id}` 必须使用数据库原子递增, 不能恢复为:

```python
question.view_count += 1
db.commit()
```

### 8. SQLite 内存数据库

`create_engine_for_url()` 对 `sqlite://`, `sqlite:///:memory:` 等内存 URL 使用 `StaticPool`. 移除该配置会导致启动建表和路由查询处于不同内存数据库.

## 四, 新增或修改的测试

| 测试文件                                  | 覆盖内容                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| `tests/notifications-store.spec.ts`       | 未读数失败保留列表, clear 后旧通知响应失效             |
| `tests/follows-store.spec.ts`             | 旧关注状态/旧 toggle 在 reset 后失效, 新账号可重新加载 |
| `tests/question-detail.spec.ts`           | reset 作废读取, 旧投票/旧回答响应不写入新问题          |
| `tests/project-application-panel.spec.ts` | 切换项目后旧申请响应不显示                             |
| `tests/projects-view.spec.ts`             | 通过分页控件加载第 2 页                                |
| `tests/mock-privacy.spec.ts`              | 隐藏问题不再出现在开发者资料                           |
| `tests/project-workspace-scope.spec.ts`   | 三个项目工作台的跨项目读污染, 旧日志写响应             |
| `tests/my-projects-store.spec.ts`         | 旧项目更新不清理新项目编辑器                           |
| `server/tests/test_regressions.py`        | 内存 SQLite, 计数更新, 隐藏标签动态, 超大通知页码      |

## 五, 尚未修复

以下审计项仍然有效, 不要误认为本轮已全部处理:

| 编号 | 状态   | 说明                                                    |
| ---- | ------ | ------------------------------------------------------- |
| B-05 | 未修复 | 演示管理员口令需要产品/部署策略决定, 不能只改代码默认值 |
| B-07 | 未修复 | 问题关注仍无后端能力, 按钮仍是本地假状态                |
| B-08 | 未修复 | 回答投票并发请求仍可能逆序覆盖                          |
| B-09 | 未修复 | 全局 401 过期会话处理尚未接入                           |
| B-15 | 未修复 | 投票, 收藏, 关注的数据库先查后插竞态仍在                |
| B-16 | 未修复 | 并行创建自定义标签仍可能唯一约束冲突                    |
| B-20 | 未修复 | Mock 板块关闭后仍可提交组队申请                         |
| B-23 | 未修复 | 隐藏标签后的热门搜索缓存仍未失效                        |
| B-26 | 未修复 | 多 worker 种子初始化竞态仍在                            |
| B-27 | 未修复 | 真实后端种子通知仍链接未实现项目页                      |

建议下一轮优先处理 B-15, B-16, 再处理 B-09 和 B-05.

## 六, 验证命令

```bash
cd swstack-web
npm run typecheck
npm run lint
npm test
npm run build
```

```bash
cd swstack-web/server
uv sync --frozen --group dev
uv run pytest
```

当前预期结果:

- 前端: 20 个测试文件, 109 项通过
- 后端: 50 项通过
- 构建, Lint, 类型检查均通过

## 七, 修改文件索引

前端源码:

- `src/stores/question-detail.ts`
- `src/stores/notifications.ts`
- `src/stores/follows.ts`
- `src/views/ProjectsView.vue`
- `src/views/UserProfileView.vue`
- `src/views/TagDetailView.vue`
- `src/views/MyProjectUpdatesView.vue`
- `src/views/MyProjectApplicationsView.vue`
- `src/views/admin/AdminProjectUpdatesView.vue`
- `src/views/ProjectEditorView.vue`
- `src/components/projects/ProjectApplicationPanel.vue`
- `src/components/columns/ColumnEditorForm.vue`
- `src/components/markdown/MarkdownRenderer.vue`
- `src/stores/my-projects.ts`
- `src/mocks/data.ts`
- `src/mocks/server.ts`
- `src/utils/clipboard.ts`

后端源码:

- `server/app/routers/questions.py`
- `server/app/routers/follows.py`
- `server/app/routers/notifications.py`
- `server/app/database.py`

测试:

- `tests/notifications-store.spec.ts`
- `tests/projects-view.spec.ts`
- `tests/mock-privacy.spec.ts`
- `tests/project-workspace-scope.spec.ts`
- `tests/my-projects-store.spec.ts`
- `tests/follows-store.spec.ts`
- `tests/question-detail.spec.ts`
- `tests/project-application-panel.spec.ts`
- `server/tests/test_regressions.py`

文档:

- `bug.MD`
- `FIX_LOG.MD`
- `UI_AUDIT_REPORT.MD` (全页面使用, 响应式, 基础无障碍与 UI 风格审计)
