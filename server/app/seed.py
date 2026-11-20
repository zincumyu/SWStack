"""Seed data mirroring ``src/mocks/data.ts`` and ``src/mocks/follows.ts``.

Question/answer metadata (IDs, titles, authors, scores, tags, timestamps,
accepted flags, comments and follow relationships) matches the mock. Bodies are
representative excerpts so the Markdown detail page and search have content to
work with without duplicating the full mock prose.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Answer,
    AnswerComment,
    Bookmark,
    Notification,
    Question,
    QuestionComment,
    Tag,
    TagFollow,
    User,
    UserFollow,
    question_tags,
)
from .security import hash_password

DAY = 86_400
HOUR = 3_600
MINUTE = 60

USER_SEEDS = [
    (1, "陆星", "luxing", 12480, "#3f6273", "前端工程 / 计算机学院"),
    (2, "周其", "zhouqi", 9860, "#6b5b4d", "Vue 爱好者 / 软件工程"),
    (3, "陈默", "chenmo", 7420, "#52685b", "后端开发 / 数据科学"),
    (4, "何嘉", "hejia", 6120, "#6d5668", "Go 与分布式系统"),
    (5, "许舟", "xuzhou", 5540, "#4f5f7c", "TypeScript / 前端基础设施"),
    (6, "苏禾", "suhe", 4630, "#7a6241", "全栈开发 / 开源社团"),
    (7, "林一", "linyi", 3980, "#456b67", "系统编程 / Rust"),
    (8, "赵青", "zhaoqing", 3240, "#6a5560", "数据库 / 软件工程"),
    (9, "顾言", "guyan", 2890, "#566274", "React 开发 / 交互设计"),
    (10, "谭悦", "tanyue", 2150, "#60704d", "前端开发 / 数字媒体"),
    (11, "江然", "jiangran", 1780, "#675b76", "DevOps / 计算机学院"),
    (12, "沈砚", "shenyan", 1380, "#6e5948", "Python 后端 / 人工智能"),
]

PROFILE_META = {
    "luxing": (
        "关注前端架构, 可访问性和设计系统. 喜欢把复杂问题拆成可以验证的小步骤.",
        "杭州", "计算机科学与技术", "2023-03-18T08:00:00+00:00", 48, 126, 28400,
        ["vue3", "typescript", "javascript"],
        [{"label": "年度贡献者", "tone": "gold"}, {"label": "Vue 专家", "tone": "silver"}, {"label": "社区编辑", "tone": "bronze"}],
        1860,
    ),
    "zhouqi": (
        "在实验室做前端工具链, 也在维护一个校园组件库. 对组合式 API 和类型推导很感兴趣.",
        "南京", "软件工程", "2023-05-02T08:00:00+00:00", 35, 78, 19300,
        ["vue3", "typescript", "javascript"],
        [{"label": "Vue 专家", "tone": "silver"}, {"label": "活跃提问者", "tone": "neutral"}],
        1420,
    ),
    "chenmo": (
        "后端开发和数据工程. 正在学习如何把异步服务的边界写清楚.",
        "成都", "数据科学与大数据技术", "2023-09-11T08:00:00+00:00", 52, 91, 22100,
        ["fastapi", "python", "sql"],
        [{"label": "Python 专家", "tone": "silver"}, {"label": "提问达人", "tone": "neutral"}],
        1180,
    ),
    "hejia": (
        "Go 服务和分布式存储. 喜欢读 runtime 源码, 也会写一些性能基准.",
        "武汉", "计算机系统结构", "2022-11-06T08:00:00+00:00", 22, 64, 17800,
        ["golang", "docker", "sql"],
        [{"label": "Go 专家", "tone": "gold"}, {"label": "问题解决者", "tone": "bronze"}],
        1080,
    ),
    "xuzhou": (
        "关注类型系统和前端基础设施. 最近在研究 monorepo 下的增量构建.",
        "北京", "计算机科学", "2024-01-23T08:00:00+00:00", 28, 54, 12000,
        ["typescript", "javascript", "git"],
        [{"label": "TypeScript 专家", "tone": "silver"}],
        990,
    ),
    "suhe": (
        "全栈开发, 校园开源社团负责人. 关注开发者工具和部署体验.",
        "广州", "软件工程", "2024-02-14T08:00:00+00:00", 31, 42, 9800,
        ["docker", "javascript", "python"],
        [{"label": "开源贡献者", "tone": "silver"}, {"label": "活跃成员", "tone": "neutral"}],
        870,
    ),
    "linyi": (
        "系统编程与 Rust. 对生命周期, 内存布局和并发模型很好奇.",
        "西安", "计算机系统结构", "2024-03-19T08:00:00+00:00", 21, 37, 8400,
        ["rust", "algorithm", "golang"],
        [{"label": "Rust 爱好者", "tone": "bronze"}],
        640,
    ),
    "zhaoqing": (
        "数据库方向研究生. 喜欢用执行计划解释性能问题.",
        "合肥", "数据科学", "2023-12-08T08:00:00+00:00", 17, 39, 7600,
        ["sql", "python", "algorithm"],
        [{"label": "数据库能手", "tone": "silver"}],
        520,
    ),
    "guyan": (
        "React 开发与交互设计. 正在做一个面向课程项目的可视化编辑器.",
        "上海", "数字媒体技术", "2024-04-07T08:00:00+00:00", 26, 29, 6900,
        ["react", "javascript", "typescript"],
        [{"label": "React 探索者", "tone": "bronze"}],
        460,
    ),
    "tanyue": (
        "前端开发, 对交互动效和响应式布局感兴趣.",
        "厦门", "软件工程", "2024-06-15T08:00:00+00:00", 19, 16, 4300,
        ["vue3", "javascript", "react"],
        [{"label": "新锐成员", "tone": "neutral"}],
        380,
    ),
    "jiangran": (
        "DevOps 和平台工程. 维护社团的 CI 流水线与自托管服务.",
        "深圳", "网络工程", "2023-08-26T08:00:00+00:00", 14, 33, 5800,
        ["git", "docker", "golang"],
        [{"label": "CI 维护者", "tone": "bronze"}],
        410,
    ),
    "shenyan": (
        "Python 后端和机器学习工程. 正在补足异步编程的基础.",
        "重庆", "人工智能", "2025-01-09T08:00:00+00:00", 12, 9, 2800,
        ["python", "fastapi", "algorithm"],
        [{"label": "新加入", "tone": "neutral"}],
        220,
    ),
}

TAG_SEEDS = [
    ("javascript", "javascript", "浏览器与 Node.js 生态中的 JavaScript 语言实践.", 6732, 126, 4820),
    ("typescript", "typescript", "类型系统, 泛型, 工程配置与大型项目实践.", 5180, 98, 3910),
    ("vue3", "vue3", "Vue 3 组合式 API, 响应式系统与工程化经验.", 4260, 84, 3240),
    ("react", "react", "React 组件模型, Hooks 与并发渲染.", 3890, 62, 2870),
    ("python", "python", "Python 语言, 异步编程, 数据处理与后端开发.", 3574, 71, 3010),
    ("fastapi", "fastapi", "基于 Python 类型注解的现代 Web API 框架.", 1680, 46, 1420),
    ("golang", "golang", "Go 并发模型, 服务端工程与性能优化.", 2140, 53, 1980),
    ("rust", "rust", "所有权, 生命周期, 异步运行时与系统编程.", 1420, 38, 1310),
    ("sql", "sql", "查询优化, 索引设计与关系型数据库建模.", 1920, 29, 1750),
    ("docker", "docker", "容器构建, 镜像优化与本地开发环境.", 1560, 31, 1480),
    ("git", "git", "版本控制, 分支协作与历史修复.", 1210, 18, 1260),
    ("algorithm", "algorithm", "算法分析, 数据结构与竞赛编程.", 2380, 44, 2190),
]

QUESTION_SEEDS = [
    {
        "id": 101,
        "title": "Vue 3 中 ref 与 reactive 在组合式函数里应该如何选择",
        "excerpt": "封装筛选器时既有单个关键字, 也有整体替换的分页对象. 想确认 ref/reactive 的边界和消费端解构时的正确做法.",
        "body": """我在封装一个项目筛选器的组合式函数. 状态里既有单个关键字, 也有需要整体替换的分页对象.

