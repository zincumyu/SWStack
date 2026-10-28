import type {
  Answer,
  CommunityStats,
  QuestionComment,
  QuestionDetail,
  QuestionSummary,
  QuestionTag,
  Tag,
  TopMember,
  UserBadge,
  UserProfile,
  UserSummary,
} from '@/api/types'

const now = Date.now()

function ago(options: { days?: number; hours?: number; minutes?: number }): string {
  const offset =
    (options.days ?? 0) * 86_400_000 +
    (options.hours ?? 0) * 3_600_000 +
    (options.minutes ?? 0) * 60_000
  return new Date(now - offset).toISOString()
}

export const users: UserSummary[] = [
  {
    id: 1,
    name: '陆星',
    handle: 'luxing',
    reputation: 12480,
    avatarColor: '#3f6273',
    title: '前端工程 / 计算机学院',
  },
  {
    id: 2,
    name: '周其',
    handle: 'zhouqi',
    reputation: 9860,
    avatarColor: '#6b5b4d',
    title: 'Vue 爱好者 / 软件工程',
  },
  {
    id: 3,
    name: '陈默',
    handle: 'chenmo',
    reputation: 7420,
    avatarColor: '#52685b',
    title: '后端开发 / 数据科学',
  },
  {
    id: 4,
    name: '何嘉',
    handle: 'hejia',
    reputation: 6120,
    avatarColor: '#6d5668',
    title: 'Go 与分布式系统',
  },
  {
    id: 5,
    name: '许舟',
    handle: 'xuzhou',
    reputation: 5540,
    avatarColor: '#4f5f7c',
    title: 'TypeScript / 前端基础设施',
  },
  {
    id: 6,
    name: '苏禾',
    handle: 'suhe',
    reputation: 4630,
    avatarColor: '#7a6241',
    title: '全栈开发 / 开源社团',
  },
  {
    id: 7,
    name: '林一',
    handle: 'linyi',
    reputation: 3980,
    avatarColor: '#456b67',
    title: '系统编程 / Rust',
  },
  {
    id: 8,
    name: '赵青',
    handle: 'zhaoqing',
    reputation: 3240,
    avatarColor: '#6a5560',
    title: '数据库 / 软件工程',
  },
  {
    id: 9,
    name: '顾言',
    handle: 'guyan',
    reputation: 2890,
    avatarColor: '#566274',
    title: 'React 开发 / 交互设计',
  },
  {
    id: 10,
    name: '谭悦',
    handle: 'tanyue',
    reputation: 2150,
    avatarColor: '#60704d',
    title: '前端开发 / 数字媒体',
  },
  {
    id: 11,
    name: '江然',
    handle: 'jiangran',
    reputation: 1780,
    avatarColor: '#675b76',
    title: 'DevOps / 计算机学院',
  },
  {
    id: 12,
    name: '沈砚',
    handle: 'shenyan',
    reputation: 1380,
    avatarColor: '#6e5948',
    title: 'Python 后端 / 人工智能',
  },
]

export const currentUser = users[0]

const tagSeeds: Tag[] = [
  {
    slug: 'javascript',
    name: 'javascript',
    description: '浏览器与 Node.js 生态中的 JavaScript 语言实践.',
    questionCount: 6732,
    weeklyCount: 126,
    followerCount: 4820,
  },
  {
    slug: 'typescript',
    name: 'typescript',
    description: '类型系统, 泛型, 工程配置与大型项目实践.',
    questionCount: 5180,
    weeklyCount: 98,
    followerCount: 3910,
  },
  {
    slug: 'vue3',
    name: 'vue3',
    description: 'Vue 3 组合式 API, 响应式系统与工程化经验.',
    questionCount: 4260,
    weeklyCount: 84,
    followerCount: 3240,
  },
  {
    slug: 'react',
    name: 'react',
    description: 'React 组件模型, Hooks 与并发渲染.',
    questionCount: 3890,
    weeklyCount: 62,
    followerCount: 2870,
  },
  {
    slug: 'python',
    name: 'python',
    description: 'Python 语言, 异步编程, 数据处理与后端开发.',
    questionCount: 3574,
    weeklyCount: 71,
    followerCount: 3010,
  },
  {
    slug: 'fastapi',
    name: 'fastapi',
    description: '基于 Python 类型注解的现代 Web API 框架.',
    questionCount: 1680,
    weeklyCount: 46,
    followerCount: 1420,
  },
  {
    slug: 'golang',
    name: 'golang',
    description: 'Go 并发模型, 服务端工程与性能优化.',
    questionCount: 2140,
    weeklyCount: 53,
    followerCount: 1980,
  },
  {
    slug: 'rust',
    name: 'rust',
    description: '所有权, 生命周期, 异步运行时与系统编程.',
    questionCount: 1420,
    weeklyCount: 38,
    followerCount: 1310,
  },
  {
    slug: 'sql',
    name: 'sql',
    description: '查询优化, 索引设计与关系型数据库建模.',
    questionCount: 1920,
    weeklyCount: 29,
    followerCount: 1750,
  },
  {
    slug: 'docker',
    name: 'docker',
    description: '容器构建, 镜像优化与本地开发环境.',
    questionCount: 1560,
    weeklyCount: 31,
    followerCount: 1480,
  },
  {
    slug: 'git',
    name: 'git',
    description: '版本控制, 分支协作与历史修复.',
    questionCount: 1210,
    weeklyCount: 18,
    followerCount: 1260,
  },
  {
    slug: 'algorithm',
    name: 'algorithm',
    description: '算法分析, 数据结构与竞赛编程.',
    questionCount: 2380,
    weeklyCount: 44,
    followerCount: 2190,
  },
]

export const tags = tagSeeds

