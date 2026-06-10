import { projectInfo } from 'virtual:admin-project-info'

import type { MenuRecord } from '@/types/admin'
import type { ProjectInfo } from '@/types/project-info'

export interface OverviewStat {
  label: string
  trend: string
  value: string
}

export interface OverviewSummary {
  healthItems: Array<{
    label: string
    value: string
  }>
  operationItems: Array<{
    label: string
    status: string
  }>
  stats: OverviewStat[]
}

export interface WorkplaceMetric {
  label: string
  trend: string
  value: string
}

export interface WorkplaceTask {
  assignee: string
  deadline: string
  priority: '高' | '中' | '低'
  status: string
  title: string
}

export interface WorkplaceActivity {
  action: string
  actor: string
  time: string
}

export interface WorkplaceSummary {
  activities: WorkplaceActivity[]
  metrics: WorkplaceMetric[]
  tasks: WorkplaceTask[]
}

export interface NotificationRecord {
  description: string
  id: string
  status: 'read' | 'unread'
  time: string
  title: string
  type: 'success' | 'warning' | 'info'
}

export interface UserRecord {
  department: string
  email: string
  lastLogin: string
  loginMethod: string
  name: string
  riskLevel: '低' | '中' | '高'
  role: string
  status: string
}

export interface RoleRecord {
  code: string
  dataScope: string
  description: string
  memberCount: number
  name: string
  permissions: string[]
  status: string
}

export interface MenuManagementRecord {
  childrenCount: number
  component: string
  name: string
  parentName: string
  path: string
  permission: string
  sort: number
  status: string
  type: '目录' | '菜单'
}

export interface DepartmentRecord {
  childrenCount: number
  code: string
  description: string
  leader: string
  memberCount: number
  name: string
  parent: string
  projectCount: number
  status: string
}

const MOCK_DELAY = 120

// Mock 菜单是后台导航和路由归一化的单一数据源，标题固定为中文。
export const mockAdminMenu: MenuRecord[] = [
  {
    icon: 'LayoutDashboard',
    key: '/overview',
    path: '/overview',
    permission: 'overview:read',
    title: '概览'
  },
  {
    icon: 'BriefcaseBusiness',
    key: '/workplace',
    path: '/workplace',
    permission: 'workplace:read',
    title: '工作台'
  },
  {
    children: [
      {
        badge: '12',
        key: '/system/users',
        path: '/system/users',
        permission: 'system:user:read',
        title: '用户管理'
      },
      {
        key: '/system/roles',
        path: '/system/roles',
        permission: 'system:role:read',
        title: '角色管理'
      },
      {
        key: '/system/menus',
        path: '/system/menus',
        permission: 'system:menu:read',
        title: '菜单管理'
      },
      {
        key: '/system/departments',
        path: '/system/departments',
        permission: 'system:department:read',
        title: '部门管理'
      }
    ],
    icon: 'Shield',
    key: '/system',
    path: '/system',
    permission: 'system:read',
    title: '系统管理'
  },
  {
    icon: 'Info',
    key: '/about',
    path: '/about',
    permission: 'about:read',
    title: '关于'
  }
]

const overviewSummary: OverviewSummary = {
  healthItems: [
    { label: '路由记录', value: '8' },
    { label: 'Mock 接口', value: '8' },
    { label: '查询键', value: '8' }
  ],
  operationItems: [
    { label: '菜单路由', status: '已从 mock 加载' },
    { label: '工作台页面', status: '已接入' },
    { label: '用户数据', status: '已就绪' },
    { label: '角色数据', status: '已就绪' },
    { label: '部门数据', status: '已就绪' }
  ],
  stats: [
    { label: '活跃用户', trend: '+12.5%', value: '1,286' },
    { label: '角色组', trend: '+2', value: '8' },
    { label: '菜单节点', trend: '+5', value: '33' },
    { label: '部门数量', trend: '+1', value: '12' }
  ]
}

const workplaceSummary: WorkplaceSummary = {
  activities: [
    { action: '完成菜单管理权限复核', actor: '审计账号', time: '10:24' },
    { action: '同步部门组织明细', actor: '运营账号', time: '09:42' },
    { action: '刷新用户风险标签', actor: '超级管理员', time: '09:18' }
  ],
  metrics: [
    { label: '待审批', trend: '-4', value: '18' },
    { label: '路由缓存', trend: '+6', value: '14' },
    { label: '固定标签页', trend: '+2', value: '9' }
  ],
  tasks: [
    {
      assignee: '明',
      deadline: '今天 18:00',
      priority: '高',
      status: '处理中',
      title: '确认工作台数据接入'
    },
    {
      assignee: '青',
      deadline: '明天 12:00',
      priority: '中',
      status: '待开始',
      title: '补充运营账号风险说明'
    },
    {
      assignee: '林',
      deadline: '本周五',
      priority: '低',
      status: '排期中',
      title: '整理部门审计记录'
    }
  ]
}

const notifications: NotificationRecord[] = [
  {
    description: '工作台指标和系统管理数据均已完成刷新。',
    id: 'notice-system-health',
    status: 'unread',
    time: '10:30',
    title: '系统巡检完成',
    type: 'success'
  },
  {
    description: '角色、菜单、部门页面的读取权限已按最新 mock 数据同步。',
    id: 'notice-permission-sync',
    status: 'read',
    time: '09:50',
    title: '权限矩阵已同步',
    type: 'info'
  }
]

