import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', guestOnly: true, guestAccess: true },
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/views/WelcomeView.vue'),
      meta: { title: '新手指南', guestAccess: true },
    },
    {
      path: '/',
      name: 'questions',
      component: () => import('@/views/QuestionsView.vue'),
      meta: { title: '所有问题' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: '全站搜索', requiresAuth: true },
    },
    {
      path: '/questions/:id(\\d+)',
      name: 'question-detail',
      component: () => import('@/views/QuestionDetailView.vue'),
      meta: { title: '问题详情' },
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/TagsView.vue'),
      meta: { title: '标签' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { title: '项目展示' },
    },
    {
      path: '/projects/board',
      redirect: { name: 'projects' },
    },
    {
      path: '/projects/:slug',
      name: 'project-detail',
      component: () => import('@/views/ProjectDetailView.vue'),
      meta: { title: '项目详情' },
    },
    {
      path: '/columns',
      name: 'columns',
      component: () => import('@/views/ColumnsView.vue'),
      meta: { title: '专栏' },
    },
    {
      path: '/columns/:slug',
      name: 'column-detail',
      component: () => import('@/views/ColumnDetailView.vue'),
      meta: { title: '专栏详情' },
    },
    {
      path: '/my/projects',
      name: 'my-projects',
      component: () => import('@/views/MyProjectsView.vue'),
      meta: { title: '我的项目', requiresAuth: true },
    },
    {
      path: '/my/projects/new',
      name: 'project-new',
      component: () => import('@/views/ProjectEditorView.vue'),
      meta: { title: '发布项目', requiresAuth: true },
    },
    {
      path: '/my/projects/:id(\\d+)/edit',
      name: 'project-edit',
      component: () => import('@/views/ProjectEditorView.vue'),
      meta: { title: '编辑项目', requiresAuth: true },
    },
    {
      path: '/my/projects/:id(\\d+)/applications',
      name: 'my-project-applications',
      component: () => import('@/views/MyProjectApplicationsView.vue'),
      meta: { title: '组队申请', requiresAuth: true },
    },
    {
      path: '/my/projects/:id(\\d+)/updates',
      name: 'my-project-updates',
      component: () => import('@/views/MyProjectUpdatesView.vue'),
      meta: { title: '开发日志', requiresAuth: true },
    },
    {
      path: '/my/columns',
      name: 'my-columns',
      component: () => import('@/views/MyColumnsView.vue'),
      meta: { title: '我的专栏', requiresAuth: true, requiresColumnAccess: true },
    },
    {
      path: '/my/columns/new',
      name: 'my-column-new',
      component: () => import('@/views/MyColumnEditorView.vue'),
      meta: { title: '新建专栏', requiresAuth: true, requiresColumnAccess: true },
    },
    {
      path: '/my/columns/:id(\\d+)/edit',
      name: 'my-column-edit',
      component: () => import('@/views/MyColumnEditorView.vue'),
      meta: { title: '编辑专栏', requiresAuth: true, requiresColumnAccess: true },
    },
    {
      path: '/tags/:slug',
      name: 'tag-detail',
      component: () => import('@/views/TagDetailView.vue'),
      meta: { title: '标签详情' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { title: '开发者' },
    },
    {
      path: '/users/:handle',
      name: 'user-profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { title: '开发者主页' },
    },
    {
      path: '/ask',
      name: 'ask',
      component: () => import('@/views/AskQuestionView.vue'),
      meta: { title: '提问', requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { title: '通知', requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('@/components/admin/AdminShell.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue'),
          meta: { title: '管理后台' },
        },
        {
          path: 'questions',
          name: 'admin-questions',
          component: () => import('@/views/admin/AdminQuestionsView.vue'),
          meta: { title: '问题管理' },
        },
        {
          path: 'projects',
          name: 'admin-projects',
          component: () => import('@/views/admin/AdminProjectsView.vue'),
          meta: { title: '项目管理' },
        },
        {
          path: 'projects/:id(\\d+)/review',
          name: 'admin-project-review',
          component: () => import('@/views/admin/AdminProjectReviewView.vue'),
          meta: { title: '审核项目' },
        },
        {
          path: 'projects/:id(\\d+)/updates',
          name: 'admin-project-updates',
          component: () => import('@/views/admin/AdminProjectUpdatesView.vue'),
          meta: { title: '开发日志管理' },
        },
        {
          path: 'columns',
          name: 'admin-columns',
          component: () => import('@/views/admin/AdminColumnsView.vue'),
          meta: { title: '专栏管理' },
        },
        {
          path: 'columns/new',
          name: 'admin-column-new',
          component: () => import('@/views/admin/AdminColumnEditorView.vue'),
          meta: { title: '新建专栏' },
        },
        {
          path: 'columns/:id(\\d+)/edit',
          name: 'admin-column-edit',
          component: () => import('@/views/admin/AdminColumnEditorView.vue'),
          meta: { title: '编辑专栏' },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'tags',
          name: 'admin-tags',
          component: () => import('@/views/admin/AdminTagsView.vue'),
          meta: { title: '标签管理' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面未找到' },
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, top: 76, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const sessionStore = useSessionStore()
  await sessionStore.load()

  if (!sessionStore.isAuthenticated && !to.meta.guestAccess) {
    const keepRedirect = to.name !== 'not-found' && to.fullPath !== '/'
    return {
      name: 'welcome',
      query: keepRedirect ? { redirect: to.fullPath } : {},
    }
  }

  if (to.meta.requiresAdmin) {
    if (!sessionStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (!sessionStore.isAdmin) {
      useToastStore().error('需要管理员权限')
      return { name: 'questions' }
    }
  }

  if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresColumnAccess && !sessionStore.canWriteColumns) {
    useToastStore().error('需要专栏写作权限, 请联系管理员开通')
    return { name: 'columns' }
  }

  if (to.meta.guestOnly && sessionStore.isAuthenticated) {
    return sessionStore.isAdmin ? { name: 'admin-dashboard' } : { name: 'questions' }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} - SWStack` : 'SWStack - 校园开发者技术社区'
})

export default router