function refs(...slugs: string[]): QuestionTag[] {
  return slugs.map((slug) => {
    const tag = tags.find((item) => item.slug === slug)
    return { slug, name: tag?.name ?? slug }
  })
}

function userByHandle(handle: string): UserSummary {
  return users.find((user) => user.handle === handle) ?? users[0]
}

let answerId = 0

interface AnswerSeed {
  author: string
  body: string
  score: number
  accepted?: boolean
  createdAt: string
  comments?: QuestionComment[]
}

let commentId = 0

function comment(author: string, body: string, createdAt: string): QuestionComment {
  commentId += 1
  return {
    id: commentId,
    body,
    author: userByHandle(author),
    createdAt,
  }
}

function makeAnswer(questionId: number, seed: AnswerSeed): Answer {
  answerId += 1
  return {
    id: answerId,
    questionId,
    body: seed.body,
    score: seed.score,
    accepted: seed.accepted ?? false,
    viewerVote: 0,
    author: userByHandle(seed.author),
    createdAt: seed.createdAt,
    comments: seed.comments ?? [],
  }
}

export interface QuestionRecord {
  id: number
  title: string
  excerpt: string
  body: string
  score: number
  viewCount: number
  isFeatured: boolean
  tags: QuestionTag[]
  author: UserSummary
  createdAt: string
  lastActivityAt: string
  viewerVote: -1 | 0 | 1
  bookmarked: boolean
  answersList: Answer[]
  comments: QuestionComment[]
}

function question(seed: Omit<QuestionRecord, 'answersList'> & { answers: Answer[] }): QuestionRecord {
  const { answers, ...record } = seed
  return { ...record, answersList: answers }
}

