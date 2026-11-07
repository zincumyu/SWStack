import type {
  AdminColumn,
  AdminColumnDetail,
  AdminColumnQuery,
  ColumnDetail,
  ColumnInput,
  ColumnLevel,
  ColumnLevelFilter,
  ColumnQuery,
  ColumnResource,
  ColumnStatus,
  ColumnSummary,
  MyColumnQuery,
  PageResult,
  QuestionTag,
} from '@/api/types'
import { tags, users } from './data'

interface ColumnSeed {
  id: number
  slug: string
  title: string
  summary: string
  level: ColumnLevel
  tagSlugs: string[]
  body: string
  resources: ColumnResource[]
  authorHandle: string
  featured: boolean
  status: ColumnStatus
  moderationLocked?: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function tagRef(slug: string): QuestionTag {
  const tag = tags.find((item) => item.slug === slug)
  return { slug, name: tag?.name ?? slug }
}

function userByHandle(handle: string) {
  return users.find((user) => user.handle === handle) ?? users[0]
}

const columnSeeds: ColumnSeed[] = [
  {
    id: 1,
    slug: 'vue3-engineering-path',
    title: 'Vue 3 工程化入门路径: 从组件到可交付项目',
    summary:
      '按阶段梳理 Vue 3 与 TypeScript 的学习顺序, 配套练习和可以放进作品集的项目清单.',
    level: 'beginner',
    tagSlugs: ['vue3', 'typescript', 'git'],
    authorHandle: 'luxing',
    featured: true,
    status: 'published',
    createdAt: daysAgo(42),
    publishedAt: daysAgo(30),
    updatedAt: daysAgo(6),
    resources: [
      {
        title: 'Vue 3 官方文档',
        url: 'https://cn.vuejs.org/guide/',
        description: '组合式 API, 组件通信和路由的权威入口.',
      },
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
        description: '类型收窄, 泛型和声明文件的系统教程.',
      },
      {
        title: 'Vite 指南',
        url: 'https://vite.dev/guide/',
        description: '理解开发服务器, 构建产物和环境变量.',
      },
    ],
    body: `# Vue 3 工程化入门路径

这份路径面向已经会 HTML, CSS 和基础 JavaScript 的同学. 目标不是背 API, 而是做出一个可以部署, 可以协作, 可以持续维护的前端项目.

## 阶段一: 组件与响应式

先掌握单文件组件, props, emits 和组合式 API. 写组件时优先想清楚输入和输出, 不要在子组件里直接修改父组件状态.

建议练习:

- 做一个可搜索的课程列表, 支持加载, 空状态和错误状态.
- 把筛选逻辑抽成 composable, 观察它可以如何被复用.
- 给每个组件写清楚 props 类型和事件类型.

~~~ts
interface Course {
  id: number
  name: string
  teacher: string
}

const props = defineProps<{
  courses: Course[]
  keyword: string
}>()

const filtered = computed(() =>
  props.courses.filter((course) =>
    course.name.toLowerCase().includes(props.keyword.toLowerCase()),
  ),
)
~~~

## 阶段二: 状态与数据边界

当页面开始出现跨组件共享的数据时, 再引入 Pinia. 不要把整个页面都塞进一个 store, 先区分服务端数据, 页面状态和用户偏好.

一个实用的判断顺序:

1. 只在一个组件里使用的状态, 留在组件内.
2. 多个兄弟组件共享的状态, 提到最近的共同父级.
3. 跨路由共享且需要缓存的状态, 再放进 store.

数据请求统一放在 API 层. 组件只负责调用和展示, 这样后续从 Mock 切到真实后端时, 修改范围可控.

## 阶段三: 工程化与交付

工程化不是堆工具, 而是让错误更早暴露. 从下面几件事开始:

- 开启 TypeScript strict, 先处理类型错误, 再谈重构.
- 配置 ESLint 和格式化工具, 统一团队风格.
- 为关键工具函数和 store 行为写测试.
- 用 CI 跑类型检查和构建, 避免把坏版本合并到主干.
- 部署一次真实站点, 记录构建, 环境变量和回滚步骤.

## 推荐项目

做一个校园活动报名页, 包含活动列表, 详情, 报名表单和个人报名记录. 这个题目覆盖路由, 表单校验, 权限和状态同步, 比单纯临摹页面更能体现工程能力.

## 检查清单

- [ ] 能解释 ref 和 reactive 的使用边界.
- [ ] 能拆分展示组件和容器组件.
- [ ] 能处理加载, 空数据, 错误和权限不足.
- [ ] 能在移动端完成主要流程.
- [ ] 能写出让队友在十分钟内启动项目的 README.

## 常见误区

不要一开始就引入微前端和复杂的状态分层. 先把一个业务闭环做完整, 再根据真实痛点扩展. 也不要只看视频, 每个阶段至少留下一个可以运行的练习.`,
  },
  {
    id: 2,
    slug: 'fastapi-api-design',
    title: '用 FastAPI 设计一个可演进的校园 API',
    summary:
      '从路由分层, 数据校验到数据库查询, 用一个小型课程项目走通后端接口设计.',
    level: 'intermediate',
    tagSlugs: ['python', 'fastapi', 'sql'],
    authorHandle: 'chenmo',
    featured: true,
    status: 'published',
    createdAt: daysAgo(36),
    publishedAt: daysAgo(25),
    updatedAt: daysAgo(3),
    resources: [
      {
        title: 'FastAPI Tutorial',
        url: 'https://fastapi.tiangolo.com/tutorial/',
        description: '请求校验, 依赖注入和响应模型的官方教程.',
      },
      {
        title: 'SQLBolt',
        url: 'https://sqlbolt.com/',
        description: '用交互练习补上 JOIN 和聚合查询.',
      },
      {
        title: 'PostgreSQL EXPLAIN',
        url: 'https://www.postgresql.org/docs/current/using-explain.html',
        description: '读懂执行计划, 判断慢查询瓶颈.',
      },
    ],
    body: `# 用 FastAPI 设计一个可演进的校园 API

很多课程项目一开始把所有路由写在 main.py 里, 演示时没问题, 加第二个业务后就开始互相牵连. 下面用活动报名系统说明一个够用但不臃肿的分层方式.

## 先定义接口边界

先写清楚资源, 动作和权限, 再写数据库模型. 例如:

- GET /activities: 公开活动列表, 支持分页和关键词.
- GET /activities/{id}: 活动详情, 未发布活动仅管理员可见.
- POST /activities/{id}/registrations: 当前用户报名.
- DELETE /registrations/{id}: 只能取消自己的报名.

接口边界稳定后, 前端可以先用 Mock 开发, 后端按契约实现.

## 用 schema 隔离输入和输出

不要把 ORM 模型直接作为请求体. 请求模型负责校验, 响应模型负责脱敏和稳定字段.

~~~python
from datetime import datetime
from pydantic import BaseModel, Field

class RegistrationCreate(BaseModel):
    note: str = Field(default='', max_length=200)

class RegistrationRead(BaseModel):
    id: int
    activity_id: int
    user_name: str
    note: str
    created_at: datetime
~~~

响应模型不要包含密码哈希, 内部状态字段和管理员备注. 这会强迫你在写接口时思考哪些信息应该公开.

## 路由与依赖注入

把路由拆成 activities, registrations, admin 三个模块. 数据库会话, 当前用户和管理员校验都通过依赖注入完成.

~~~python
def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    user = repository.get_user(payload.sub)
    if not user:
        raise HTTPException(status_code=401)
    return user

@router.post('/{activity_id}/registrations', response_model=RegistrationRead)
def register(
    activity_id: int,
    body: RegistrationCreate,
    user: User = Depends(get_current_user),
):
    return service.register(activity_id, user, body)
~~~

业务规则放在 service 层, 例如重复报名, 名额上限和活动状态. 路由只负责解析请求和返回结果.

## 查询与索引

先写出前端真正需要的查询, 再用 EXPLAIN 验证索引是否生效. 常见问题:

- 列表页按状态过滤再按时间排序, 需要联合索引.
- 模糊搜索使用 LIKE 前缀匹配时可以走索引, 两侧通配符通常不行.
- 统计报名人数时避免在循环里逐条查询, 用聚合或预加载.

不要因为表小就完全忽略索引, 也不要靠猜. 打开慢查询日志和执行计划, 看实际扫描行数.

## 测试和文档

至少覆盖登录, 权限, 参数校验和核心业务分支. FastAPI 自动生成的 OpenAPI 文档很有用, 但需要为每个接口补充 summary 和示例, 否则前端仍然需要反复询问字段含义.

## 上线前检查

- 错误响应结构统一, 前端可以稳定展示.
- 分页参数有上限, 防止一次拉取过多数据.
- 写操作有权限校验和幂等考虑.
- 数据库迁移可以回滚.
- 日志中不输出 token 和密码.`,
  },
  {
    id: 3,
    slug: 'git-team-workflow',
    title: 'Git 协作路线: 从个人提交到团队合并',
    summary:
      '整理分支, 提交, 评审和回滚的常用动作, 适合第一次参与多人项目的同学.',
    level: 'beginner',
    tagSlugs: ['git'],
    authorHandle: 'luxing',
    featured: false,
    status: 'published',
    createdAt: daysAgo(31),
    publishedAt: daysAgo(18),
    updatedAt: daysAgo(11),
    resources: [
      {
        title: 'Pro Git',
        url: 'https://git-scm.com/book/zh/v2',
        description: '从基础到分支模型的完整中文教程.',
      },
      {
        title: 'Conventional Commits',
        url: 'https://www.conventionalcommits.org/zh-hans/',
        description: '让提交历史可以被阅读和自动生成变更日志.',
      },
      {
        title: 'GitHub Flow',
        url: 'https://docs.github.com/en/get-started/using-github/github-flow',
        description: '适合小团队的分支和评审流程.',
      },
    ],
    body: `# Git 协作路线: 从个人提交到团队合并

会 add 和 commit 不等于会协作. 团队项目里真正重要的是让每一步都可以解释, 可以回滚, 可以让队友接手.

## 先建立分支习惯

一个简单可执行的约定:

- main 始终可以运行和部署.
- 每个任务从最新 main 拉出功能分支.
- 分支名包含类型和短描述, 例如 feat/activity-signup.
- 合并前同步 main, 在本地解决冲突.

切忌多人长期共用一个 huge 分支. 合并时间越晚, 冲突越难理解.

## 提交应该讲清楚一件事

一个好的提交通常只解决一个可描述的问题. 标题写结果, 正文写原因和验证方式.

~~~text
fix: prevent duplicate activity registration

Check the existing registration before inserting a new row.
Verified with the duplicate signup case in the API test suite.
~~~

如果一次改动了路由, 样式和数据库迁移, 拆成多个提交通常更好. 但也不要为了拆而拆, 每个提交至少要能独立解释.

## 合并前自检

- 拉取最新 main, 本地完成一次 rebase 或 merge.
- 跑类型检查, 测试和构建.
- 检查是否误提交调试日志, 密钥和本地配置.
- 在 PR 描述中写清楚改动范围, 截图和复现步骤.
- 对接口变更附上请求和响应示例.

## 代码评审看什么

评审不是找语法错误. 优先关注:

1. 行为是否符合需求, 边界是否处理.
2. 数据模型和接口契约是否稳定.
3. 权限校验是否遗漏.
4. 错误和加载状态是否可见.
5. 命名和结构是否让下一个人能读懂.

## 回滚与修复

如果问题已经合并, 优先用新的修复提交解决. 只有在历史混乱且影响所有人时, 才考虑重写历史. 对共享分支执行 reset 和 force push 前必须和团队确认.

## 小团队的最小流程

- 任务进入 issue 或看板.
- 从 main 建分支开发.
- 推送分支并开 PR.
- 至少一位队友评审.
- CI 通过后合并.
- 删除功能分支.

流程不必复杂, 但每一步都要有明确负责人. 先把最小流程跑顺, 再讨论更高级的分支模型.`,
  },
  {
    id: 4,
    slug: 'sql-index-learning-path',
    title: 'SQL 索引学习路线: 学会读懂执行计划',
    summary:
      '用真实查询理解索引选择, 回表, 联合索引和 EXPLAIN, 不再靠试错加索引.',
    level: 'intermediate',
    tagSlugs: ['sql'],
    authorHandle: 'zhaoqing',
    featured: false,
    status: 'published',
    createdAt: daysAgo(27),
    publishedAt: daysAgo(12),
    updatedAt: daysAgo(8),
    resources: [
      {
        title: 'SQLBolt',
        url: 'https://sqlbolt.com/',
        description: '适合补齐 JOIN, 聚合和子查询基础.',
      },
      {
        title: 'Use The Index, Luke',
        url: 'https://use-the-index-luke.com/',
        description: '从查询模式理解索引设计, 不绑定具体数据库.',
      },
      {
        title: 'PostgreSQL EXPLAIN',
        url: 'https://www.postgresql.org/docs/current/using-explain.html',
        description: '执行计划字段和扫描方式的官方说明.',
      },
    ],
    body: `# SQL 索引学习路线: 学会读懂执行计划

加索引不难, 难的是判断为什么加, 加了是否生效, 以及会不会拖慢写入. 学习索引最好的方式不是背结论, 而是围绕真实查询做实验.

## 第一步: 写清楚查询模式

面试和课程项目里常见的问题是表很大但索引没有命中. 先拆解查询:

~~~sql
select id, title, created_at
from questions
where status = 'published'
  and tag_slug = 'vue3'
order by created_at desc
limit 20;
~~~

这段查询同时涉及等值过滤和排序. 单独给 status 建索引可能仍然需要大量排序. 可以考虑 (status, tag_slug, created_at) 这样的联合索引, 让过滤和排序走同一个结构.

## 第二步: 看执行计划

在 PostgreSQL 中使用 EXPLAIN ANALYZE, 不要只看预估成本, 还要看实际行数和耗时.

~~~sql
explain analyze
select id, title
from questions
where status = 'published' and tag_slug = 'vue3'
order by created_at desc
limit 20;
~~~

重点观察:

- 使用了 Seq Scan 还是 Index Scan.
- 预估行数和实际行数差距是否很大.
- 是否出现额外 Sort.
- 回表次数是否过多.

## 第三步: 理解联合索引顺序

联合索引遵循最左前缀. 如果索引是 (status, tag_slug, created_at), 那么只按 tag_slug 查询通常无法高效使用它. 设计前先列出高频查询, 再决定列顺序.

一个实用原则是: 等值条件在前, 范围或排序字段在后. 但这不是绝对规则, 仍需用执行计划验证.

## 第四步: 控制回表

如果查询只需要索引里已有的列, 数据库可能使用覆盖索引, 避免回表. 但不要把大量字段都塞进索引, 索引本身也有存储和写入成本.

## 第五步: 用数据验证

准备一份接近真实规模的数据, 对比加索引前后的执行计划. 同时观察写入性能. 对写多读少的表, 每个索引都要有明确理由.

## 练习清单

- 为三个高频查询分别设计联合索引.
- 用 EXPLAIN ANALYZE 解释一次全表扫描.
- 制造一个隐式类型转换导致索引失效的例子.
- 比较单独索引和联合索引在排序场景下的差异.
- 记录一次错误索引决策和修复过程.

## 常见误区

索引不是越多越好. 低选择性的字段单独建索引往往收益有限. 对小表做索引实验很容易得出错误结论, 因为优化器可能直接选择全表扫描. 更重要的是把查询, 数据量和执行计划放在一起看.`,
  },
  {
    id: 5,
    slug: 'rust-ownership-map',
    title: 'Rust 所有权进阶地图: 从借用检查到异步',
    summary:
      '按概念依赖顺序整理所有权, 生命周期, Trait 和异步运行时, 附可执行的练习.',
    level: 'advanced',
    tagSlugs: ['rust', 'algorithm'],
    authorHandle: 'linyi',
    featured: false,
    status: 'published',
    createdAt: daysAgo(24),
    publishedAt: daysAgo(9),
    updatedAt: daysAgo(5),
    resources: [
      {
        title: 'The Rust Book',
        url: 'https://doc.rust-lang.org/book/',
        description: '所有权, 生命周期和并发的基础路线.',
      },
      {
        title: 'Rustlings',
        url: 'https://github.com/rust-lang/rustlings',
        description: '用小练习巩固编译错误和修复方式.',
      },
      {
        title: 'Async Rust Book',
        url: 'https://rust-lang.github.io/async-book/',
        description: '理解 Future, executor 和异步生态.',
      },
    ],
    body: `# Rust 所有权进阶地图: 从借用检查到异步

Rust 的学习难点通常不是语法, 而是概念之间的依赖关系. 建议按下面的顺序推进, 每一步都配上可运行的小程序.

## 第一层: 所有权和移动

先理解值在赋值, 传参和返回时发生了什么. 对 String 和 Vec 这类拥有堆数据的类型, 移动语义会直接影响 API 设计.

~~~rust
fn longest(a: &str, b: &str) -> &str {
    if a.len() >= b.len() { a } else { b }
}
~~~

这段代码会触发生命周期问题. 不要急着加标注, 先回答: 返回值的生命周期来自哪个输入.

## 第二层: 借用和生命周期

生命周期标注描述的是引用之间的关系, 不是让引用活得更久. 设计结构体时, 尽量让所有权边界清晰. 如果不确定是否需要引用字段, 先拥有数据, 等性能问题出现再优化.

## 第三层: Trait 和泛型

从实现一个简单的 trait 开始, 再理解泛型约束和 trait object.

~~~rust
trait Summary {
    fn summarize(&self) -> String;
}

fn render(items: &[Box<dyn Summary>]) -> String {
    items.iter().map(|item| item.summarize()).collect::<Vec<_>>().join(' | ')
}
~~~

思考什么时候使用静态分发, 什么时候需要运行时多态. 不要为了消除泛型膨胀而提前引入 dyn.

## 第四层: 错误处理

区分可恢复错误和不可恢复错误. 库代码优先返回 Result, 应用入口可以统一转换成用户可读的错误信息. 在错误类型设计上, 小型项目用简单枚举通常比引入复杂框架更快.

## 第五层: 并发和异步

先掌握线程, 通道和共享状态的限制, 再看 async/await. Future 是惰性的, 需要 executor 驱动. 不要同时学习和使用多个异步运行时, 先在一个生态里完成项目.

## 练习路线

1. 写一个带生命周期的字符串切分函数.
2. 用 trait 实现两种不同的缓存策略.
3. 把同步文件读取改成异步并处理取消.
4. 写一个多线程任务队列, 比较 Mutex 和 channel.
5. 复盘一次借用检查错误, 记录错误信息和修复思路.

## 学习建议

Rust 编译器是最好的老师. 先读完整错误信息, 再查文档. 不要用 clone 快速绕过所有借用问题, 但也不要在原型阶段为了零拷贝耗尽时间. 先让程序正确, 再用基准测试推动优化.`,
  },
  {
    id: 6,
    slug: 'docker-reproducible-dev',
    title: 'Docker 开发环境实践: 让课程项目一键启动',
    summary:
      '从 Dockerfile, Compose 到环境变量和健康检查, 搭建队友都能复现的本地环境.',
    level: 'intermediate',
    tagSlugs: ['docker', 'git'],
    authorHandle: 'jiangran',
    featured: false,
    status: 'published',
    createdAt: daysAgo(20),
    publishedAt: daysAgo(4),
    updatedAt: daysAgo(2),
    resources: [
      {
        title: 'Docker Get Started',
        url: 'https://docs.docker.com/get-started/',
        description: '镜像, 容器和基础命令的官方入门.',
      },
      {
        title: 'Docker Compose',
        url: 'https://docs.docker.com/compose/',
        description: '多服务编排和开发环境启动方式.',
      },
      {
        title: 'Dockerfile Best Practices',
        url: 'https://docs.docker.com/build/building/best-practices/',
        description: '缓存层, 镜像体积和安全相关建议.',
      },
    ],
    body: `# Docker 开发环境实践: 让课程项目一键启动

课程项目最常见的协作问题是环境不一致. 有人 Node 版本不同, 有人数据库没初始化, 最后花半天排查启动问题. 容器化可以先解决这一层.

## 从单服务开始

先为一个服务写最小 Dockerfile, 再考虑多服务 Compose. 不要一上来复制复杂模板.

~~~dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
~~~

把依赖安装和源码复制分开, 可以利用构建缓存. package 文件变化时才重新安装依赖.

## 用 Compose 描述依赖

真正的前后端项目通常至少需要数据库. Compose 把服务, 网络和卷放在一个文件里, 队友只需要一条命令.

~~~yaml
services:
  web:
    build: .
    ports:
      - '5173:5173'
    environment:
      VITE_API_BASE_URL: http://localhost:8000/api
    depends_on:
      - api

  api:
    build: ./server
    ports:
      - '8000:8000'
    env_file:
      - .env.example

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: dev-only
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
~~~

不要把真实密钥提交到仓库. 提交 .env.example, 在 README 写清楚需要复制和填写哪些变量.

## 健康检查和启动顺序

depends_on 只保证容器启动, 不代表数据库已经可用. 给数据库配置健康检查, 并让 API 在连接失败时有限重试.

~~~yaml
db:
  image: postgres:16-alpine
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U postgres']
    interval: 5s
    timeout: 3s
    retries: 10
~~~

应用侧仍然要做好重试和清晰报错, 健康检查不是万能保险.

## 开发环境与生产镜像分开

开发镜像挂载源码, 保留热更新. 生产镜像使用多阶段构建, 只保留运行所需的文件. 不要把开发依赖和源码调试工具带入生产镜像.

## README 应该包含什么

- 安装 Docker Desktop 的版本要求.
- 一条启动命令.
- 端口和访问地址.
- 初始化数据的方式.
- 常见错误, 例如端口占用和卷权限.
- 完全清理环境的命令.

## 检查清单

- [ ] 新队友能在十分钟内启动项目.
- [ ] 数据卷重启后仍然存在.
- [ ] 不依赖本机全局安装的数据库.
- [ ] 环境变量有示例文件.
- [ ] 镜像没有包含密钥和本地缓存.`,
  },
  {
    id: 7,
    slug: 'algorithm-review-template',
    title: '算法复盘模板: 把刷题记录变成可复用笔记',
    summary:
      '一套面向面试和课程考试的复盘模板, 记录思路, 复杂度, 反例和同类题.',
    level: 'advanced',
    tagSlugs: ['algorithm', 'python'],
    authorHandle: 'shenyan',
    featured: false,
    status: 'draft',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
    resources: [
      {
        title: 'LeetCode',
        url: 'https://leetcode.cn/',
        description: '题目练习和题解讨论.',
      },
      {
        title: 'Python Data Structures',
        url: 'https://docs.python.org/3/tutorial/datastructures.html',
        description: '列表, 字典和集合的常用操作.',
      },
    ],
    body: `# 算法复盘模板: 把刷题记录变成可复用笔记

刷题数量不是唯一指标. 真正有价值的是把一次解题过程抽象成可以在新题中复用的模式.

## 记录结构

每道题至少记录下面几项:

- 题目要解决的问题和输入规模.
- 第一直觉, 包括错误思路.
- 最终算法的关键不变量.
- 时间复杂度和空间复杂度.
- 一个能击穿错误思路的反例.
- 可以迁移到哪些同类题.

## 复盘示例

以滑动窗口为例, 重点不是背模板, 而是明确窗口内维护的约束. 写代码前先回答:

1. 什么时候扩大窗口.
2. 什么时候收缩窗口.
3. 答案在扩大时更新还是收缩时更新.
4. 重复元素和负数如何处理.

## 每周整理

把本周题目按模式分组, 每组挑一道代表题重写. 如果无法在不看题解的情况下写出来, 说明模式还没有真正掌握.

## 待补充

这份模板还需要补充图论和动态规划的复盘示例.`,
  },
]

