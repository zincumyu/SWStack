# SWStack 项目缺陷审计报告

- 审计对象: `swstack-web` (Vue 3 前端 + FastAPI 后端)
- 审计日期: 2026-11-19
- 审计范围: 路由与权限, 会话, 问答与投票, 收藏, 关注与动态, 搜索, 通知, 项目, 专栏, 管理后台, Mock 数据层, FastAPI 接口, SQLite 初始化与并发写入
- 审计方式: 全量代码走查, 前后端契约对照, 现有测试执行, 构建验证
- 说明: `bbs-vue3-ui` 与 `GooseForum` 是独立论坛项目, 不属于本次 `swstack-web` 审计范围
- 修复状态: 已修复其中 16 项, 详见 `FIX_LOG.MD`; 本文件保留初次审计快照, 未列出为已修复的项目仍然有效

## 一, 验证基线

| 检查项       | 命令                | 结果                             |
| ------------ | ------------------- | -------------------------------- |
| 前端单元测试 | `npm test`          | 14 个测试文件, 84 项测试全部通过 |
| 前端类型检查 | `npm run typecheck` | 通过                             |
| 前端生产构建 | `npm run build`     | 通过, Vite 构建成功              |
| 后端测试     | `uv run pytest`     | 46 项测试通过                    |

现有测试全部通过, 但没有覆盖跨账号请求回写, 跨路由写响应, 同一实体并发写入, 聚合计数更新等场景, 因此下列缺陷未被测试发现.

## 二, 缺陷总览

| 编号 | 等级 | 模块           | 缺陷                                     | 主要影响                 |
| ---- | ---- | -------------- | ---------------------------------------- | ------------------------ |
| B-01 | 高   | Mock 用户资料  | 隐藏问题仍出现在公开开发者资料           | 非公开内容泄露           |
| B-02 | 高   | 问题详情       | 投票, 收藏, 回答的旧响应可写入另一个问题 | 页面数据错乱, 回答串题   |
| B-03 | 高   | 关注           | 退出或换号后旧关注请求仍会回填状态       | 跨账号状态污染           |
| B-04 | 高   | 通知           | 旧通知请求可修改新账号的列表与未读数     | 跨账号状态污染           |
| B-05 | 高   | 后端初始化     | 空库自动创建公开口令管理员               | 非隔离部署可被直接接管   |
| B-06 | 中   | Mock 投票/收藏 | 投票与收藏状态由所有账号共享             | 不同账号互相继承操作     |
| B-07 | 中   | 问题详情       | "关注问题"只修改本地布尔值, 不持久化     | 功能假成功               |
| B-08 | 中   | 回答投票       | 并发点击后旧响应可覆盖最新选择           | 显示与服务端不一致       |
| B-09 | 中   | 会话           | 会话过期后的 401 不会清理前端身份        | 页面持续显示已登录       |
| B-10 | 中   | 项目申请       | 旧项目申请响应可显示到新项目             | 申请信息串项目           |
| B-11 | 中   | 项目管理/审核  | 日志与申请写响应可污染新工作台           | 数据被错误增删           |
| B-12 | 中   | 项目列表       | 永远只请求第一页且无分页入口             | 超过 12 个项目不可访问   |
| B-13 | 中   | 用户/标签关注  | 旧响应可把关注数写到新页面               | 计数错误, 标签页可能报错 |
| B-14 | 中   | 通知           | 未读数请求失败会清空已成功的通知列表     | 列表被误报为加载失败     |
| B-15 | 中   | 后端写入       | 投票, 收藏, 关注的先查后插存在竞态       | 并发请求返回 500         |
| B-16 | 中   | 后端标签       | 并行创建同名自定义标签产生唯一约束冲突   | 提问请求返回 500         |
| B-17 | 中   | 后端浏览量     | 浏览量使用非原子读改写                   | 丢计数, 竞争时可能报错   |
| B-18 | 中   | 后端统计       | 新增问题/回答后作者和标签计数不更新      | 同页数据自相矛盾         |
| B-19 | 中   | 关注动态       | 已关注标签被隐藏后内容仍进入动态         | 隐藏内容继续曝光         |
| B-20 | 低   | Mock 项目      | 板块关闭后仍可直接提交组队申请           | 与板块关闭规则不一致     |
| B-21 | 低   | Mock 问题      | 删除全部问题后新问题 ID 变成 `-Infinity` | 创建后无法打开详情       |
| B-22 | 低   | 剪贴板         | 降级复制失败仍提示成功                   | 错误成功提示             |
| B-23 | 低   | 搜索联想       | 隐藏标签后热门搜索缓存不失效             | 短时间展示已隐藏标签     |
| B-24 | 低   | 后端通知       | 超大页码使 SQLite OFFSET 溢出            | 请求返回 500             |
| B-25 | 低   | 后端数据库     | 内存 SQLite 未配置共享连接池             | 请求报 `no such table`   |
| B-26 | 低   | 后端启动       | 多 worker 同时初始化种子数据存在竞态     | worker 启动失败          |
| B-27 | 低   | 真实后端通知   | 种子通知链接指向尚未实现的项目页面       | 点击进入 404             |