```ts
import { reactive, ref } from 'vue'

export function useProjectFilters() {
  const keyword = ref('')
  const paging = reactive({ page: 1, size: 20 })

  function reset() {
    keyword.value = ''
    paging.page = 1
  }

  return { keyword, paging, reset }
}
```

调用方有时想直接解构 `paging`, 有时又把整个对象放进 `watch`. 我担心解构 reactive 之后会丢失响应性.

1. 这里的 ref/reactive 选择是否合理
2. 如果消费端需要解构, 应该用 `toRefs` 还是干脆全部用 ref

项目使用 `<script setup>` 和 TypeScript, 状态只在一个页面内共享. 不是跨路由的全局状态.""",
        "score": 42, "views": 1820, "featured": True,
        "tag_slugs": ["vue3", "typescript"], "author": "zhouqi",
        "created": {"hours": 3, "minutes": 12}, "last": {"minutes": 18},
        "comments": [
            ("luxing", "补充一下, 这类组合式函数最好同时暴露一个只读的 query 快照, 方便序列化到 URL.", {"hours": 2}),
            ("chenmo", "如果筛选状态会跨页面保留, 可以从第一天就把它放进路由 query.", {"hours": 1, "minutes": 30}),
        ],
        "answers": [
            ("luxing", 36, True, {"hours": 2, "minutes": 40},
             "建议按状态的形状选, 而不是按个人偏好选. 单个值用 `ref`, 一组总是同步更新的字段用 `reactive`, 只要需要解构或整体传递, 都优先返回 ref 或 `toRefs` 的结果. 你的 `paging` 只有两个字段且总是成组出现, 用 `reactive` 合适. 但直接把 `paging` 解构给消费端会丢失响应性.",
             [("zhouqi", "第二段用 computed 暴露 page 的方式很清楚. 我之前一直把所有字段 toRefs, 结果类型推导变得很难读.", {"hours": 2})]),
            ("chenmo", 9, False, {"minutes": 55},
             "补一个可维护性角度. 组合式函数对外的返回值要尽量稳定. 只要消费端可以修改内部对象, 未来就很难在 setter 里加校验. 如果筛选条件将来要写回 URL, 可以返回一个 reset 和一个只读快照.",
             []),
        ],
    },
    {
        "id": 102,
        "title": "FastAPI 依赖注入如何优雅地复用数据库会话",
        "excerpt": "每个路由都声明 Depends(get_session) 感觉重复. 想在请求级别共享 AsyncSession, 同时保证异常时能正确回滚.",
        "body": """项目从 Flask 迁移到 FastAPI. 现在每个路由都这样声明:

```python
async def list_projects(
    session: AsyncSession = Depends(get_session),
):
    ...
```

我担心两个问题: 同一请求里多个依赖都声明了 `Depends(get_session)` 时会不会拿到不同会话; 路由抛出异常后能否保证回滚. 希望保留显式依赖注入, 不想在中间件里全局塞一个 session.""",
        "score": 31, "views": 1310, "featured": False,
        "tag_slugs": ["fastapi", "python", "sql"], "author": "chenmo",
        "created": {"hours": 7}, "last": {"hours": 1, "minutes": 10},
        "comments": [
            ("shenyan", "FastAPI 默认依赖缓存是请求级别的, 同一个依赖函数会在一次请求中只执行一次.", {"hours": 5}),
        ],
        "answers": [
            ("hejia", 24, True, {"hours": 5},
             "依赖缓存确实能解决你的第一个问题. 在同一个请求作用域内, 相同依赖默认只执行一次. 关键是把 session 的创建和回滚写在一个生成器依赖里, 路由继续使用 `Depends(get_session)` 即可. `async with` 退出时会 close session, 但不会自动 commit, 不要把 close 当成 commit.",
             [("chenmo", "确认了依赖是请求级缓存. rollback 放在 yield 外面之后, 异常路径的行为清楚很多.", {"hours": 4, "minutes": 30})]),
            ("xuzhou", 6, False, {"hours": 1, "minutes": 10},
             "如果只是测试时想替换 session, 可以把 get_session 定义成可覆盖的依赖, 在测试里使用 `app.dependency_overrides`. 生产环境不建议通过中间件把 session 暴露成全局变量.",
             []),
        ],
    },
    {
        "id": 103,
        "title": "TypeScript 泛型约束在 API 响应包装类型里怎么写",
        "excerpt": "想写一个通用的 ApiResponse<T>, 但后端有的接口返回数组, 有的返回深层的 items. 如何让类型提示不丢字段.",
        "body": """后端响应格式大致如下:

```ts
type ApiResponse<T> = {
  data: T
  message: string
}

type PageData<T> = {
  items: T[]
  total: number
}
```

我写了 `type ProjectPage = ApiResponse<PageData<Project>>`, 调用处可以推导出 `response.data.items[0].name`. 但当泛型需要满足某些字段约束时, 开始出现类型报错. 想实现一个函数来解析响应并做运行时校验, 又不想把所有接口定义重写一遍.""",
        "score": 27, "views": 948, "featured": False,
        "tag_slugs": ["typescript", "javascript"], "author": "xuzhou",
        "created": {"hours": 11}, "last": {"hours": 2},
        "comments": [],
        "answers": [
            ("jiangran", 18, True, {"hours": 8},
             "把包装类型和数据约束分开, 不要让一个泛型同时承担传输结构和校验逻辑. 解析函数使用 `unknown` 入口, 在边界处完成断言, 内部再把具体类型交给调用方. 核心原则是让泛型保持结构化, 把校验收口到 API 边界.",
             []),
        ],
    },
    {
        "id": 104,
        "title": "Go 的 errgroup 如何正确传递 context 取消信号",
        "excerpt": "三个下游请求并行执行, 其中任意一个失败后其他请求还在继续. 想确认 errgroup.WithContext 的取消时机.",
        "body": """三个下游请求并行执行:

```go
func fetchAll(ctx context.Context) error {
    group, ctx := errgroup.WithContext(ctx)

    for _, source := range sources {
        group.Go(func() error {
            return source.Fetch(ctx)
        })
    }

    return group.Wait()
}
```

其中一个 `Fetch` 返回错误后, 其他任务仍继续跑了几秒. 想让整个请求有统一的超时, 同时也希望第一个错误能尽快取消其他任务.""",
        "score": 35, "views": 1550, "featured": False,
        "tag_slugs": ["golang"], "author": "hejia",
        "created": {"days": 1, "hours": 2}, "last": {"hours": 3},
        "comments": [],
        "answers": [
            ("luxing", 29, True, {"hours": 20},
             "`errgroup.WithContext` 只有在 `Wait` 观察到第一个错误之后才会取消它生成的 context. 取消不是由 `Fetch` 的返回值瞬间触发的. 确保每个下游调用都消费了传入的 ctx, 不要在内层创建一个脱离父链的 context, 否则会切断取消链.",
             []),
            ("linyi", 4, False, {"hours": 3},
             "还有一个容易忽略的点: 如果错误被内部 recover 掉, errgroup 看不到错误, 也就不会取消. 优先保持错误向上返回.",
             []),
        ],
    },
    {
        "id": 105,
        "title": "Docker 多阶段构建中如何减小 Node 前端镜像体积",
        "excerpt": "构建镜像接近 800MB, 最终只需要静态文件. 想保留可复现构建, 同时不把 node_modules 和源码带进运行镜像.",
        "body": """当前 Dockerfile 使用 node:22 单阶段构建, 镜像里包含了完整的 Node 工具链和 devDependencies. 项目最终只产出 `dist` 静态文件. 想使用 nginx 托管, 同时控制构建缓存. 应该怎么拆分阶段和 `.dockerignore`?""",
        "score": 19, "views": 780, "featured": False,
        "tag_slugs": ["docker", "javascript"], "author": "suhe",
        "created": {"days": 1, "hours": 6}, "last": {"hours": 5},
        "comments": [],
        "answers": [
            ("hejia", 16, True, {"hours": 22},
             "分成构建阶段和运行阶段即可. 构建阶段用 `node:22-alpine` 执行 `npm ci` 和 `npm run build`, 运行阶段用 `nginx:1.27-alpine` 只复制 `/app/dist`. 复制依赖清单要在复制源码之前, 这样修改业务代码不会让依赖安装缓存失效.",
             []),
        ],
    },
    {
        "id": 106,
        "title": "Rust 所有权规则下如何返回一个借用字符串",
        "excerpt": "想从结构体方法里返回 name 字段的 &str, 编译器提示生命周期不匹配. 不确定应该加生命周期还是返回 String.",
        "body": """有一个配置结构体:

```rust
struct Config {
    name: String,
    path: String,
}

impl Config {
    fn name(&self) -> &str {
        &self.name
    }
}
```

把它包进另一个结构体并尝试返回借用时会失败:

```rust
struct Service<'a> {
    name: &'a str,
}

impl Service<'_> {
    fn new(config: &Config) -> Self {
        Self { name: &config.name }
    }
}
```

为什么不能像预期那样持有配置字段的借用? 这里应该显式写生命周期吗?""",
        "score": 23, "views": 1100, "featured": False,
        "tag_slugs": ["rust"], "author": "linyi",
        "created": {"days": 2, "hours": 3}, "last": {"hours": 6},
        "comments": [],
        "answers": [
            ("zhaoqing", 21, True, {"days": 1, "hours": 12},
             "`Service` 的字段是借用, 所以 `new` 的返回值必须把输入参数的生命周期带到返回值上. 写成 `impl Service<'_>` 时, 匿名生命周期不能表达这种关系. 但真正要考虑的是对象关系: 如果 `Service` 的生命周期会比 `Config` 长, 应该拥有字段.",
             [("linyi", "关键确实是谁拥有数据. 我改成持有 Arc<Config> 后, 生命周期问题自然消失了.", {"days": 1, "hours": 8})]),
            ("guyan", 7, False, {"hours": 6},
             "如果 Service 会被多个任务共享, 可以持有 `Arc<Config>`, 从它派生借用时要注意不要创建 self-referential struct.",
             []),
        ],
    },
    {
        "id": 107,
        "title": "SQL 索引在联合查询中没有命中是什么原因",
        "excerpt": "orders 和 users 联表查询只走主键索引, 明明建了 user_id 索引. 想搞清楚执行计划和隐式转换的影响.",
        "body": """查询如下:

```sql
select o.id, o.amount, u.nickname
from orders o
join users u on u.id = o.user_id
where o.user_id = '1024'
  and o.status = 'paid'
order by o.created_at desc
limit 20;
```

`orders.user_id` 是 bigint, 也建了普通索引. 但执行计划没有走这个索引. 数据库是 MySQL 8, 数据量约 300 万行, `status` 的区分度很低. 想了解优化器为什么这样选择.""",
        "score": 14, "views": 615, "featured": False,
        "tag_slugs": ["sql"], "author": "zhaoqing",
        "created": {"days": 2, "hours": 8}, "last": {"days": 1},
        "comments": [],
        "answers": [],
    },
    {
        "id": 108,
        "title": "React 18 并发渲染下 useEffect 重复执行如何排查",
        "excerpt": "StrictMode 开发环境里请求发了两次, 去掉 StrictMode 就正常. 这是框架 bug 还是应该修改副作用结构.",
        "body": """组件挂载时会请求一次项目列表, effect 返回了 AbortController 清理函数. 开发环境使用 `StrictMode` 时, Network 面板能看到两次请求, 生产构建看起来正常.