let nextColumnId = Math.max(...columnSeeds.map((column) => column.id)) + 1

function readingMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.length / 420))
}

function toSummary(seed: ColumnSeed): ColumnSummary {
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    summary: seed.summary,
    level: seed.level,
    tags: seed.tagSlugs.map(tagRef),
    author: userByHandle(seed.authorHandle),
    resourceCount: seed.resources.length,
    readingMinutes: readingMinutes(seed.body),
    featured: seed.featured,
    publishedAt: seed.publishedAt,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  }
}

function toDetail(seed: ColumnSeed): ColumnDetail {
  return {
    ...toSummary(seed),
    body: seed.body,
    resources: seed.resources.map((resource) => ({ ...resource })),
  }
}

function toAdminColumn(seed: ColumnSeed): AdminColumn {
  return {
    ...toSummary(seed),
    status: seed.status,
    moderationLocked: Boolean(seed.moderationLocked),
  }
}

function toAdminDetail(seed: ColumnSeed): AdminColumnDetail {
  return {
    ...toAdminColumn(seed),
    body: seed.body,
    resources: seed.resources.map((resource) => ({ ...resource })),
  }
}

function matchesLevel(level: ColumnLevel, filter?: ColumnLevelFilter): boolean {
  return !filter || filter === 'all' || filter === level
}