export const questions: QuestionRecord[] = [
  question({
    id: 101,
    title: 'Vue 3 中 ref 与 reactive 在组合式函数里应该如何选择',
    excerpt: '封装筛选器时既有单个关键字, 也有整体替换的分页对象. 想确认 ref/reactive 的边界和消费端解构时的正确做法.',
    body: `我在封装一个项目筛选器的组合式函数. 状态里既有单个关键字, 也有需要整体替换的分页对象. 现在写法大致如下:

\`\`\`ts
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
\`\`\`

调用方有时想直接解构 \`paging\`, 有时又把整个对象放进 \`watch\`. 我担心解构 reactive 之后会丢失响应性.

想确认两个问题:

1. 这里的 ref/reactive 选择是否合理
2. 如果消费端需要解构, 应该用 \`toRefs\` 还是干脆全部用 ref

项目使用 \`<script setup>\` 和 TypeScript, 状态只在一个页面内共享. 不是跨路由的全局状态.`,
    score: 42,
    viewCount: 1820,
    isFeatured: true,
    tags: refs('vue3', 'typescript'),
    author: userByHandle('zhouqi'),
    createdAt: ago({ hours: 3, minutes: 12 }),
    lastActivityAt: ago({ minutes: 18 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [
      comment('luxing', '补充一下, 这类组合式函数最好同时暴露一个只读的 query 快照, 方便序列化到 URL.', ago({ hours: 2 })),
      comment('chenmo', '如果筛选状态会跨页面保留, 可以从第一天就把它放进路由 query.', ago({ hours: 1, minutes: 30 })),
    ],
    answers: [
      makeAnswer(101, {
        author: 'luxing',
        score: 36,
        accepted: true,
        createdAt: ago({ hours: 2, minutes: 40 }),
        body: `建议按状态的形状选, 而不是按个人偏好选.

- 单个值用 \`ref\`
- 一组总是同步更新的字段用 \`reactive\`
- 只要需要解构或整体传递, 都优先返回 ref 或 \`toRefs\` 的结果

你的 \`paging\` 只有两个字段且总是成组出现, 用 \`reactive\` 合适. 但直接把 \`paging\` 解构给消费端会丢失响应性. 有两种清晰的做法:

\`\`\`ts
import { reactive, toRefs } from 'vue'

export function usePaging() {
  const paging = reactive({ page: 1, size: 20 })

  return { ...toRefs(paging), paging }
}
\`\`\`

另一种更统一的做法是保持内部 reactive, 只暴露一个最小接口:

\`\`\`ts
import { computed, reactive } from 'vue'

export function usePaging() {
  const state = reactive({ page: 1, size: 20 })

  const page = computed({
    get: () => state.page,
    set: (value: number) => {
      state.page = value
    },
  })

  return { paging: state, page }
}
\`\`\`

这比全量转成 ref 更清楚. \`ref\` 适合独立标量, \`reactive\` 适合聚合状态. 不要把两者的选择变成团队审美争论, 只约定组合式函数的返回边界就够了.

最后一点: 如果筛选条件需要分享链接或刷新恢复, 应该把 query 作为唯一事实来源, 不要同时在组件内维护一份重复状态.`,
        comments: [
          comment('zhouqi', '第二段用 computed 暴露 page 的方式很清楚. 我之前一直把所有字段 toRefs, 结果类型推导变得很难读.', ago({ hours: 2 })),
        ],
      }),
      makeAnswer(101, {
        author: 'chenmo',
        score: 9,
        createdAt: ago({ minutes: 55 }),
        body: `补一个可维护性角度. 组合式函数对外的返回值要尽量稳定. 只要消费端可以修改内部对象, 未来就很难在 setter 里加校验.

如果筛选条件将来要写回 URL, 我会直接写成:

\`\`\`ts
const query = reactive({
  keyword: '',
  page: 1,
  size: 20,
})

watch(query, (value) => {
  router.replace({ query: value })
}, { deep: true })
\`\`\`

此时返回一个 \`reset\` 和一个只读快照即可. 不需要让消费端直接持有整块状态.`,
      }),
    ],
  }),
  question({
    id: 102,
    title: 'FastAPI 依赖注入如何优雅地复用数据库会话',
    excerpt: '每个路由都声明 Depends(get_session) 感觉重复. 想在请求级别共享 AsyncSession, 同时保证异常时能正确回滚.',
    body: `项目从 Flask 迁移到 FastAPI. 现在每个路由都这样声明:

\`\`\`python
async def list_projects(
    session: AsyncSession = Depends(get_session),
):
    ...
\`\`\`

\`get_session\` 内部使用 \`async with async_sessionmaker()\` 创建会话. 我担心两个问题:

1. 同一请求里多个依赖都声明了 \`Depends(get_session)\` 时会不会拿到不同会话
2. 路由抛出异常后, \`async with\` 是否能保证回滚

希望保留显式依赖注入, 不想在中间件里全局塞一个 session.`,
    score: 31,
    viewCount: 1310,
    isFeatured: false,
    tags: refs('fastapi', 'python', 'sql'),
    author: userByHandle('chenmo'),
    createdAt: ago({ hours: 7 }),
    lastActivityAt: ago({ hours: 1, minutes: 10 }),
    viewerVote: 0,
    bookmarked: true,
    comments: [
      comment('shenyan', 'FastAPI 默认依赖缓存是请求级别的, 同一个依赖函数会在一次请求中只执行一次.', ago({ hours: 5 })),
    ],
    answers: [
      makeAnswer(102, {
        author: 'hejia',
        score: 24,
        accepted: true,
        createdAt: ago({ hours: 5 }),
        body: `依赖缓存确实能解决你的第一个问题. 在同一个请求作用域内, 相同依赖默认只执行一次. 关键是把 session 的创建和回滚写在一个生成器依赖里.

\`\`\`python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

SessionLocal = async_sessionmaker(expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
\`\`\`

路由继续使用 \`Depends(get_session)\` 即可. 不要在每个 service 里再创建新 session.

如果希望在依赖退出时统一 commit, 要明确区分读写请求. 隐式 commit 容易让事务边界变得模糊. 更推荐在 service 或路由中显式 commit, 异常时由上面的依赖回滚.

还需要注意: \`async with\` 退出时会 close session, 但不会自动 commit. 不要把 close 当成 commit.`,
        comments: [
          comment('chenmo', '确认了依赖是请求级缓存. rollback 放在 yield 外面之后, 异常路径的行为清楚很多.', ago({ hours: 4, minutes: 30 })),
        ],
      }),
      makeAnswer(102, {
        author: 'xuzhou',
        score: 6,
        createdAt: ago({ hours: 1, minutes: 10 }),
        body: `如果只是测试时想替换 session, 可以把 get_session 定义成可覆盖的依赖, 在测试里使用 \`app.dependency_overrides\`.

生产环境不建议通过中间件把 session 暴露成全局变量. 请求并发时很容易把连接生命周期搞混.`,
      }),
    ],
  }),
  question({
    id: 103,
    title: 'TypeScript 泛型约束在 API 响应包装类型里怎么写',
    excerpt: '想写一个通用的 ApiResponse<T>, 但后端有的接口返回数组, 有的返回深层的 items. 如何让类型提示不丢字段.',
    body: `后端响应格式大致如下:

\`\`\`ts
type ApiResponse<T> = {
  data: T
  message: string
}

type PageData<T> = {
  items: T[]
  total: number
}

type Project = {
  id: number
  name: string
}
\`\`\`

我写了 \`type ProjectPage = ApiResponse<PageData<Project>>\`, 调用处可以推导出 \`response.data.items[0].name\`. 但当泛型需要满足某些字段约束时, 开始出现类型报错.

想实现一个函数来解析响应并做运行时校验, 又不想把所有接口定义重写一遍. 有没有推荐的约束写法?`,
    score: 27,
    viewCount: 948,
    isFeatured: false,
    tags: refs('typescript', 'javascript'),
    author: userByHandle('xuzhou'),
    createdAt: ago({ hours: 11 }),
    lastActivityAt: ago({ hours: 2 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(103, {
        author: 'jiangran',
        score: 18,
        accepted: true,
        createdAt: ago({ hours: 8 }),
        body: `把包装类型和数据约束分开, 不要让一个泛型同时承担传输结构和校验逻辑.

\`\`\`ts
type ApiResponse<T> = {
  data: T
  message: string
}

type PageData<T> = {
  items: T[]
  total: number
}

type Envelope<T extends { data: unknown }> = T
\`\`\`

解析函数使用 \`unknown\` 入口, 在边界处完成断言, 内部再把具体类型交给调用方:

\`\`\`ts
function parseResponse<T>(
  value: unknown,
  isData: (input: unknown) => input is T,
): ApiResponse<T> {
  if (!value || typeof value !== 'object') {
    throw new Error('invalid response')
  }

  const envelope = value as { data?: unknown; message?: unknown }
  if (!isData(envelope.data)) {
    throw new Error('invalid payload')
  }

  return {
    data: envelope.data,
    message: typeof envelope.message === 'string' ? envelope.message : '',
  }
}
\`\`\`

如果使用 Zod, 可以直接从 schema 推导类型, 不必再手写约束:

\`\`\`ts
const projectPageSchema = z.object({
  items: z.array(projectSchema),
  total: z.number(),
})

type ProjectPage = z.infer<typeof projectPageSchema>
\`\`\`

核心原则是让泛型保持结构化, 把校验收口到 API 边界.`,
      }),
    ],
  }),
  question({
    id: 104,
    title: 'Go 的 errgroup 如何正确传递 context 取消信号',
    excerpt: '三个下游请求并行执行, 其中任意一个失败后其他请求还在继续. 想确认 errgroup.WithContext 的取消时机.',
    body: `代码结构如下:

\`\`\`go
func fetchAll(ctx context.Context) error {
    group, ctx := errgroup.WithContext(ctx)

    for _, source := range sources {
        source := source
        group.Go(func() error {
            return source.Fetch(ctx)
        })
    }

    return group.Wait()
}
\`\`\`

其中一个 \`Fetch\` 返回错误后, 我以为其他任务会立即收到取消信号. 但日志显示它们仍继续跑了几秒.

想让整个请求有统一的超时, 同时也希望第一个错误能尽快取消其他任务. 现在的写法漏了什么?`,
    score: 35,
    viewCount: 1550,
    isFeatured: false,
    tags: refs('golang'),
    author: userByHandle('hejia'),
    createdAt: ago({ days: 1, hours: 2 }),
    lastActivityAt: ago({ hours: 3 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(104, {
        author: 'luxing',
        score: 29,
        accepted: true,
        createdAt: ago({ hours: 20 }),
        body: `\`errgroup.WithContext\` 只有在 \`Wait\` 观察到第一个错误之后才会取消它生成的 context. 取消不是由 \`Fetch\` 的返回值瞬间触发的.

如果任务本身会长时间阻塞, 需要确保它真的消费了传入的 ctx:

\`\`\`go
func (s *source) Fetch(ctx context.Context) error {
    request, err := http.NewRequestWithContext(ctx, http.MethodGet, s.url, nil)
    if err != nil {
        return err
    }

    response, err := s.client.Do(request)
    if err != nil {
        return err
    }
    defer response.Body.Close()

    return s.decode(response.Body)
}
\`\`\`

另外不要在内层再创建一个脱离父链的 context:

\`\`\`go
group.Go(func() error {
    child, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()
    return source.Fetch(child)
})
\`\`\`

这会切断取消链. 要基于传入的 ctx 派生.

想让超时和首个错误都生效, 可以这样写:

\`\`\`go
ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
defer cancel()

group, groupCtx := errgroup.WithContext(ctx)
\`\`\`

最后检查每个下游调用是否把 ctx 一路传了下去. 没有传递 context 的 goroutine 不会被魔法取消.`,
      }),
      makeAnswer(104, {
        author: 'linyi',
        score: 4,
        createdAt: ago({ hours: 3 }),
        body: `还有一个容易忽略的点: 如果错误不是在 goroutine 顶层返回, 而是被内部 recover 掉, errgroup 看不到错误, 也就不会取消.

可以用 \`errgroup.WithContext\` 配合带缓冲的错误通道做额外观测, 但优先保持错误向上返回.`,
      }),
    ],
  }),
  question({
    id: 105,
    title: 'Docker 多阶段构建中如何减小 Node 前端镜像体积',
    excerpt: '构建镜像接近 800MB, 最终只需要静态文件. 想保留可复现构建, 同时不把 node_modules 和源码带进运行镜像.',
    body: `当前 Dockerfile:

\`\`\`dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
\`\`\`

镜像里包含了完整的 Node 工具链和 devDependencies. 项目最终只产出 \`dist\` 静态文件.

想使用 nginx 托管, 同时控制构建缓存. 应该怎么拆分阶段和 \`.dockerignore\`?`,
    score: 19,
    viewCount: 780,
    isFeatured: false,
    tags: refs('docker', 'javascript'),
    author: userByHandle('suhe'),
    createdAt: ago({ days: 1, hours: 6 }),
    lastActivityAt: ago({ hours: 5 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(105, {
        author: 'hejia',
        score: 16,
        accepted: true,
        createdAt: ago({ hours: 22 }),
        body: `分成构建阶段和运行阶段即可. 运行时不需要 Node.

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
\`\`\`

注意复制依赖清单要在复制源码之前, 这样修改业务代码不会让依赖安装缓存失效. 如果使用 Vite, 构建产物位于 \`dist\`.

再补一个 \`.dockerignore\`:

\`\`\`text
node_modules
dist
.git
.env*
\`\`\`

镜像体积主要会从 Node 基础镜像降到 nginx alpine 的体积. 不要再把 \`node_modules\` 从构建阶段复制到运行阶段.`,
      }),
    ],
  }),
  question({
    id: 106,
    title: 'Rust 所有权规则下如何返回一个借用字符串',
    excerpt: '想从结构体方法里返回 name 字段的 &str, 编译器提示生命周期不匹配. 不确定应该加生命周期还是返回 String.',
    body: `有一个配置结构体:

\`\`\`rust
struct Config {
    name: String,
    path: String,
}

impl Config {
    fn name(&self) -> &str {
        &self.name
    }
}
\`\`\`

上面的代码能编译. 但当我把它包进另一个结构体, 并尝试在构造函数里返回借用时就会失败:

\`\`\`rust
struct Service<'a> {
    name: &'a str,
}

impl Service<'_> {
    fn new(config: &Config) -> Self {
        Self { name: &config.name }
    }
}
\`\`\`

为什么不能像预期那样持有配置字段的借用? 这里应该显式写生命周期吗?`,
    score: 23,
    viewCount: 1100,
    isFeatured: false,
    tags: refs('rust'),
    author: userByHandle('linyi'),
    createdAt: ago({ days: 2, hours: 3 }),
    lastActivityAt: ago({ hours: 6 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(106, {
        author: 'zhaoqing',
        score: 21,
        accepted: true,
        createdAt: ago({ days: 1, hours: 12 }),
        body: `\`Service\` 的字段是借用, 所以 \`new\` 的返回值必须把输入参数的生命周期带到返回值上. 写成 \`impl Service<'_>\` 时, 匿名生命周期不能表达这种关系.

可以显式连接:

\`\`\`rust
struct Service<'a> {
    name: &'a str,
}

impl<'a> Service<'a> {
    fn new(config: &'a Config) -> Self {
        Self { name: &config.name }
    }
}
\`\`\`

也可以让编译器用省略规则推导:

\`\`\`rust
impl<'a> Service<'a> {
    fn new(config: &'a Config) -> Service<'a> {
        Service { name: &config.name }
    }
}
\`\`\`

但真正要考虑的是对象关系. 如果 \`Service\` 的生命周期会比 \`Config\` 长, 这个借用就是错误的. 这时应该拥有字段:

\`\`\`rust
struct Service {
    name: String,
}

impl Service {
    fn new(config: &Config) -> Self {
        Self { name: config.name.clone() }
    }
}
\`\`\`

不要为了绕开生命周期而滥用 \`Box::leak\` 或内部可变性. 先问清楚谁应该拥有数据.`,
        comments: [
          comment('linyi', '关键确实是谁拥有数据. 我改成持有 Arc<Config> 后, 生命周期问题自然消失了.', ago({ days: 1, hours: 8 })),
        ],
      }),
      makeAnswer(106, {
        author: 'guyan',
        score: 7,
        createdAt: ago({ hours: 6 }),
        body: `如果 Service 会被多个任务共享, 可以持有 \`Arc<Config>\`, 从它派生借用时要注意不要创建 self-referential struct.

\`\`\`rust
struct Service {
    config: Arc<Config>,
}

impl Service {
    fn name(&self) -> &str {
        &self.config.name
    }
}
\`\`\`

这样接口也简单得多.`,
      }),
    ],
  }),
  question({
    id: 107,
    title: 'SQL 索引在联合查询中没有命中是什么原因',
    excerpt: 'orders 和 users 联表查询只走主键索引, 明明建了 user_id 索引. 想搞清楚执行计划和隐式转换的影响.',
    body: `查询如下:

\`\`\`sql
select o.id, o.amount, u.nickname
from orders o
join users u on u.id = o.user_id
where o.user_id = '1024'
  and o.status = 'paid'
order by o.created_at desc
limit 20;
\`\`\`

\`orders.user_id\` 是 bigint, 也建了普通索引. 但执行计划没有走这个索引.

数据库是 MySQL 8. 数据量约 300 万行. \`status\` 的区分度很低. 想了解优化器为什么这样选择, 以及应该怎样看执行计划.`,
    score: 14,
    viewCount: 615,
    isFeatured: false,
    tags: refs('sql'),
    author: userByHandle('zhaoqing'),
    createdAt: ago({ days: 2, hours: 8 }),
    lastActivityAt: ago({ days: 1 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [],
  }),
  question({
    id: 108,
    title: 'React 18 并发渲染下 useEffect 重复执行如何排查',
    excerpt: 'StrictMode 开发环境里请求发了两次, 去掉 StrictMode 就正常. 这是框架 bug 还是应该修改副作用结构.',
    body: `组件挂载时会请求一次项目列表:

\`\`\`tsx
useEffect(() => {
  const controller = new AbortController()

  fetchProjects(controller.signal).then(setProjects)

  return () => controller.abort()
}, [])
\`\`\`

开发环境使用 \`StrictMode\` 时, Network 面板能看到两次请求. 生产构建看起来正常.

想问这是不是 React 18 的问题. 在保留 StrictMode 的前提下, 如何避免重复请求和重复副作用?`,
    score: 29,
    viewCount: 1670,
    isFeatured: false,
    tags: refs('react', 'javascript'),
    author: userByHandle('guyan'),
    createdAt: ago({ days: 3 }),
    lastActivityAt: ago({ hours: 4 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(108, {
        author: 'luxing',
        score: 25,
        createdAt: ago({ days: 2, hours: 10 }),
        body: `这不是 bug. StrictMode 在开发环境会刻意重复执行 mount / unmount / mount, 用来暴露没有正确清理的副作用.

你的 effect 已经返回了 abort 清理函数, 所以第一次请求会被取消. 如果仍然看到两次响应, 检查 fetch 封装是否真的把 signal 传到了底层, 以及有没有在 catch 里把 AbortError 当成业务错误.

\`\`\`ts
async function fetchProjects(signal: AbortSignal) {
  const response = await fetch('/api/projects', { signal })
  if (!response.ok) {
    throw new Error('failed to load projects')
  }
  return response.json()
}
\`\`\`

另一个常见问题是在 effect 里创建对象或函数依赖, 却没有写进依赖数组. 这会让闭包读到旧状态. 先把副作用写成可重复执行且可清理的结构, 再考虑缓存.

不要在开发环境关闭 StrictMode 来掩盖问题. 它可以提前暴露生产环境的竞态.`,
        comments: [],
      }),
      makeAnswer(108, {
        author: 'zhouqi',
        score: 6,
        createdAt: ago({ hours: 4 }),
        body: `如果需要跨组件复用请求状态, 可以把请求封装成带缓存的 hook. 但缓存键里要包含筛选参数, 否则切换页面时会读到上一次的数据.`,
      }),
    ],
  }),
  question({
    id: 109,
    title: 'Composition API 中 watch 和 watchEffect 的清理时机',
    excerpt: '在副作用里注册了监听器, 组件卸载后仍然收到回调. 想确认 onCleanup 和 onUnmounted 的执行顺序.',
    body: `我有一段监听窗口尺寸的逻辑:

\`\`\`ts
watch(active, (value) => {
  const handler = () => {
    if (value) {
      updateLayout()
    }
  }

  window.addEventListener('resize', handler)
}, { immediate: true })
\`\`\`

切换 \`active\` 之后旧监听器仍然会触发. 想改成可清理的结构, 但不清楚 \`onCleanup\` 是否足够. 它和 \`onUnmounted\` 谁先执行?`,
    score: 18,
    viewCount: 530,
    isFeatured: false,
    tags: refs('vue3'),
    author: userByHandle('tanyue'),
    createdAt: ago({ days: 3, hours: 5 }),
    lastActivityAt: ago({ hours: 8 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(109, {
        author: 'zhouqi',
        score: 14,
        accepted: true,
        createdAt: ago({ days: 2 }),
        body: `\`watch\` 的回调可以接收 \`onCleanup\`, 每次重新执行前会先调用上一次的清理函数. 这正好适合注册和移除监听器:

\`\`\`ts
watch(active, (value, _oldValue, onCleanup) => {
  if (!value) {
    return
  }

  const handler = () => updateLayout()
  window.addEventListener('resize', handler)

  onCleanup(() => {
    window.removeEventListener('resize', handler)
  })
}, { immediate: true })
\`\`\`

当 active 变化或 watch 所在的 effect scope 销毁时, cleanup 会执行. 它比只依赖 \`onUnmounted\` 更精确, 因为每次依赖变化都能清理上一次的副作用.

如果只想在组件卸载时清理, \`onUnmounted\` 也可以. 但你的场景需要每次切换都重新注册, 应该使用 \`onCleanup\`.`,
      }),
    ],
  }),
  question({
    id: 110,
    title: 'Git rebase 之后如何安全地恢复已经被覆盖的提交',
    excerpt: '交互式 rebase 时误删了两个提交并强制推送. 想在团队仓库里找回原始提交, 同时避免再次破坏历史.',
    body: `我在功能分支上执行了 \`git rebase -i main\`, 本想合并三个提交, 结果误操作删除了其中两个. 随后执行了 \`git push --force-with-lease\`.

现在分支看起来丢失了部分实现. 我记得 rebase 之前的提交哈希没有记录, 只记得当时在终端里看到过.

有没有办法从 reflog 或远端找回? 强制推送后 origin 上的旧引用还在吗?`,
    score: 38,
    viewCount: 2450,
    isFeatured: true,
    tags: refs('git'),
    author: userByHandle('jiangran'),
    createdAt: ago({ days: 4 }),
    lastActivityAt: ago({ minutes: 42 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [
      comment('suhe', '先别继续 rebase 或 gc. reflog 一般还在, 尽快把目标提交固定到一个新分支上.', ago({ minutes: 42 })),
    ],
    answers: [
      makeAnswer(110, {
        author: 'xuzhou',
        score: 33,
        accepted: true,
        createdAt: ago({ days: 3, hours: 20 }),
        body: `先停止对仓库做任何清理操作. 大多数情况下提交还在本地 reflog 里.

\`\`\`bash
git reflog --date=iso
\`\`\`

找到 rebase 之前的 \`HEAD@{n}\` 记录, 用一个新的恢复分支固定它:

\`\`\`bash
git branch recovery/pre-rebase HEAD@{7}
git switch recovery/pre-rebase
\`\`\`

不要把恢复分支直接 force push 到原分支. 先对比:

\`\`\`bash
git log --oneline --graph --all
git diff origin/main...recovery/pre-rebase
\`\`\`

如果需要找回某个具体提交, 可以使用 \`git fsck --lost-found\` 查看悬挂提交. 但先检查 reflog 成本更低.

远端旧提交能否恢复取决于服务器配置. GitHub 的 force push 之后旧对象通常还能通过提交 API 或已打开的 PR 找到, 但不要把它当成长期备份.

恢复后重新基于原分支整理历史:

\`\`\`bash
git switch feature-branch
git reset --hard recovery/pre-rebase
git rebase -i origin/main
\`\`\`

这次每一步都先确认提交列表, 不要在有未提交改动时开始 rebase.`,
        comments: [
          comment('jiangran', 'reflog 里找到了. 建了 recovery 分支后对比, 两个提交都完整. 谢谢.', ago({ days: 3, hours: 2 })),
        ],
      }),
      makeAnswer(110, {
        author: 'hejia',
        score: 11,
        createdAt: ago({ minutes: 42 }),
        body: `补充一个团队层面的做法: 强制推送前先让 CI 跑一次完整构建, 并把 old HEAD 哈希写进分支描述或发布记录.

如果使用 GitHub, force push 后旧提交的 URL 可能还能访问, 但一旦触发垃圾回收就不保证. reflog 只在本地默认保留一段时间, 所以恢复动作要尽快.`,
      }),
    ],
  }),
  question({
    id: 111,
    title: 'Python 异步任务中共享 aiohttp session 的最佳实践',
    excerpt: '为每个请求创建 ClientSession 很慢, 但全局单例在事件循环关闭时又报错. 想了解应用生命周期内的正确作用域.',
    body: `服务使用 FastAPI 和 aiohttp 调用第三方 API. 现在每个函数里都会:

\`\`\`python
async with aiohttp.ClientSession() as session:
    async with session.get(url) as response:
        return await response.json()
\`\`\`

高并发下创建连接的开销很明显. 尝试改成模块级单例后, 测试环境出现 \`Event loop is closed\`.

想问在生产应用里应该怎样管理 session 生命周期. 是放在 \`lifespan\` 里, 还是每个请求一个?`,
    score: 21,
    viewCount: 870,
    isFeatured: false,
    tags: refs('python', 'fastapi'),
    author: userByHandle('shenyan'),
    createdAt: ago({ days: 4, hours: 2 }),
    lastActivityAt: ago({ days: 1, hours: 4 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(111, {
        author: 'chenmo',
        score: 17,
        accepted: true,
        createdAt: ago({ days: 3, hours: 6 }),
        body: `把 session 绑定到应用生命周期, 不要绑定到模块导入时的事件循环.

\`\`\`python
from contextlib import asynccontextmanager

import aiohttp
from fastapi import FastAPI, Request


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=8),
        connector=aiohttp.TCPConnector(limit=100),
    )
    yield
    await app.state.http.close()


app = FastAPI(lifespan=lifespan)


async def get_http(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http
\`\`\`

路由里通过依赖注入获取:

\`\`\`python
@app.get('/remote')
async def remote(http: aiohttp.ClientSession = Depends(get_http)):
    async with http.get('https://example.com/api') as response:
        return await response.json()
\`\`\`

这样连接池复用了, 关闭时机也可控. 测试时可以替换 \`app.dependency_overrides\`, 或单独构造测试用 lifespan.

不要使用模块级 \`ClientSession\`, 因为导入时未必有事件循环, 并且测试会创建新的 loop.`,
      }),
    ],
  }),
  question({
    id: 112,
    title: '这个二分查找边界条件为什么在数组长度为 1 时失败',
    excerpt: '标准库的 bisect 能看到结果, 但手写版本在单元素数组上返回 -1. 想确保所有边界都正确.',
    body: `我的实现:

\`\`\`python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1

    while left < right:
        middle = (left + right) // 2
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle

    return left if nums[left] == target else -1
\`\`\`

大部分测试都通过了. 但 \`nums=[5]\` 且 \`target=5\` 时会越界或者返回错误. 我尝试把循环条件改成 \`left <= right\`, 又有其他测试失败.

希望保留左闭右闭的思路, 但不想每次都靠试错调整边界.`,
    score: 12,
    viewCount: 420,
    isFeatured: false,
    tags: refs('algorithm', 'python'),
    author: userByHandle('luxing'),
    createdAt: ago({ days: 5, hours: 4 }),
    lastActivityAt: ago({ days: 2, hours: 3 }),
    viewerVote: 0,
    bookmarked: false,
    comments: [],
    answers: [
      makeAnswer(112, {
        author: 'linyi',
        score: 10,
        accepted: true,
        createdAt: ago({ days: 4 }),
        body: `你的问题是混用了两种区间定义.

\`right = len(nums) - 1\` 表示右端是闭区间, 循环条件应该是 \`left <= right\`. 但循环内部你又写成了 \`right = middle\`, 这更像半开区间的收缩方式.

保持左闭右闭:

\`\`\`python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1

    while left <= right:
        middle = left + (right - left) // 2
        if nums[middle] == target:
            return middle
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle - 1

    return -1
\`\`\`

如果只想找插入位置, 使用左闭右开的模板:

\`\`\`python
left, right = 0, len(nums)
while left < right:
    middle = (left + right) // 2
    if nums[middle] < target:
        left = middle + 1
    else:
        right = middle
return left
\`\`\`

先写清楚不变式, 再写循环. 不要同时改变循环条件和收缩方向. 单元素数组是最容易暴露问题的测试.`,
      }),
      makeAnswer(112, {
        author: 'suhe',
        score: 3,
        createdAt: ago({ days: 2, hours: 3 }),
        body: `补充一个测试策略: 每个边界版本都覆盖空数组, 单元素, 目标在首尾, 目标不存在这四种情况. 这样就不需要靠感觉调 \`left\` 和 \`right\`.`,
      }),
    ],
  }),
]

export const communityStats: CommunityStats = {
  questionCount: 12482,
  answerCount: 38210,
  developerCount: 8604,
  solvedRate: 78,
  todayQuestionCount: 36,
  onlineCount: 214,
}

export interface UserProfileSeed extends Omit<UserProfile, 'recentQuestions'> {
  badges: UserBadge[]
}

const profileMeta: Record<
  string,
  {
    bio: string
    location: string
    school: string
    joinedAt: string
    questionCount: number
    answerCount: number
    viewCount: number
    topTags: string[]
    badges: UserBadge[]
  }
> = {
  luxing: {
    bio: '关注前端架构, 可访问性和设计系统. 喜欢把复杂问题拆成可以验证的小步骤.',
    location: '杭州',
    school: '计算机科学与技术',
    joinedAt: '2023-03-18T08:00:00.000Z',
    questionCount: 48,
    answerCount: 126,
    viewCount: 28400,
    topTags: ['vue3', 'typescript', 'javascript'],
    badges: [
      { label: '年度贡献者', tone: 'gold' },
      { label: 'Vue 专家', tone: 'silver' },
      { label: '社区编辑', tone: 'bronze' },
    ],
  },
  zhouqi: {
    bio: '在实验室做前端工具链, 也在维护一个校园组件库. 对组合式 API 和类型推导很感兴趣.',
    location: '南京',
    school: '软件工程',
    joinedAt: '2023-05-02T08:00:00.000Z',
    questionCount: 35,
    answerCount: 78,
    viewCount: 19300,
    topTags: ['vue3', 'typescript', 'javascript'],
    badges: [
      { label: 'Vue 专家', tone: 'silver' },
      { label: '活跃提问者', tone: 'neutral' },
    ],
  },
  chenmo: {
    bio: '后端开发和数据工程. 正在学习如何把异步服务的边界写清楚.',
    location: '成都',
    school: '数据科学与大数据技术',
    joinedAt: '2023-09-11T08:00:00.000Z',
    questionCount: 52,
    answerCount: 91,
    viewCount: 22100,
    topTags: ['fastapi', 'python', 'sql'],
    badges: [
      { label: 'Python 专家', tone: 'silver' },
      { label: '提问达人', tone: 'neutral' },
    ],
  },
  hejia: {
    bio: 'Go 服务和分布式存储. 喜欢读 runtime 源码, 也会写一些性能基准.',
    location: '武汉',
    school: '计算机系统结构',
    joinedAt: '2022-11-06T08:00:00.000Z',
    questionCount: 22,
    answerCount: 64,
    viewCount: 17800,
    topTags: ['golang', 'docker', 'sql'],
    badges: [
      { label: 'Go 专家', tone: 'gold' },
      { label: '问题解决者', tone: 'bronze' },
    ],
  },
  xuzhou: {
    bio: '关注类型系统和前端基础设施. 最近在研究 monorepo 下的增量构建.',
    location: '北京',
    school: '计算机科学',
    joinedAt: '2024-01-23T08:00:00.000Z',
    questionCount: 28,
    answerCount: 54,
    viewCount: 12000,
    topTags: ['typescript', 'javascript', 'git'],
    badges: [{ label: 'TypeScript 专家', tone: 'silver' }],
  },
  suhe: {
    bio: '全栈开发, 校园开源社团负责人. 关注开发者工具和部署体验.',
    location: '广州',
    school: '软件工程',
    joinedAt: '2024-02-14T08:00:00.000Z',
    questionCount: 31,
    answerCount: 42,
    viewCount: 9800,
    topTags: ['docker', 'javascript', 'python'],
    badges: [
      { label: '开源贡献者', tone: 'silver' },
      { label: '活跃成员', tone: 'neutral' },
    ],
  },
  linyi: {
    bio: '系统编程与 Rust. 对生命周期, 内存布局和并发模型很好奇.',
    location: '西安',
    school: '计算机系统结构',
    joinedAt: '2024-03-19T08:00:00.000Z',
    questionCount: 21,
    answerCount: 37,
    viewCount: 8400,
    topTags: ['rust', 'algorithm', 'golang'],
    badges: [{ label: 'Rust 爱好者', tone: 'bronze' }],
  },
  zhaoqing: {
    bio: '数据库方向研究生. 喜欢用执行计划解释性能问题.',
    location: '合肥',
    school: '数据科学',
    joinedAt: '2023-12-08T08:00:00.000Z',
    questionCount: 17,
    answerCount: 39,
    viewCount: 7600,
    topTags: ['sql', 'python', 'algorithm'],
    badges: [{ label: '数据库能手', tone: 'silver' }],
  },
  guyan: {
    bio: 'React 开发与交互设计. 正在做一个面向课程项目的可视化编辑器.',
    location: '上海',
    school: '数字媒体技术',
    joinedAt: '2024-04-07T08:00:00.000Z',
    questionCount: 26,
    answerCount: 29,
    viewCount: 6900,
    topTags: ['react', 'javascript', 'typescript'],
    badges: [{ label: 'React 探索者', tone: 'bronze' }],
  },
  tanyue: {
    bio: '前端开发, 对交互动效和响应式布局感兴趣.',
    location: '厦门',
    school: '软件工程',
    joinedAt: '2024-06-15T08:00:00.000Z',
    questionCount: 19,
    answerCount: 16,
    viewCount: 4300,
    topTags: ['vue3', 'javascript', 'react'],
    badges: [{ label: '新锐成员', tone: 'neutral' }],
  },
  jiangran: {
    bio: 'DevOps 和平台工程. 维护社团的 CI 流水线与自托管服务.',
    location: '深圳',
    school: '网络工程',
    joinedAt: '2023-08-26T08:00:00.000Z',
    questionCount: 14,
    answerCount: 33,
    viewCount: 5800,
    topTags: ['git', 'docker', 'golang'],
    badges: [{ label: 'CI 维护者', tone: 'bronze' }],
  },
  shenyan: {
    bio: 'Python 后端和机器学习工程. 正在补足异步编程的基础.',
    location: '重庆',
    school: '人工智能',
    joinedAt: '2025-01-09T08:00:00.000Z',
    questionCount: 12,
    answerCount: 9,
    viewCount: 2800,
    topTags: ['python', 'fastapi', 'algorithm'],
    badges: [{ label: '新加入', tone: 'neutral' }],
  },
}

export const userProfiles: UserProfileSeed[] = users.map((user) => {
  const meta = profileMeta[user.handle]
  const topTags = meta.topTags
    .map((slug) => tags.find((tag) => tag.slug === slug))
    .filter((tag): tag is Tag => Boolean(tag))

  return {
    ...user,
    ...meta,
    topTags,
  }
})

export function toQuestionSummary(record: QuestionRecord): QuestionSummary {
  const { answersList, body: _body, viewerVote: _viewerVote, bookmarked: _bookmarked, comments: _comments, ...summary } = record
  return {
    ...summary,
    answerCount: answersList.length,
    hasAcceptedAnswer: answersList.some((answer) => answer.accepted),
  }
}

export function toQuestionDetail(record: QuestionRecord): QuestionDetail {
  const related = questions
    .filter((item) => item.id !== record.id)
    .map((item) => ({
      record: item,
      overlap: item.tags.filter((tag) => record.tags.some((current) => current.slug === tag.slug)).length,
    }))
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.record.score - a.record.score)
    .slice(0, 5)
    .map((item) => toQuestionSummary(item.record))

  return {
    ...toQuestionSummary(record),
    body: record.body,
    viewerVote: record.viewerVote,
    bookmarked: record.bookmarked,
    answersList: record.answersList,
    related,
    comments: record.comments,
  }
}

export function buildUserProfile(handle: string): UserProfile | undefined {
  const profile = userProfiles.find((item) => item.handle === handle)
  if (!profile) {
    return undefined
  }

  const recentQuestions = questions
    .filter((item) => item.author.handle === handle)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(toQuestionSummary)

  return { ...profile, recentQuestions }
}

export const topMembers: TopMember[] = [
  { user: users[0], weeklyScore: 860, topTag: 'typescript' },
  { user: users[3], weeklyScore: 720, topTag: 'golang' },
  { user: users[2], weeklyScore: 640, topTag: 'fastapi' },
  { user: users[4], weeklyScore: 580, topTag: 'vue3' },
  { user: users[6], weeklyScore: 430, topTag: 'rust' },
]

export const popularTags = [...tags]
  .sort((a, b) => b.weeklyCount - a.weeklyCount)
  .slice(0, 6)

export const questionSummaries = questions.map(toQuestionSummary)