## 三, 详细缺陷

### B-01 隐藏问题仍出现在公开开发者资料

- 严重级别: 高
- 位置:
  - `src/mocks/data.ts:1540-1557`
  - `src/mocks/server.ts:919-927`
  - `src/mocks/server.ts:1234-1240`
- 触发条件:
  1. 管理员在问题管理中隐藏某个近期问题.
  2. 打开该问题作者的开发者主页, 或读取开发者目录.
- 实际结果: 被隐藏问题的标题, 摘要, 标签和作者信息仍会进入 `recentQuestions`, 点击后才因公共详情接口过滤而得到 404.
- 预期结果: 隐藏问题应从开发者目录, 开发者主页和其他公开资料视图中完全移除.
- 根因: `buildUserProfile()` 只按作者筛选并按时间截取 5 条, 没有检查 `getQuestionStatus()`. 真实后端 `server/app/services.py:157-163` 已正确过滤 `Question.status == "published"`, Mock 与真实后端行为不一致.
- 修复建议: 在 `buildUserProfile()` 聚合边界统一过滤非公开问题, 并增加"隐藏问题后目录与个人主页均不可见"的对照测试.

### B-02 投票, 收藏和回答的旧响应可写入另一个问题

- 严重级别: 高
- 位置:
  - `src/stores/question-detail.ts:40-88`
  - `src/stores/question-detail.ts:90-95`
  - `src/views/QuestionDetailView.vue:341-359`
- 触发条件:
  1. 在问题 A 提交回答, 投票或收藏, 并让请求保持 pending.
  2. 切换到问题 B, 等待 B 加载完成.
  3. 让 A 的请求最后返回.
- 实际结果:
  - A 的投票分数和收藏状态可能覆盖 B.
  - `submitAnswer()` 会把 A 的回答加入到 B 的 `answersList`, 并修改 B 的回答数和最近活动时间.
- 预期结果: 写响应只能更新发起操作时对应的问题, 不得修改之后加载的其他问题.
- 根因: 三个写操作在 `await` 后只判断 `question.value` 是否存在, 没有校验问题 ID; 读取请求有 `requestSequence`, 写请求没有等价保护, `reset()` 也不会使 pending 写操作失效.
- 修复建议: 发起时捕获 `questionId` 和操作序列; 响应后同时校验当前问题 ID, 序列和组件生命周期. `reset()` 应递增统一 generation, 使读取和写入都失效. 补充 A→B 路由切换下的逆序响应测试.

### B-03 退出或换号后旧关注请求仍会回填状态

- 严重级别: 高
- 位置:
  - `src/stores/follows.ts:43-68`
  - `src/stores/follows.ts:71-115`
  - `src/stores/follows.ts:146-161`
  - `src/components/layout/AppHeader.vue:280-291`
- 触发条件:
  1. 账号 A 发起 `loadStatus()` 或关注切换, 保持请求 pending.
  2. 退出 A, 触发 `followStore.reset()`.
  3. 登录账号 B, 再让 A 的请求返回.
- 实际结果:
  - A 的关注用户与标签会写入 B 的内存状态.
  - A 的旧 toggle 结果也可能被加入 B.
  - 旧 `loadStatus()` 会把 `statusLoaded` 置为 `true`, B 随后可能直接信任错误缓存.
- 预期结果: 清理后所有旧账号请求均应失效, B 只能读取自己的关注关系.
- 根因: `reset()` 只递增 `feedSequence`, 没有状态请求或写操作的 generation, 也没有作废 `statusPromise`; 旧请求的 `.then()` 和 toggle 成功分支均无条件写入.
- 修复建议: 为关注 store 引入账号作用域和统一 generation; 重置时递增 generation 并忽略旧响应. 提交结果前校验发起请求的用户 ID.