这是不是 React 18 的问题? 在保留 StrictMode 的前提下, 如何避免重复请求和重复副作用?""",
        "score": 29, "views": 1670, "featured": False,
        "tag_slugs": ["react", "javascript"], "author": "guyan",
        "created": {"days": 3}, "last": {"hours": 4},
        "comments": [],
        "answers": [
            ("luxing", 25, False, {"days": 2, "hours": 10},
             "这不是 bug. StrictMode 在开发环境会刻意重复执行 mount / unmount / mount, 用来暴露没有正确清理的副作用. 你的 effect 已经返回了 abort 清理函数, 所以第一次请求会被取消. 如果仍然看到两次响应, 检查 fetch 封装是否真的把 signal 传到了底层. 不要在开发环境关闭 StrictMode 来掩盖问题.",
             []),
            ("zhouqi", 6, False, {"hours": 4},
             "如果需要跨组件复用请求状态, 可以把请求封装成带缓存的 hook. 但缓存键里要包含筛选参数, 否则切换页面时会读到上一次的数据.",
             []),
        ],
    },
    {
        "id": 109,
        "title": "Composition API 中 watch 和 watchEffect 的清理时机",
        "excerpt": "在副作用里注册了监听器, 组件卸载后仍然收到回调. 想确认 onCleanup 和 onUnmounted 的执行顺序.",
        "body": """我有一段监听窗口尺寸的逻辑, 在 watch 回调里注册 `window.addEventListener`. 切换 `active` 之后旧监听器仍然会触发. 想改成可清理的结构, 但不清楚 `onCleanup` 是否足够, 它和 `onUnmounted` 谁先执行?""",
        "score": 18, "views": 530, "featured": False,
        "tag_slugs": ["vue3"], "author": "tanyue",
        "created": {"days": 3, "hours": 5}, "last": {"hours": 8},
        "comments": [],
        "answers": [
            ("zhouqi", 14, True, {"days": 2},
             "`watch` 的回调可以接收 `onCleanup`, 每次重新执行前会先调用上一次的清理函数. 这正好适合注册和移除监听器. 当 active 变化或 watch 所在的 effect scope 销毁时, cleanup 会执行. 它比只依赖 `onUnmounted` 更精确.",
             []),
        ],
    },
    {
        "id": 110,
        "title": "Git rebase 之后如何安全地恢复已经被覆盖的提交",
        "excerpt": "交互式 rebase 时误删了两个提交并强制推送. 想在团队仓库里找回原始提交, 同时避免再次破坏历史.",
        "body": """我在功能分支上执行了 `git rebase -i main`, 误操作删除了其中两个提交, 随后执行了 `git push --force-with-lease`. 现在分支看起来丢失了部分实现. 我记得 rebase 之前的提交哈希没有记录.

有没有办法从 reflog 或远端找回? 强制推送后 origin 上的旧引用还在吗?""",
        "score": 38, "views": 2450, "featured": True,
        "tag_slugs": ["git"], "author": "jiangran",
        "created": {"days": 4}, "last": {"minutes": 42},
        "comments": [
            ("suhe", "先别继续 rebase 或 gc. reflog 一般还在, 尽快把目标提交固定到一个新分支上.", {"minutes": 42}),
        ],
        "answers": [
            ("xuzhou", 33, True, {"days": 3, "hours": 20},
             "先停止对仓库做任何清理操作. 大多数情况下提交还在本地 reflog 里. 用 `git reflog --date=iso` 找到 rebase 之前的记录, 用 `git branch recovery/pre-rebase HEAD@{n}` 固定它. 不要把恢复分支直接 force push 到原分支, 先对比 log 和 diff.",
             [("jiangran", "reflog 里找到了. 建了 recovery 分支后对比, 两个提交都完整. 谢谢.", {"days": 3, "hours": 2})]),
            ("hejia", 11, False, {"minutes": 42},
             "补充一个团队层面的做法: 强制推送前先让 CI 跑一次完整构建, 并把 old HEAD 哈希写进分支描述或发布记录.",
             []),
        ],
    },
    {
        "id": 111,
        "title": "Python 异步任务中共享 aiohttp session 的最佳实践",
        "excerpt": "为每个请求创建 ClientSession 很慢, 但全局单例在事件循环关闭时又报错. 想了解应用生命周期内的正确作用域.",
        "body": """服务使用 FastAPI 和 aiohttp 调用第三方 API. 现在每个函数里都会 `async with aiohttp.ClientSession()` 创建会话. 高并发下创建连接的开销很明显. 尝试改成模块级单例后, 测试环境出现 `Event loop is closed`.