const users: UserRecord[] = [
  {
    department: '平台部',
    email: 'root@example.com',
    lastLogin: '2026-06-10 09:24',
    loginMethod: '密码 + MFA',
    name: '超级管理员',
    riskLevel: '低',
    role: '所有者',
    status: '启用'
  },
  {
    department: '运营部',
    email: 'ops@example.com',
    lastLogin: '2026-06-09 18:10',
    loginMethod: '企业微信',
    name: '运营账号',
    riskLevel: '中',
    role: '运营员',
    status: '启用'
  },
  {
    department: '风控部',
    email: 'audit@example.com',
    lastLogin: '2026-06-08 14:32',
    loginMethod: '密码',
    name: '审计账号',
    riskLevel: '高',
    role: '审计员',
    status: '复核中'
  }
]

const roles: RoleRecord[] = [
  {
    code: 'owner',
    dataScope: '全部数据',
    description: '拥有平台全部权限',
    memberCount: 3,
    name: '所有者',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:role:read',
      'system:menu:read',
      'system:department:read',
      'about:read'
    ],
    status: '启用'
  },
  {
    code: 'operator',
    dataScope: '本部门数据',
    description: '负责日常运营操作',
    memberCount: 16,
    name: '运营员',
    permissions: ['overview:read', 'workplace:read', 'system:user:read', 'system:department:read'],
    status: '启用'
  },
  {
    code: 'auditor',
    dataScope: '只读审计数据',
    description: '只读审计与复核权限',
    memberCount: 5,
    name: '审计员',
    permissions: ['overview:read', 'workplace:read', 'system:role:read', 'about:read'],
    status: '复核中'
  }
]

const menus: MenuManagementRecord[] = [
  {
    childrenCount: 0,
    component: 'OverviewPage',
    name: '概览',
    parentName: '-',
    path: '/overview',
    permission: 'overview:read',
    sort: 10,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'WorkplacePage',
    name: '工作台',
    parentName: '-',
    path: '/workplace',
    permission: 'workplace:read',
    sort: 20,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 4,
    component: 'LayoutRoute',
    name: '系统管理',
    parentName: '-',
    path: '/system',
    permission: 'system:read',
    sort: 30,
    status: '显示',
    type: '目录'
  },
  {
    childrenCount: 0,
    component: 'UsersPage',
    name: '用户管理',
    parentName: '系统管理',
    path: '/system/users',
    permission: 'system:user:read',
    sort: 31,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'RolesPage',
    name: '角色管理',
    parentName: '系统管理',
    path: '/system/roles',
    permission: 'system:role:read',
    sort: 32,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'MenusPage',
    name: '菜单管理',
    parentName: '系统管理',
    path: '/system/menus',
    permission: 'system:menu:read',
    sort: 33,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'DepartmentsPage',
    name: '部门管理',
    parentName: '系统管理',
    path: '/system/departments',
    permission: 'system:department:read',
    sort: 34,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'AboutPage',
    name: '关于',
    parentName: '-',
    path: '/about',
    permission: 'about:read',
    sort: 40,
    status: '显示',
    type: '菜单'
  }
]

const departments: DepartmentRecord[] = [
  {
    childrenCount: 0,
    code: 'dept-platform',
    description: '负责后台基础能力、权限体系和工程框架。',
    leader: '明',
    memberCount: 18,
    name: '平台部',
    parent: '-',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 1,
    code: 'dept-operations',
    description: '负责业务运营、用户增长和日常活动配置。',
    leader: '青',
    memberCount: 24,
    name: '运营部',
    parent: '-',
    projectCount: 8,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-risk',
    description: '负责风险复核、审计追踪和异常流程处置。',
    leader: '林',
    memberCount: 9,
    name: '风控部',
    parent: '运营部',
    projectCount: 3,
    status: '启用'
  }
]

// Mock API 保持和真实请求一致的 Promise + AbortSignal 形态，方便后续替换为 axios。
export const adminMockApi = {
  about: (signal?: AbortSignal) => delay(getProjectInfo(), signal),
  departments: (signal?: AbortSignal) => delay(departments, signal),
  menu: (signal?: AbortSignal) => delay(mockAdminMenu, signal),
  menus: (signal?: AbortSignal) => delay(menus, signal),
  notifications: (signal?: AbortSignal) => delay(notifications, signal),
  overview: (signal?: AbortSignal) => delay(overviewSummary, signal),
  roles: (signal?: AbortSignal) => delay(roles, signal),
  users: (signal?: AbortSignal) => delay(users, signal),
  workplace: (signal?: AbortSignal) => delay(workplaceSummary, signal)
}

// 函数：getProjectInfo。组装关于页展示的项目元信息。
function getProjectInfo(): ProjectInfo {
  return projectInfo
}

// 函数：delay。模拟网络延迟，并在 TanStack Query 取消查询时中止等待。
function delay<T>(value: T, signal?: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(() => resolve(value), MOCK_DELAY)

    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}