### B-04 旧通知请求可修改新账号的列表与未读数

- 严重级别: 高
- 位置:
  - `src/stores/notifications.ts:20-58`
  - `src/stores/notifications.ts:61-117`
  - `src/stores/notifications.ts:119-130`
  - `src/components/layout/AppHeader.vue:280-291`
- 触发条件:
  1. 账号 A 发起未读数刷新, 单条已读或全部已读.
  2. 请求完成前退出并登录账号 B.
  3. 让 A 的请求在 B 的数据加载后返回.
- 实际结果:
  - A 的未读数可能覆盖 B.
  - A 的单条已读响应会无条件减少 B 的 `unread`.
  - A 的 `markAllRead()` 响应会把 B 当前页显示为已读并将未读数清零, 但服务端只处理了 A.
- 预期结果: 退出或换号后旧响应不得生效; 已读状态必须与当前账号及服务端一致.
- 根因: `clear()` 只让 `load()` 的 `sequence` 失效; `refreshUnread()`, `markRead()`, `markAllRead()` 没有账号或序列校验.
- 修复建议: 所有通知操作共享账号 generation; `clear()` 使全部操作失效; 响应时校验账号和操作目标, 避免仅凭本地状态计算未读数.

### B-05 空库自动创建公开口令管理员

- 严重级别: 高 (非隔离部署时)
- 位置:
  - `server/app/seed.py:499-506`
  - `server/app/main.py:52-56`
- 触发条件: 使用空数据库启动真实后端, 且实例可被外部访问.
- 实际结果: 系统自动创建 `admin@swstack.dev / admin123` 管理员; 任何知道演示口令的人都可以直接登录后台.
- 预期结果: 演示种子只能由显式开发开关启用; 生产环境应由独立初始化流程创建管理员, 并使用随机或人工设置的强口令.
- 根因: 应用启动时无条件执行 `seed_database()`, 种子函数又无条件写入固定管理员口令, 没有环境判断.
- 修复建议: 增加 `SWSTACK_SEED_DEMO` 等显式开关; 生产环境禁用演示账号; 首次部署使用一次性初始化命令和强制改密. README 中需明确此风险不只是"演示数据".

### B-06 Mock 投票和收藏状态由所有账号共享

- 严重级别: 中
- 位置:
  - `src/mocks/data.ts:276-292`
  - `src/mocks/server.ts:816-833`
  - `src/mocks/server.ts:870-884`
- 触发条件: 学生账号对问题投票或收藏, 退出后使用管理员账号打开同一问题.
- 实际结果: 管理员会继承学生的 `viewerVote` 和 `bookmarked`; 继续操作会基于上一账号的状态修改总分. 回答投票同样如此.
- 预期结果: 总分可以共享, 但每个账号的投票选择和收藏状态必须独立.
- 根因: 每条问题或回答只有一个全局 `viewerVote`, 收藏也只有一个 `bookmarked` 字段; `requireSessionUser()` 的返回值没有用于定位用户记录.
- 修复建议: 在 Mock 中使用按用户 ID 索引的 vote/bookmark Map; 总分由基础分与所有用户投票聚合, 不在共享记录上保存 viewer 状态.

### B-07 "关注问题"是假成功, 不持久化

- 严重级别: 中
- 位置:
  - `src/views/QuestionDetailView.vue:86-95`
  - `src/views/QuestionDetailView.vue:229`
  - `src/views/QuestionDetailView.vue:333-348`
- 触发条件: 登录后在问题详情点击"关注".
- 实际结果: 按钮切换为"已关注"并提示成功, 但刷新页面或切换问题后状态丢失; 后端没有问题关注接口或数据模型, 关注动态也不会包含该问题.
- 预期结果: 要么真实持久化并反映在关注动态中, 要么隐藏该入口.
- 根因: `toggleFollow()` 只翻转组件内 `following` 布尔值, 路由变化时再重置为 `false`.
- 修复建议: 补齐问题关注契约与数据表, 或在前端移除该按钮, 避免向用户展示未实现能力.

### B-08 回答投票并发请求可逆序覆盖最新选择

- 严重级别: 中
- 位置:
  - `src/stores/question-detail.ts:76-88`
  - `src/views/QuestionDetailView.vue:297-305`
  - `src/components/questions/AnswerItem.vue:5-9`