function matchesKeyword(seed: ColumnSeed, keyword: string): boolean {
  if (!keyword) {
    return true
  }
  const haystack = [
    seed.title,
    seed.summary,
    seed.body,
    ...seed.tagSlugs,
    ...seed.resources.map((resource) => resource.title),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

function pageResult<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

export function listPublicColumns(query: ColumnQuery): PageResult<ColumnSummary> {
  const page = Math.max(1, Math.trunc(query.page ?? 1))
  const pageSize = Math.min(24, Math.max(1, Math.trunc(query.pageSize ?? 6)))
  const keyword = (query.q ?? '').trim().toLowerCase()
  const tag = (query.tag ?? '').trim()

  const filtered = columnSeeds
    .filter((seed) => seed.status === 'published')
    .filter((seed) => matchesLevel(seed.level, query.level))
    .filter((seed) => !tag || seed.tagSlugs.includes(tag))
    .filter((seed) => matchesKeyword(seed, keyword))
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      )
    })
    .map(toSummary)

  return pageResult(filtered, page, pageSize)
}

export function searchPublicColumns(keyword: string): ColumnSummary[] {
  const normalized = keyword.trim().toLowerCase()
  return columnSeeds
    .filter((seed) => seed.status === 'published' && matchesKeyword(seed, normalized))
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      return (
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
      )
    })
    .map(toSummary)
}