想问在生产应用里应该怎样管理 session 生命周期. 是放在 `lifespan` 里, 还是每个请求一个?""",
        "score": 21, "views": 870, "featured": False,
        "tag_slugs": ["python", "fastapi"], "author": "shenyan",
        "created": {"days": 4, "hours": 2}, "last": {"days": 1, "hours": 4},
        "comments": [],
        "answers": [
            ("chenmo", 17, True, {"days": 3, "hours": 6},
             "把 session 绑定到应用生命周期, 不要绑定到模块导入时的事件循环. 在 `lifespan` 里创建 `aiohttp.ClientSession`, 路由通过依赖注入获取. 这样连接池复用了, 关闭时机也可控. 不要使用模块级 ClientSession.",
             []),
        ],
    },
    {
        "id": 112,
        "title": "这个二分查找边界条件为什么在数组长度为 1 时失败",
        "excerpt": "标准库的 bisect 能看到结果, 但手写版本在单元素数组上返回 -1. 想确保所有边界都正确.",
        "body": """我的实现:

```python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1

    while left < right:
        middle = (left + right) // 2
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle

    return left if nums[left] == target else -1
```

大部分测试都通过了. 但 `nums=[5]` 且 `target=5` 时会越界或者返回错误. 我尝试把循环条件改成 `left <= right`, 又有其他测试失败. 希望保留左闭右闭的思路.""",
        "score": 12, "views": 420, "featured": False,
        "tag_slugs": ["algorithm", "python"], "author": "luxing",
        "created": {"days": 5, "hours": 4}, "last": {"days": 2, "hours": 3},
        "comments": [],
        "answers": [
            ("linyi", 10, True, {"days": 4},
             "你的问题是混用了两种区间定义. `right = len(nums) - 1` 表示右端是闭区间, 循环条件应该是 `left <= right`, 收缩时用 `right = middle - 1`. 先写清楚不变式, 再写循环, 不要同时改变循环条件和收缩方向.",
             []),
            ("suhe", 3, False, {"days": 2, "hours": 3},
             "补充一个测试策略: 每个边界版本都覆盖空数组, 单元素, 目标在首尾, 目标不存在这四种情况.",
             []),
        ],
    },
]

SEED_FOLLOWS = {
    "users": ["zhouqi", "hejia", "luxing"],
    "tags": ["vue3", "typescript", "fastapi"],
}


def _ago(now: datetime, offset: dict[str, int]) -> datetime:
    return now - timedelta(
        days=offset.get("days", 0),
        hours=offset.get("hours", 0),
        minutes=offset.get("minutes", 0),
    )


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count(User.id))) > 0:
        return

    now = datetime.now(timezone.utc)
    account_emails = {
        "luxing": ("admin@swstack.dev", "admin123"),
        "suhe": ("student@swstack.dev", "student123"),
    }
    column_writers = {"chenmo", "linyi", "zhaoqing", "jiangran", "shenyan"}

    users: dict[str, User] = {}
    for user_id, name, handle, reputation, color, title in USER_SEEDS:
        bio, location, school, joined_at, q_count, a_count, views, top_tags, badges, follower_base = PROFILE_META[handle]
        email, password = account_emails.get(handle, (f"{handle}@campus.swstack.dev", ""))
        user = User(
            id=user_id,
            name=name,
            handle=handle,
            email=email,
            password_hash=hash_password(password) if password else None,
            reputation=reputation,
            avatar_color=color,
            title=title,
            role="admin" if user_id == 1 else "member",
            status="active",
            can_write_columns=handle in column_writers,
            bio=bio,
            location=location,
            school=school,
            joined_at=datetime.fromisoformat(joined_at),
            profile_question_count=q_count,
            profile_answer_count=a_count,
            view_count=views,
            base_follower_count=follower_base,
            top_tags_json=json.dumps(top_tags, ensure_ascii=False),
            badges_json=json.dumps(badges, ensure_ascii=False),
        )
        db.add(user)
        users[handle] = user

    tags: dict[str, Tag] = {}
    for slug, name, description, q_count, weekly, follower_base in TAG_SEEDS:
        tag = Tag(
            slug=slug,
            name=name,
            description=description,
            base_question_count=q_count,
            weekly_count=weekly,
            base_follower_count=follower_base,
            status="active",
        )
        db.add(tag)
        tags[slug] = tag

    db.flush()

    for question_seed in QUESTION_SEEDS:
        author = users[question_seed["author"]]
        created_at = _ago(now, question_seed["created"])
        question = Question(
            id=question_seed["id"],
            title=question_seed["title"],
            excerpt=question_seed["excerpt"],
            body=question_seed["body"],
            base_score=question_seed["score"],
            view_count=question_seed["views"],
            is_featured=question_seed["featured"],
            status="published",
            author_id=author.id,
            created_at=created_at,
            last_activity_at=_ago(now, question_seed["last"]),
        )
        db.add(question)
        db.flush()

        for position, tag_slug in enumerate(question_seed["tag_slugs"]):
            db.execute(
                question_tags.insert().values(
                    question_id=question.id,
                    tag_id=tags[tag_slug].id,
                    position=position,
                )
            )

        for author_handle, body, offset in question_seed["comments"]:
            db.add(
                QuestionComment(
                    question_id=question.id,
                    author_id=users[author_handle].id,
                    body=body,
                    created_at=_ago(now, offset),
                )
            )

        for answer_handle, score, accepted, offset, body, answer_comments in question_seed["answers"]:
            answer = Answer(
                question_id=question.id,
                body=body,
                base_score=score,
                accepted=accepted,
                author_id=users[answer_handle].id,
                created_at=_ago(now, offset),
            )
            db.add(answer)
            db.flush()
            for comment_handle, comment_body, comment_offset in answer_comments:
                db.add(
                    AnswerComment(
                        answer_id=answer.id,
                        author_id=users[comment_handle].id,
                        body=comment_body,
                        created_at=_ago(now, comment_offset),
                    )
                )

    # The mock stores analytics' bookmarked flag on the seeded question itself.
    db.add(Bookmark(user_id=users["luxing"].id, question_id=102))

    student = users["suhe"]
    for handle in SEED_FOLLOWS["users"]:
        db.add(UserFollow(follower_id=student.id, followed_id=users[handle].id))
    for slug in SEED_FOLLOWS["tags"]:
        db.add(TagFollow(user_id=student.id, tag_id=tags[slug].id))

    # Mirrors the three seeded notifications for the demo student in
    # src/mocks/notifications.ts.
    for type, title, body, link, read, offset in (
        (
            "question_answered",
            "你的问题收到新回答",
            "何嘉 回答了你的问题: Docker 多阶段构建中如何减小 Node 前端镜像体积.",
            "/questions/105",
            False,
            {"hours": 3},
        ),
        (
            "project_approved",
            "项目已通过审核",
            "你的项目 CampusFlow 已通过审核并上线.",
            "/projects/campus-flow",
            False,
            {"days": 2},
        ),
        (
            "project_rejected",
            "项目未通过审核",
            "你的项目 CampusFlow 未通过审核. 审核备注: 封面截图不清晰, 请补充运行截图后重新提交.",
            "/my/projects",
            True,
            {"days": 14},
        ),
    ):
        db.add(
            Notification(
                user_id=student.id,
                type=type,
                title=title,
                body=body,
                link=link,
                read=read,
                created_at=_ago(now, offset),
            )
        )

    db.commit()