- 触发条件: 在同一个回答上快速先点赞同再点反对, 并让第一个请求晚于第二个返回.
- 实际结果: 两次请求都基于尚未更新的 `viewerVote` 计算目标值, 旧响应可能最后覆盖 UI; 最终显示可能与服务端记录不一致.
- 预期结果: 最终状态应等同于用户最后一次操作, 并与服务端一致.
- 根因: 回答投票控件没有 busy 状态, `voteAnswer()` 也没有 pending 或 sequence 保护.
- 修复建议: 至少按回答 ID 禁止并发; 或者为每次操作分配序列并校验响应. 补充"赞同→反对"的逆序响应测试.

### B-09 会话过期后的 401 不会清理前端身份

- 严重级别: 中
- 位置:
  - `src/api/http.ts:37-55`
  - `src/stores/session.ts:28-58`
  - `src/router/index.ts:241-264`
- 触发条件: 登录后让 Cookie 过期或被服务端撤销, 然后继续操作或导航到受保护页面.
- 实际结果: 请求只被转换为 `ApiError` 并显示错误, 头像, 管理员身份和本地权限仍然保留; 由于 `initialized=true`, 路由守卫不会再次请求 `/session/me`.
- 预期结果: 非登录请求发生 401 时, 应清理过期会话并跳转登录页, 同时保留原目标地址.
- 根因: axios 层没有统一的响应拦截器, session store 没有供 401 使用的失效方法, 路由守卫只依赖一次性的 initialized 缓存.
- 修复建议: 增加统一 401 处理, 排除登录失败和初始 `/session/me` 探测; 清理账号作用域状态后再跳转登录, 避免循环重定向.

### B-10 旧项目申请响应可显示到新项目

- 严重级别: 中
- 位置:
  - `src/components/projects/ProjectApplicationPanel.vue:248-273`
  - `src/components/projects/ProjectApplicationPanel.vue:324-363`
- 触发条件: 在项目 A 提交组队申请, 请求 pending 时切换到项目 B, 并让 A 的响应最后返回.
- 实际结果: `submittedApplication` 被设置为 A 的申请; 由于它优先于 `props.project.viewerApplication`, B 的侧面板会显示 A 的申请状态和内容.
- 预期结果: 仅当当前项目 ID 等于 `created.projectId` 时才更新本地面板.
- 根因: 成功回调先无条件写入 `submittedApplication`, 之后才检查 `projectStore.current?.id`; 项目 watcher 只能清理切换当时的数据, 无法阻止后续旧响应.
- 修复建议: 发起时捕获项目 ID, 响应后先校验当前项目, 再写入所有本地状态; 路由切换时增加操作 generation.

### B-11 项目日志和申请审核的写响应可污染新工作台

- 严重级别: 中
- 位置:
  - `src/views/MyProjectUpdatesView.vue:521-550`
  - `src/views/MyProjectUpdatesView.vue:589-613`
  - `src/views/MyProjectApplicationsView.vue:420-458`
  - `src/views/admin/AdminProjectUpdatesView.vue:269-289`
- 触发条件: 在项目 A 新增, 编辑, 删除日志或审核申请, 请求 pending 时切换到同路由的项目 B.
- 实际结果: 旧响应直接修改当前 `workspace.value`, 可能把 A 的日志加入 B, 删除 B 中同 ID 项, 或增加 B 的成员数; 成功提示和随后同步也可能作用在错误上下文.
- 预期结果: 写操作只能修改其原项目, 路由切换后旧操作不得触碰新 workspace.
- 根因: `loadSequence` 只保护读取; mutation 在 `await` 后没有校验项目 ID 或组件 generation.
- 修复建议: 捕获操作的项目 ID, 工作区版本和编辑目标, 响应后逐项核对; 路由变化时同时作废读取与写入回调.

### B-12 项目展示固定只取第一页且没有分页入口

- 严重级别: 中
- 位置:
  - `src/views/ProjectsView.vue:142-149`
  - `src/views/ProjectsView.vue:169`
  - `src/views/ProjectsView.vue:208-216`
- 触发条件: 公开项目总数超过 12 个后打开 `/projects`.
- 实际结果: 请求始终为 `page: 1, pageSize: 12`, 页面只渲染当前数组, 没有分页或加载更多控件, 第 13 个及后续项目不可访问.
- 预期结果: 用户可浏览 `total` 中的全部公开项目.
- 根因: API 已支持 `PageResult<ProjectSummary>`, 但视图固定第一页且没有使用分页组件.
- 修复建议: 增加页码状态和分页控件, 筛选变化时回到第一页, 并处理删除或审核导致末页消失时的页码回退.