export function getPublicColumn(slug: string): ColumnDetail | null {
  const seed = columnSeeds.find(
    (item) => item.slug === slug && item.status === 'published',
  )
  return seed ? toDetail(seed) : null
}

export function listAdminColumns(query: AdminColumnQuery): PageResult<AdminColumn> {
  const page = Math.max(1, Math.trunc(query.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Math.trunc(query.pageSize ?? 10)))
  const keyword = (query.q ?? '').trim().toLowerCase()
  const status = query.status ?? 'all'

  const filtered = columnSeeds
    .filter((seed) => status === 'all' || seed.status === status)
    .filter((seed) => matchesLevel(seed.level, query.level))
    .filter((seed) => matchesKeyword(seed, keyword))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map(toAdminColumn)

  return pageResult(filtered, page, pageSize)
}

export function getAdminColumn(id: number): AdminColumnDetail | null {
  const seed = columnSeeds.find((item) => item.id === id)
  return seed ? toAdminDetail(seed) : null
}

export function isColumnSlugTaken(slug: string, excludeId?: number): boolean {
  return columnSeeds.some(
    (seed) => seed.id !== excludeId && seed.slug.toLowerCase() === slug.toLowerCase(),
  )
}

export function createAdminColumn(
  input: ColumnInput,
  authorHandle: string,
): AdminColumnDetail {
  const now = new Date().toISOString()
  const seed: ColumnSeed = {
    id: nextColumnId++,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    level: input.level,
    tagSlugs: [...input.tags],
    body: input.body,
    resources: input.resources.map((resource) => ({ ...resource })),
    authorHandle,
    featured: input.featured,
    status: input.status,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === 'published' ? now : undefined,
  }
  columnSeeds.push(seed)
  return toAdminDetail(seed)
}