### B-13 用户或标签关注响应可把关注数写到新页面

- 严重级别: 中
- 位置:
  - `src/views/UserProfileView.vue:225-258`
  - `src/views/TagDetailView.vue:103-118`
- 触发条件: 在开发者 A 或标签 A 点击关注, 立即切换到 B, 并让 A 的响应最后返回.
- 实际结果: B 页面上的 `followerCount` 被设置为 A 的返回值; 标签页在切换后还可能读取新标签名称, 若新标签尚未加载则可能抛出异常.
- 预期结果: 只更新被操作对象的计数和提示.
- 根因: `await` 后未核对原 handle/slug, 直接写入路由组件共享的本地 ref; 标签提示还使用了响应后的 `tag.value.name`.
- 修复建议: 捕获原 handle/slug, 响应后确认当前路由一致再更新; 或让计数统一进入按对象键控的 store.

### B-14 未读数请求失败会导致整个通知列表被清空

- 严重级别: 中
- 位置: `src/stores/notifications.ts:20-58`
- 触发条件: 让 `/notifications` 成功, 同时让 `/notifications/unread-count` 失败.
- 实际结果: `Promise.all()` 整体 reject, 已成功取得的通知列表被丢弃, `items=[]`, `total=0`, 页面进入加载失败状态.
- 预期结果: 通知列表仍应显示; 未读数保留旧值或单独提示刷新失败.
- 根因: 主列表和辅助未读数被强制绑定为一个成功单元, 没有分别处理错误.
- 修复建议: 分离请求, 或使用 `Promise.allSettled()`; 列表成功时提交列表, 计数失败只影响计数状态.

### B-15 投票, 收藏和关注存在先查后插竞态

- 严重级别: 中
- 位置:
  - `server/app/routers/questions.py:204-217` 问题投票
  - `server/app/routers/questions.py:235-250` 收藏
  - `server/app/routers/questions.py:307-320` 回答投票
  - `server/app/routers/follows.py:56-67` 关注用户
  - `server/app/routers/follows.py:90-101` 关注标签
  - 唯一约束: `server/app/models.py:163-207`
- 触发条件:
  1. 登录同一账号, 确保目标尚未投票, 收藏或关注.
  2. 使用相同会话 Cookie 并行发送两个相同写入请求.
  3. 让两个请求都在提交前完成 `SELECT`, 随后分别提交.
- 实际结果: 两个事务都判断记录不存在并执行 `INSERT`; 后提交者触发 `UNIQUE constraint failed`, 代码未捕获 `IntegrityError`, 最终返回未处理的 500.
- 预期结果: 投票和显式收藏这类目标状态写入应幂等返回 200; 关注切换也不应因唯一约束竞争泄露为 500.
- 根因: 唯一约束只能防止重复行, 不能把 Python 层的"查询-判断-插入"变成原子操作.
- 修复建议: 投票使用数据库 UPSERT; 显式收藏使用 `INSERT ... ON CONFLICT DO NOTHING`; 冲突后重新读取当前状态. toggle 关注需要事务串行化, 或改为明确的目标状态接口.

### B-16 并行创建带相同自定义标签的问题会产生唯一约束冲突

- 严重级别: 中
- 位置:
  - `server/app/routers/questions.py:148-170`
  - `server/app/models.py:74-84`
- 触发条件: 两个登录用户并行调用 `POST /api/questions`, 请求都包含同一个此前不存在的标签, 例如 `brand-new-topic`, 并让两个请求先执行到标签查询.
- 实际结果: 双方都查询不到标签, 随后分别执行 `db.add(Tag(...))` 和 `db.flush()`; 后写入者因 `tags.slug` 唯一约束失败, 请求返回 500.
- 预期结果: 两个请求都应成功, 并复用同一个标签记录.
- 根因: 自定义标签采用非原子的 get-or-create, 没有冲突恢复逻辑.
- 修复建议: 使用 SQLite UPSERT 创建标签, 冲突后重新查询; 或捕获 `IntegrityError`, 回滚到保存点并重新读取. 标签与问题创建仍应保持在同一事务中.

### B-17 问题浏览量使用非原子读改写

- 严重级别: 中
- 位置: `server/app/routers/questions.py:98-106`
- 触发条件: 对同一问题并行发送多次 `GET /api/questions/{id}`, 使多个请求在任一请求提交前读取到相同 `view_count`.
- 实际结果: 各请求基于旧值计算 `old + 1`, 最终浏览量少于实际请求次数; SQLite 写锁竞争时还可能出现锁错误.
- 预期结果: 每次成功读取详情应恰好增加一次浏览量.
- 根因: `question.view_count += 1` 是 Python 内存中的读改写, 不是数据库原子递增.
- 修复建议: 使用单条原子 SQL `UPDATE ... SET view_count = view_count + 1 ... RETURNING view_count`, 并配置合理的 SQLite busy timeout; 必要时启用 WAL.

### B-18 新增问题或回答后作者与标签计数不更新

- 严重级别: 中
- 位置:
  - `server/app/serializers.py:67-76`
  - `server/app/serializers.py:152-189`
  - `server/app/routers/questions.py:172-187`
  - `server/app/routers/questions.py:266-289`
  - `server/app/seed.py:530-548`
- 触发条件:
  1. 学生账号创建带 `vue3` 标签的问题.
  2. 再对问题 101 创建回答.
  3. 查询 `/api/users/suhe` 和 `/api/tags`.
- 实际结果:
  - 新问题已出现在 `recentQuestions` 和问题列表, 但个人 `questionCount` 不变.
  - 新回答已计入问题的 `answerCount`, 但个人 `answerCount` 不变.
  - `vue3` 过滤列表已包含新问题, 但标签 `questionCount` 和 `weeklyCount` 不变.
- 预期结果: 新增公开内容后, 相关聚合计数应增加, 至少不能出现列表已更新而标题计数不变.
- 根因: 创建问题或回答只写内容表, 没有维护 `profile_question_count`, `profile_answer_count`, `base_question_count` 或 `weekly_count`; 序列化器直接返回静态种子值.
- 修复建议: 在创建内容的事务中同步更新计数, 或保存种子基线并在序列化时合并运行期新增量; `weeklyCount` 应按统计周期计算.

### B-19 已关注标签被隐藏后其问题仍进入关注动态

- 严重级别: 中
- 位置:
  - `server/app/routers/follows.py:124-142`
  - `server/app/models.py:74-84`
  - 对照实现: `src/mocks/follows.ts:148-169`
- 触发条件:
  1. 学生已关注 `vue3`, 但没有关注问题 109 的作者.
  2. 将 `vue3` 状态改为 `hidden`.
  3. 调用 `GET /api/feed/following`.
- 实际结果: 仅因隐藏标签 `vue3` 匹配的问题 109 仍出现在动态中.
- 预期结果: 隐藏标签不应继续作为公开动态的匹配来源, 应与搜索, 标签目录和 Mock 行为一致.
- 根因: `followed_tag_ids` 只按用户 ID 查询, 没有关联检查 `Tag.status == "active"`; 最终匹配也只检查标签 ID.
- 修复建议: 查询关注标签时连接 `Tag` 并过滤 active, 或在匹配时检查标签状态; 补充"关注后隐藏标签"的回归测试.

### B-20 项目板块关闭后仍可直接提交组队申请

- 严重级别: 低
- 位置:
  - `src/mocks/server.ts:1332-1334`
  - `src/mocks/server.ts:1346-1376`
- 触发条件: 管理员关闭项目板块后, 直接调用 `projectApi.apply()` 申请一个此前公开且招募队友的项目.
- 实际结果: 申请成功并生成通知, 与项目列表, 详情和搜索的板块关闭行为不一致.
- 预期结果: 板块关闭时拒绝公共项目申请.
- 根因: 申请 handler 只检查 `isProjectPublic()`, 没有调用 `requireProjectBoard()`.
- 修复建议: 在申请入口复用板块开放校验, 并增加关闭状态下的接口测试.

### B-21 删除全部问题后新问题 ID 变成 `-Infinity`

- 严重级别: 低
- 位置:
  - `src/mocks/server.ts:784`
  - 删除入口: `src/mocks/server.ts:1844-1853`