function applyColumnFields(seed: ColumnSeed, input: ColumnInput): void {
  seed.slug = input.slug
  seed.title = input.title
  seed.summary = input.summary
  seed.level = input.level
  seed.tagSlugs = [...input.tags]
  seed.body = input.body
  seed.resources = input.resources.map((resource) => ({ ...resource }))
  seed.featured = input.featured
  seed.status = input.status
}

function applyPublishedAt(seed: ColumnSeed, wasPublished: boolean, now: string): void {
  if (seed.status === 'published') {
    seed.publishedAt = wasPublished && seed.publishedAt ? seed.publishedAt : now
  } else {
    seed.publishedAt = undefined
  }
}

export function updateAdminColumn(
  id: number,
  input: ColumnInput,
): AdminColumnDetail | null {
  const seed = columnSeeds.find((item) => item.id === id)
  if (!seed) {
    return null
  }
  const now = new Date().toISOString()
  const wasPublished = seed.status === 'published'
  applyColumnFields(seed, input)
  seed.updatedAt = now
  applyPublishedAt(seed, wasPublished, now)
  if (input.status === 'published') {
    seed.moderationLocked = false
  } else if (wasPublished) {
    seed.moderationLocked = true
  }
  return toAdminDetail(seed)
}

export function listMyColumns(
  authorHandle: string,
  query: MyColumnQuery,
): PageResult<AdminColumn> {
  const page = Math.max(1, Math.trunc(query.page ?? 1))
  const pageSize = Math.min(24, Math.max(1, Math.trunc(query.pageSize ?? 8)))

  const filtered = columnSeeds
    .filter((seed) => seed.authorHandle === authorHandle)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map(toAdminColumn)

  return pageResult(filtered, page, pageSize)
}