- 触发条件: 管理员删除全部问题, 然后普通成员发布新问题.
- 实际结果: `Math.max(...[]) + 1` 得到 `-Infinity`; 该 ID 无法匹配 `/questions/:id(\d+)`, 创建后的跳转进入未找到页面.
- 预期结果: 空集合也应生成合法正整数 ID.
- 根因: 没有为空数组提供初始值.
- 修复建议: 使用 `Math.max(0, ...ids) + 1`, 或使用独立单调 ID 计数器.

### B-22 剪贴板降级路径忽略复制失败

- 严重级别: 低
- 位置:
  - `src/utils/clipboard.ts:1-15`
  - 相同实现: `src/components/markdown/MarkdownRenderer.vue:21-35`
- 触发条件: 在不支持 `navigator.clipboard` 且 `document.execCommand('copy')` 返回 `false` 的浏览器中分享问题或回答.
- 实际结果: Promise 正常 resolve, 页面提示"链接已复制", 但剪贴板未更新.
- 预期结果: 返回失败并提示复制失败.
- 根因: `execCommand()` 的布尔返回值被忽略.
- 修复建议: 检查返回值, 失败时 reject; 用 `finally` 清理临时 textarea.

### B-23 隐藏标签后热门搜索缓存不失效

- 严重级别: 低
- 位置:
  - `src/stores/search-assist.ts:13-43`
  - `src/stores/admin.ts:254-266`
- 触发条件: 先加载热门搜索, 再由管理员隐藏其中一个热门标签, 重新进入搜索落地页.
- 实际结果: 旧的 `trending` 数组仍展示该标签, 直到强制刷新整个页面.
- 预期结果: 标签状态变化后热门搜索应失效或重新加载.
- 根因: 后台只失效社区标签和概览, 没有失效 `search-assist`; 该 store 在页面间持续缓存.
- 修复建议: 标签创建或更新时同时 reset 或强制刷新搜索辅助缓存, 并为 reset 增加 pending 响应保护.

### B-24 通知列表接受无限大的页码

- 严重级别: 低
- 位置:
  - `server/app/routers/notifications.py:55-85`
  - `server/app/services.py:25-29`
- 触发条件: 登录后请求 `GET /api/notifications?page=999999999999999999999999&pageSize=10`.
- 实际结果: Python 可创建该大整数, 但 `(page - 1) * pageSize` 作为 SQLite OFFSET 绑定时超过 64 位整数范围, 产生 `OverflowError`, 请求返回 500.
- 预期结果: 返回空页的 200, 或对超范围页码返回可读的 422.
- 根因: `coerce_int` 只保证"能转换为 Python int", 没有限制数据库可表达的范围.
- 修复建议: 使用带 `ge/le` 的查询参数模型, 或在计算 OFFSET 前限制页码.

### B-25 内存 SQLite 未配置共享连接池

- 严重级别: 低
- 位置:
  - `server/app/database.py:16-19`
  - 启动建表: `server/app/main.py:52-56`
  - 测试覆盖: `server/tests/conftest.py:9-15`
- 触发条件: 使用 `create_app("sqlite:///:memory:")` 启动应用后请求数据库接口.
- 实际结果: 默认 SQLite 内存数据库按线程维护连接; 启动建表和 FastAPI 同步路由可能位于不同线程或连接, 请求看到另一个空数据库, 出现 `no such table` 等 500.
- 预期结果: 受支持的内存数据库 URL 应在整个应用生命周期共享同一数据库.
- 根因: 只设置了 `check_same_thread=False`, 没有为内存数据库配置 `StaticPool`; 现有测试只使用文件数据库.
- 修复建议: 检测 `:memory:` 或空 SQLite 数据库名, 传入 `poolclass=StaticPool`, 并增加启动后实际 API 请求测试.

### B-26 多 worker 启动时种子初始化存在竞态

- 严重级别: 低
- 位置:
  - `server/app/main.py:52-56`
  - `server/app/seed.py:499-501`
  - `server/app/seed.py:664`
- 触发条件: 多个 Uvicorn worker 同时连接同一个全新的 SQLite 文件并启动.
- 实际结果: 多个 worker 都可能先读到用户数为 0, 随后插入相同用户 ID, handle 和 email; 后提交者遇到唯一约束冲突或 SQLite 锁错误, 导致 worker 启动失败.
- 预期结果: 种子初始化应幂等, 多 worker 启动不依赖某个进程恰好先完成.
- 根因: "检查用户数-批量插入-最后提交"没有跨进程锁或原子种子标记.
- 修复建议: 将种子迁移为单独的一次性部署命令; 若必须自动执行, 应使用 `BEGIN IMMEDIATE`, 种子版本标记和冲突恢复.

### B-27 真实后端种子通知链接指向未实现页面

- 严重级别: 低
- 位置:
  - `server/app/seed.py:635-649`
  - 未实现接口说明: `server/README.md:150-169`
- 触发条件: 使用 `VITE_USE_MOCK=false` 启动真实后端, 学生账号打开通知页并点击项目通知.
- 实际结果: 通知链接为 `/projects/campus-flow` 和 `/my/projects`, 但真实后端未实现项目接口, 项目板块返回关闭, 点击后无法完成通知描述的业务闭环.
- 预期结果: 种子通知只链接到当前后端能够提供的页面, 或在未实现项目功能时不生成这类通知.
- 根因: 种子数据沿用了 Mock 数据, 而真实后端只实现了纵向切片.
- 修复建议: 在最小后端模式下调整或禁用这些种子通知; 项目接口上线后再恢复.

## 四, 已知功能缺口 (不计入缺陷数)

这些不是隐藏 bug, 而是项目当前明确的未完成范围, 但会直接影响真实后端模式:

1. 真实后端未实现项目, 专栏, 上传和管理后台接口.
   - 依据: `server/README.md:150-169`
   - 前端仍展示专栏, 我的项目和管理入口, 例如 `src/components/layout/AppHeader.vue:22-23,143-170`.
   - 切换到 `VITE_USE_MOCK=false` 后, 这些页面会请求不存在的接口并得到 404.
2. 真实后端没有问题关注, 项目关注或专栏关注能力, 相关问题详情的"关注"按钮属于假成功.
3. 项目, 专栏和后台目前只完成了 Mock/前端逻辑, 不能把 Mock 测试通过视为真实后端可用.
4. 后端没有 CSRF 令牌, 登录限流, 邮箱验证和密码重置; Cookie 默认非 Secure. 这些已在 `server/README.md:191-194` 中记录, 但上线前必须补齐.
5. SQLite 未启用 `PRAGMA foreign_keys=ON`, `ondelete="CASCADE"` 当前不会被 SQLite 强制执行. 现在没有删除接口所以未暴露, 但接入管理删除后会留下孤儿记录.

## 五, 建议修复顺序

### P0: 账号与请求隔离

1. 为问题详情写操作增加问题 ID 和操作序列校验.
2. 通知与关注 store 引入账号 generation, 退出时作废全部 pending 请求.
3. 项目申请, 日志, 申请审核和关注计数统一采用"发起时捕获目标 ID, 响应后校验目标"的模式.
4. 增加统一 401 处理, 清理过期会话.
5. 给演示管理员账号增加显式环境开关.

### P1: 后端事务与数据一致性

1. 投票, 收藏, 关注和自定义标签改为原子 UPSERT 或捕获唯一约束冲突.
2. 浏览量改为数据库原子递增.
3. 创建问题或回答时同步更新作者和标签聚合计数.
4. 关注动态过滤隐藏标签.
5. 分页参数设置上限, SQLite 配置 busy timeout, 内存数据库配置 `StaticPool`.

### P2: 可见功能与缓存

1. 项目列表增加分页.
2. 修复 Mock 的按账号投票, 收藏状态.
3. 修复通知主列表与未读数请求耦合.
4. 修复剪贴板失败处理, 隐藏标签热词缓存和问题 ID 生成边界.
5. 真实后端模式隐藏尚未实现的功能入口, 避免用户进入 404 页面.

## 六, 建议补充的回归测试

- 账号 A 的 pending 请求在账号 B 登录后返回, 不得写入 B 的通知, 关注, 收藏和投票状态.
- 问题 A→B 路由切换时, A 的投票, 收藏和回答响应不得修改 B.
- 回答"赞同→反对"逆序响应, 最终状态应等于最后一次操作.
- 同一用户并行发送两次投票, 收藏和关注请求, 不得返回 500.
- 两个用户并行创建相同自定义标签的问题, 两个请求都应成功.
- 创建问题或回答后, 作者计数, 标签计数和社区概览同步更新.
- 隐藏问题后, 开发者目录, 开发者主页和搜索均不可见.
- 隐藏已关注标签后, 关注动态不再返回其问题.
- 通知列表成功, 未读数失败时, 通知列表仍正常显示.
- 项目总数超过一页时, 可访问第二页及后续项目.