export function createMyColumn(
  input: ColumnInput,
  authorHandle: string,
): AdminColumnDetail {
  return createAdminColumn({ ...input, featured: false }, authorHandle)
}

export function updateMyColumn(
  id: number,
  input: ColumnInput,
): AdminColumnDetail | null {
  const seed = columnSeeds.find((item) => item.id === id)
  if (!seed) {
    return null
  }
  const now = new Date().toISOString()
  const wasPublished = seed.status === 'published'
  applyColumnFields(seed, {
    ...input,
    featured: seed.featured,
    status: seed.moderationLocked ? 'draft' : input.status,
  })
  seed.updatedAt = now
  applyPublishedAt(seed, wasPublished, now)
  return toAdminDetail(seed)
}

export function setMyColumnStatus(
  id: number,
  status: ColumnStatus,
): AdminColumn | null {
  const seed = columnSeeds.find((item) => item.id === id)
  if (!seed) {
    return null
  }
  const now = new Date().toISOString()
  const wasPublished = seed.status === 'published'
  seed.status = status
  seed.updatedAt = now
  applyPublishedAt(seed, wasPublished, now)
  return toAdminColumn(seed)
}

export function patchAdminColumn(
  id: number,
  patch: { status?: ColumnStatus; featured?: boolean },
): AdminColumn | null {
  const seed = columnSeeds.find((item) => item.id === id)
  if (!seed) {
    return null
  }
  const now = new Date().toISOString()
  const wasPublished = seed.status === 'published'
  if (patch.featured !== undefined) {
    seed.featured = patch.featured
  }
  if (patch.status !== undefined) {
    if (patch.status === 'published' && seed.status !== 'published') {
      seed.publishedAt = now
    }
    if (patch.status === 'draft') {
      seed.publishedAt = undefined
    }
    seed.status = patch.status
    if (patch.status === 'published') {
      seed.moderationLocked = false
    } else if (wasPublished) {
      seed.moderationLocked = true
    }
  }
  seed.updatedAt = now
  return toAdminColumn(seed)
}

export function deleteAdminColumn(id: number): boolean {
  const index = columnSeeds.findIndex((seed) => seed.id === id)
  if (index === -1) {
    return false
  }
  columnSeeds.splice(index, 1)
  return true
}
