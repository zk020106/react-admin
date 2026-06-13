import { projectInfo } from 'virtual:admin-project-info'

import { HttpError } from '@/lib/http'
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
  account: string
  avatar?: string
  department: string
  email: string
  gender: '男' | '女'
  id: string
  lastLogin: string
  loginMethod: string
  name: string
  phone: string
  remark?: string
  riskLevel: '低' | '中' | '高'
  role: string
  status: string
}

/** 创建或更新用户时允许编辑的字段集合。 */
export interface UserInput {
  department: string
  email: string
  name: string
  riskLevel: UserRecord['riskLevel']
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
  type: '目录' | '菜单' | '按钮'
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
        badge: '36',
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
    icon: 'SlidersHorizontal',
    key: '/effects',
    path: '/effects',
    permission: 'effects:read',
    title: '组件示例'
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
    { label: '活跃用户', trend: '+26', value: '36' },
    { label: '角色组', trend: '+6', value: '9' },
    { label: '菜单节点', trend: '+14', value: '22' },
    { label: '部门数量', trend: '+33', value: '36' }
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
    account: 'zhaoyu',
    department: '权限平台组',
    email: 'zhaoyu@example.com',
    gender: '男',
    id: 'user-1',
    lastLogin: '2026-06-13 10:36:18',
    loginMethod: '密码 + MFA',
    name: '赵宇',
    phone: '13100131001',
    remark: 'Mock 数据：负责平台基础配置和账号权限复核。',
    riskLevel: '低',
    role: '平台管理员',
    status: '启用'
  },
  {
    account: 'shenyue',
    department: '活动运营组',
    email: 'shenyue@example.com',
    gender: '女',
    id: 'user-2',
    lastLogin: '2026-06-13 10:08:42',
    loginMethod: '企业微信',
    name: '沈悦',
    phone: '13100131002',
    remark: 'Mock 数据：运营活动配置和日常数据巡检。',
    riskLevel: '低',
    role: '运营员',
    status: '启用'
  },
  {
    account: 'hanqing',
    department: '研发一组',
    email: 'hanqing@example.com',
    gender: '男',
    id: 'user-3',
    lastLogin: '2026-06-13 09:54:27',
    loginMethod: '密码',
    name: '韩青',
    phone: '13100131003',
    remark: 'Mock 数据：前端页面联调和组件库维护。',
    riskLevel: '低',
    role: '前端工程师',
    status: '启用'
  },
  {
    account: 'yefan',
    department: '研发二组',
    email: 'yefan@example.com',
    gender: '男',
    id: 'user-4',
    lastLogin: '2026-06-13 09:31:05',
    loginMethod: 'LDAP',
    name: '叶帆',
    phone: '13100131004',
    remark: 'Mock 数据：接口权限和数据模型维护。',
    riskLevel: '低',
    role: '后端工程师',
    status: '启用'
  },
  {
    account: 'luwei',
    department: '测试部',
    email: 'luwei@example.com',
    gender: '女',
    id: 'user-5',
    lastLogin: '2026-06-13 09:12:44',
    loginMethod: '密码',
    name: '陆微',
    phone: '13100131005',
    remark: 'Mock 数据：负责回归用例和发布验收标注。',
    riskLevel: '中',
    role: '测试工程师',
    status: '启用'
  },
  {
    account: 'songjing',
    department: '增长产品组',
    email: 'songjing@example.com',
    gender: '女',
    id: 'user-6',
    lastLogin: '2026-06-13 08:45:39',
    loginMethod: '企业微信',
    name: '宋静',
    phone: '13100131006',
    remark: 'Mock 数据：需求验收账号，当前处于流程复核。',
    riskLevel: '低',
    role: '产品经理',
    status: '复核中'
  },
  {
    account: 'moyi',
    department: '指标分析组',
    email: 'moyi@example.com',
    gender: '男',
    id: 'user-7',
    lastLogin: '2026-06-12 20:16:11',
    loginMethod: '密码',
    name: '莫一',
    phone: '13100131007',
    remark: 'Mock 数据：指标口径校验和数据集权限验证。',
    riskLevel: '低',
    role: '数据分析师',
    status: '启用'
  },
  {
    account: 'kecheng',
    department: '交互设计组',
    email: 'kecheng@example.com',
    gender: '女',
    id: 'user-8',
    lastLogin: '2026-06-12 18:29:53',
    loginMethod: '企业微信',
    name: '柯澄',
    phone: '13100131008',
    remark: 'Mock 数据：设计系统验收和菜单视觉标注。',
    riskLevel: '低',
    role: '设计师',
    status: '启用'
  },
  {
    account: 'xiahe',
    department: '客服部',
    email: 'xiahe@example.com',
    gender: '女',
    id: 'user-9',
    lastLogin: '2026-06-12 16:05:21',
    loginMethod: '密码',
    name: '夏禾',
    phone: '13100131009',
    remark: 'Mock 数据：客服工单和知识库管理账号。',
    riskLevel: '低',
    role: '客服主管',
    status: '启用'
  },
  {
    account: 'qinlan',
    department: '安全审计组',
    email: 'qinlan@example.com',
    gender: '女',
    id: 'user-10',
    lastLogin: '2026-06-12 14:38:40',
    loginMethod: '密码 + MFA',
    name: '秦岚',
    phone: '13100131010',
    remark: 'Mock 数据：安全审计和敏感权限复核账号。',
    riskLevel: '高',
    role: '安全审计',
    status: '启用'
  },
  {
    account: 'chenxi',
    department: '基础架构组',
    email: 'chenxi@example.com',
    gender: '男',
    id: 'user-11',
    lastLogin: '2026-06-13 09:12:34',
    loginMethod: '密码 + MFA',
    name: '陈曦',
    phone: '13100131011',
    remark: 'Mock 数据：平台基础能力维护，负责权限模型联调。',
    riskLevel: '低',
    role: '平台管理员',
    status: '启用'
  },
  {
    account: 'linran',
    department: '风控部',
    email: 'linran@example.com',
    gender: '女',
    id: 'user-12',
    lastLogin: '2026-06-13 08:45:12',
    loginMethod: '企业微信',
    name: '林然',
    phone: '13100131012',
    remark: 'Mock 数据：审计抽检账号，保留中风险标记。',
    riskLevel: '中',
    role: '审计员',
    status: '启用'
  },
  {
    account: 'gaoyue',
    department: '活动运营组',
    email: 'gaoyue@example.com',
    gender: '女',
    id: 'user-13',
    lastLogin: '2026-06-12 21:18:07',
    loginMethod: '密码',
    name: '高月',
    phone: '13100131013',
    remark: 'Mock 数据：运营活动配置负责人。',
    riskLevel: '低',
    role: '运营员',
    status: '启用'
  },
  {
    account: 'zhouxun',
    department: '研发二组',
    email: 'zhouxun@example.com',
    gender: '男',
    id: 'user-14',
    lastLogin: '2026-06-12 19:05:44',
    loginMethod: '密码 + MFA',
    name: '周寻',
    phone: '13100131014',
    remark: 'Mock 数据：负责菜单管理页面联调。',
    riskLevel: '低',
    role: '前端工程师',
    status: '启用'
  },
  {
    account: 'qiaonan',
    department: '测试部',
    email: 'qiaonan@example.com',
    gender: '女',
    id: 'user-15',
    lastLogin: '2026-06-12 17:32:58',
    loginMethod: '密码',
    name: '乔楠',
    phone: '13100131015',
    remark: 'Mock 数据：负责回归测试用例维护。',
    riskLevel: '低',
    role: '测试工程师',
    status: '启用'
  },
  {
    account: 'wukai',
    department: 'SRE组',
    email: 'wukai@example.com',
    gender: '男',
    id: 'user-16',
    lastLogin: '2026-06-12 16:26:10',
    loginMethod: 'LDAP',
    name: '吴凯',
    phone: '13100131016',
    remark: 'Mock 数据：生产发布窗口值班账号。',
    riskLevel: '中',
    role: '运维工程师',
    status: '启用'
  },
  {
    account: 'suli',
    department: '后台产品组',
    email: 'suli@example.com',
    gender: '女',
    id: 'user-17',
    lastLogin: '2026-06-11 14:44:19',
    loginMethod: '企业微信',
    name: '苏黎',
    phone: '13100131017',
    remark: 'Mock 数据：需求验收与权限场景标注。',
    riskLevel: '低',
    role: '产品经理',
    status: '启用'
  },
  {
    account: 'xiecheng',
    department: '数据开发组',
    email: 'xiecheng@example.com',
    gender: '男',
    id: 'user-18',
    lastLogin: '2026-06-11 11:22:31',
    loginMethod: '密码',
    name: '谢承',
    phone: '13100131018',
    remark: 'Mock 数据：数据看板权限验证。',
    riskLevel: '低',
    role: '数据分析师',
    status: '启用'
  },
  {
    account: 'fuyan',
    department: '知识库组',
    email: 'fuyan@example.com',
    gender: '女',
    id: 'user-19',
    lastLogin: '2026-06-10 18:40:02',
    loginMethod: '密码',
    name: '傅妍',
    phone: '13100131019',
    remark: 'Mock 数据：客服工单查看权限。',
    riskLevel: '低',
    role: '客服主管',
    status: '启用'
  },
  {
    account: 'tangyu',
    department: '合规复核组',
    email: 'tangyu@example.com',
    gender: '男',
    id: 'user-20',
    lastLogin: '2026-06-10 10:16:55',
    loginMethod: '密码 + MFA',
    name: '唐禹',
    phone: '13100131020',
    remark: 'Mock 数据：高敏操作复核账号。',
    riskLevel: '高',
    role: '安全管理员',
    status: '复核中'
  },
  {
    account: 'heqing',
    department: '研发一组',
    email: 'heqing@example.com',
    gender: '女',
    id: 'user-21',
    lastLogin: '2026-06-09 20:11:33',
    loginMethod: '密码',
    name: '何青',
    phone: '13100131021',
    remark: 'Mock 数据：接口联调用户。',
    riskLevel: '低',
    role: '后端工程师',
    status: '启用'
  },
  {
    account: 'liangbo',
    department: '研发二组',
    email: 'liangbo@example.com',
    gender: '男',
    id: 'user-22',
    lastLogin: '2026-06-09 18:09:21',
    loginMethod: 'LDAP',
    name: '梁博',
    phone: '13100131022',
    remark: 'Mock 数据：模块负责人。',
    riskLevel: '低',
    role: '技术负责人',
    status: '启用'
  },
  {
    account: 'mengya',
    department: '视觉设计组',
    email: 'mengya@example.com',
    gender: '女',
    id: 'user-23',
    lastLogin: '2026-06-09 13:48:50',
    loginMethod: '企业微信',
    name: '孟雅',
    phone: '13100131023',
    remark: 'Mock 数据：设计验收账号。',
    riskLevel: '低',
    role: '设计师',
    status: '启用'
  },
  {
    account: 'yankai',
    department: '发布管理组',
    email: 'yankai@example.com',
    gender: '男',
    id: 'user-24',
    lastLogin: '2026-06-08 22:05:18',
    loginMethod: '密码 + MFA',
    name: '严恺',
    phone: '13100131024',
    remark: 'Mock 数据：夜间值班账号，登录频率较高。',
    riskLevel: '中',
    role: '运维工程师',
    status: '启用'
  },
  {
    account: 'baizhi',
    department: '市场部',
    email: 'baizhi@example.com',
    gender: '女',
    id: 'user-25',
    lastLogin: '2026-06-08 15:27:43',
    loginMethod: '密码',
    name: '白芷',
    phone: '13100131025',
    remark: 'Mock 数据：活动素材查看权限。',
    riskLevel: '低',
    role: '市场专员',
    status: '启用'
  },
  {
    account: 'caiyuan',
    department: '预算组',
    email: 'caiyuan@example.com',
    gender: '男',
    id: 'user-26',
    lastLogin: '2026-06-07 16:12:19',
    loginMethod: '密码 + MFA',
    name: '蔡远',
    phone: '13100131026',
    remark: 'Mock 数据：财务报表只读权限。',
    riskLevel: '中',
    role: '财务主管',
    status: '启用'
  },
  {
    account: 'denglu',
    department: '招聘组',
    email: 'denglu@example.com',
    gender: '女',
    id: 'user-27',
    lastLogin: '2026-06-07 09:37:04',
    loginMethod: '企业微信',
    name: '邓露',
    phone: '13100131027',
    remark: 'Mock 数据：组织架构维护。',
    riskLevel: '低',
    role: 'HRBP',
    status: '启用'
  },
  {
    account: 'fanxing',
    department: '数据开发组',
    email: 'fanxing@example.com',
    gender: '男',
    id: 'user-28',
    lastLogin: '2026-06-06 23:50:11',
    loginMethod: '密码',
    name: '樊星',
    phone: '13100131028',
    remark: 'Mock 数据：离线任务配置权限。',
    riskLevel: '低',
    role: '数据工程师',
    status: '启用'
  },
  {
    account: 'guxin',
    department: '安全审计组',
    email: 'guxin@example.com',
    gender: '女',
    id: 'user-29',
    lastLogin: '2026-06-06 12:30:44',
    loginMethod: '密码 + MFA',
    name: '顾昕',
    phone: '13100131029',
    remark: 'Mock 数据：安全巡检账号，暂时停用。',
    riskLevel: '高',
    role: '安全审计',
    status: '停用'
  },
  {
    account: 'huiming',
    department: '工单服务组',
    email: 'huiming@example.com',
    gender: '男',
    id: 'user-30',
    lastLogin: '2026-06-05 19:14:27',
    loginMethod: '密码',
    name: '惠明',
    phone: '13100131030',
    remark: 'Mock 数据：客服知识库维护。',
    riskLevel: '低',
    role: '客服专员',
    status: '启用'
  },
  {
    account: 'jiangnan',
    department: '后台产品组',
    email: 'jiangnan@example.com',
    gender: '女',
    id: 'user-31',
    lastLogin: '2026-06-05 10:08:39',
    loginMethod: '企业微信',
    name: '江南',
    phone: '13100131031',
    remark: 'Mock 数据：菜单信息架构梳理。',
    riskLevel: '低',
    role: '产品经理',
    status: '启用'
  },
  {
    account: 'kongling',
    department: '市场部',
    email: 'kongling@example.com',
    gender: '男',
    id: 'user-32',
    lastLogin: '2026-06-04 20:22:06',
    loginMethod: '密码',
    name: '孔令',
    phone: '13100131032',
    remark: 'Mock 数据：推广页面素材权限。',
    riskLevel: '低',
    role: '市场运营',
    status: '启用'
  },
  {
    account: 'luyun',
    department: '测试部',
    email: 'luyun@example.com',
    gender: '女',
    id: 'user-33',
    lastLogin: '2026-06-04 15:49:53',
    loginMethod: '密码',
    name: '陆云',
    phone: '13100131033',
    remark: 'Mock 数据：自动化测试维护。',
    riskLevel: '低',
    role: '测试工程师',
    status: '启用'
  },
  {
    account: 'maosen',
    department: '结算组',
    email: 'maosen@example.com',
    gender: '男',
    id: 'user-34',
    lastLogin: '2026-06-03 18:18:18',
    loginMethod: '密码 + MFA',
    name: '茂森',
    phone: '13100131034',
    remark: 'Mock 数据：预算审批查看账号。',
    riskLevel: '中',
    role: '财务专员',
    status: '复核中'
  },
  {
    account: 'ningwei',
    department: '组织发展组',
    email: 'ningwei@example.com',
    gender: '女',
    id: 'user-35',
    lastLogin: '2026-06-02 11:05:45',
    loginMethod: '企业微信',
    name: '宁微',
    phone: '13100131035',
    remark: 'Mock 数据：入离职流程管理员。',
    riskLevel: '低',
    role: '人事专员',
    status: '启用'
  },
  {
    account: 'ouyang',
    department: '权限平台组',
    email: 'ouyang@example.com',
    gender: '男',
    id: 'user-36',
    lastLogin: '2026-06-01 08:30:00',
    loginMethod: '密码 + MFA',
    name: '超级管理员',
    phone: '13100131036',
    remark: 'Mock 数据：超级管理员候选账号。',
    riskLevel: '高',
    role: '超级管理员',
    status: '停用'
  }
]

// 可变用户列表：mock 写接口在内存中维护，刷新页面即复位。
let mutableUsers = [...users]
let userIdSeed = 0

// 函数：resetMockUsers。恢复用户 mock 数据到初始状态，测试隔离时调用。
export function resetMockUsers() {
  mutableUsers = [...users]
  userIdSeed = 0
}

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
      'system:user:create',
      'system:user:update',
      'system:user:delete',
      'system:user:import',
      'system:role:read',
      'system:role:create',
      'system:role:update',
      'system:role:delete',
      'system:role:permission',
      'system:menu:read',
      'system:menu:create',
      'system:menu:update',
      'system:menu:delete',
      'system:menu:cache',
      'system:department:read',
      'system:department:create',
      'system:department:update',
      'system:department:delete',
      'system:department:export',
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
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:user:create',
      'system:user:update',
      'system:department:read',
      'system:department:export'
    ],
    status: '启用'
  },
  {
    code: 'auditor',
    dataScope: '只读审计数据',
    description: '只读审计与复核权限',
    memberCount: 5,
    name: '审计员',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:role:read',
      'system:menu:read',
      'system:permission:read',
      'system:permission:review',
      'about:read'
    ],
    status: '复核中'
  },
  {
    code: 'platform-admin',
    dataScope: '全部数据',
    description: '负责平台基础配置、账号权限复核和菜单维护',
    memberCount: 2,
    name: '平台管理员',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:user:create',
      'system:user:update',
      'system:role:read',
      'system:role:permission',
      'system:menu:read',
      'system:menu:update',
      'system:menu:cache',
      'system:department:read',
      'system:department:update',
      'about:read'
    ],
    status: '启用'
  },
  {
    code: 'super-admin',
    dataScope: '全部数据',
    description: '超级管理员候选角色，默认停用用于高敏权限复核',
    memberCount: 1,
    name: '超级管理员',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:user:create',
      'system:user:update',
      'system:user:delete',
      'system:user:import',
      'system:role:read',
      'system:role:create',
      'system:role:update',
      'system:role:delete',
      'system:role:permission',
      'system:menu:read',
      'system:menu:create',
      'system:menu:update',
      'system:menu:delete',
      'system:menu:cache',
      'system:department:read',
      'system:department:create',
      'system:department:update',
      'system:department:delete',
      'system:department:export',
      'about:read'
    ],
    status: '停用'
  },
  {
    code: 'security-admin',
    dataScope: '安全与合规数据',
    description: '负责敏感权限、审计策略和高风险操作复核',
    memberCount: 1,
    name: '安全管理员',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:role:read',
      'system:role:permission',
      'system:menu:read',
      'system:department:read',
      'about:read'
    ],
    status: '启用'
  },
  {
    code: 'product-manager',
    dataScope: '本部门及项目数据',
    description: '负责需求验收、流程配置和运营看板查看',
    memberCount: 3,
    name: '产品经理',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:user:read',
      'system:department:read',
      'operations:read',
      'operations:campaign:read',
      'operations:banner:read',
      'operations:message:read'
    ],
    status: '启用'
  },
  {
    code: 'data-analyst',
    dataScope: '数据中心只读',
    description: '负责指标看板、数据集和导出任务查看',
    memberCount: 2,
    name: '数据分析师',
    permissions: [
      'overview:read',
      'workplace:read',
      'data:read',
      'data:dashboard:read',
      'data:dataset:read',
      'data:export:read',
      'system:user:read'
    ],
    status: '启用'
  },
  {
    code: 'sre',
    dataScope: '运维发布数据',
    description: '负责发布窗口、环境运行和基础资源巡检',
    memberCount: 2,
    name: '运维工程师',
    permissions: [
      'overview:read',
      'workplace:read',
      'system:menu:read',
      'system:department:read',
      'operations:read',
      'data:dashboard:read'
    ],
    status: '启用'
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
    childrenCount: 5,
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
    childrenCount: 4,
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
    component: 'UserCreateButton',
    name: '新增用户',
    parentName: '用户管理',
    path: '',
    permission: 'system:user:create',
    sort: 311,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'UserUpdateButton',
    name: '修改用户',
    parentName: '用户管理',
    path: '',
    permission: 'system:user:update',
    sort: 312,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'UserDeleteButton',
    name: '删除用户',
    parentName: '用户管理',
    path: '',
    permission: 'system:user:delete',
    sort: 313,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'UserImportButton',
    name: '导入用户',
    parentName: '用户管理',
    path: '',
    permission: 'system:user:import',
    sort: 314,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 4,
    component: 'LayoutRoute',
    name: '权限中心',
    parentName: '系统管理',
    path: '/system/permissions',
    permission: 'system:permission:read',
    sort: 35,
    status: '显示',
    type: '目录'
  },
  {
    childrenCount: 0,
    component: 'PermissionMatrixPage',
    name: '权限矩阵',
    parentName: '权限中心',
    path: '/system/permissions/matrix',
    permission: 'system:permission:matrix',
    sort: 36,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'DataScopePage',
    name: '数据范围',
    parentName: '权限中心',
    path: '/system/permissions/data-scope',
    permission: 'system:permission:data-scope',
    sort: 37,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'AuditPolicyPage',
    name: '审计策略',
    parentName: '权限中心',
    path: '/system/permissions/audit-policy',
    permission: 'system:permission:audit',
    sort: 38,
    status: '隐藏',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'AccessReviewPage',
    name: '访问复核',
    parentName: '权限中心',
    path: '/system/permissions/review',
    permission: 'system:permission:review',
    sort: 39,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 4,
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
    component: 'RoleCreateButton',
    name: '新增角色',
    parentName: '角色管理',
    path: '',
    permission: 'system:role:create',
    sort: 321,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'RoleUpdateButton',
    name: '修改角色',
    parentName: '角色管理',
    path: '',
    permission: 'system:role:update',
    sort: 322,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'RoleDeleteButton',
    name: '删除角色',
    parentName: '角色管理',
    path: '',
    permission: 'system:role:delete',
    sort: 323,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'RolePermissionButton',
    name: '分配权限',
    parentName: '角色管理',
    path: '',
    permission: 'system:role:permission',
    sort: 324,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 4,
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
    component: 'MenuCreateButton',
    name: '新增菜单',
    parentName: '菜单管理',
    path: '',
    permission: 'system:menu:create',
    sort: 331,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'MenuUpdateButton',
    name: '修改菜单',
    parentName: '菜单管理',
    path: '',
    permission: 'system:menu:update',
    sort: 332,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'MenuDeleteButton',
    name: '删除菜单',
    parentName: '菜单管理',
    path: '',
    permission: 'system:menu:delete',
    sort: 333,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'MenuCacheButton',
    name: '清除缓存',
    parentName: '菜单管理',
    path: '',
    permission: 'system:menu:cache',
    sort: 334,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 4,
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
    component: 'DepartmentCreateButton',
    name: '新增部门',
    parentName: '部门管理',
    path: '',
    permission: 'system:department:create',
    sort: 341,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'DepartmentUpdateButton',
    name: '修改部门',
    parentName: '部门管理',
    path: '',
    permission: 'system:department:update',
    sort: 342,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'DepartmentDeleteButton',
    name: '删除部门',
    parentName: '部门管理',
    path: '',
    permission: 'system:department:delete',
    sort: 343,
    status: '显示',
    type: '按钮'
  },
  {
    childrenCount: 0,
    component: 'DepartmentExportButton',
    name: '导出部门',
    parentName: '部门管理',
    path: '',
    permission: 'system:department:export',
    sort: 344,
    status: '显示',
    type: '按钮'
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
  },
  {
    childrenCount: 4,
    component: 'LayoutRoute',
    name: '运营管理',
    parentName: '-',
    path: '/operations',
    permission: 'operations:read',
    sort: 50,
    status: '显示',
    type: '目录'
  },
  {
    childrenCount: 0,
    component: 'CampaignPage',
    name: '活动配置',
    parentName: '运营管理',
    path: '/operations/campaigns',
    permission: 'operations:campaign:read',
    sort: 51,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'BannerPage',
    name: 'Banner 管理',
    parentName: '运营管理',
    path: '/operations/banners',
    permission: 'operations:banner:read',
    sort: 52,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'MessageTemplatePage',
    name: '消息模板',
    parentName: '运营管理',
    path: '/operations/messages',
    permission: 'operations:message:read',
    sort: 53,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'GrowthPage',
    name: '增长看板',
    parentName: '运营管理',
    path: '/operations/growth',
    permission: 'operations:growth:read',
    sort: 54,
    status: '隐藏',
    type: '菜单'
  },
  {
    childrenCount: 3,
    component: 'LayoutRoute',
    name: '数据中心',
    parentName: '-',
    path: '/data',
    permission: 'data:read',
    sort: 60,
    status: '显示',
    type: '目录'
  },
  {
    childrenCount: 0,
    component: 'DashboardPage',
    name: '指标看板',
    parentName: '数据中心',
    path: '/data/dashboards',
    permission: 'data:dashboard:read',
    sort: 61,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'DatasetPage',
    name: '数据集',
    parentName: '数据中心',
    path: '/data/datasets',
    permission: 'data:dataset:read',
    sort: 62,
    status: '显示',
    type: '菜单'
  },
  {
    childrenCount: 0,
    component: 'ExportTaskPage',
    name: '导出任务',
    parentName: '数据中心',
    path: '/data/exports',
    permission: 'data:export:read',
    sort: 63,
    status: '隐藏',
    type: '菜单'
  }
]

const departments: DepartmentRecord[] = [
  {
    childrenCount: 2,
    code: 'dept-platform',
    description: '负责后台基础能力、权限体系和工程框架。',
    leader: '明',
    memberCount: 26,
    name: '平台部',
    parent: '-',
    projectCount: 7,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-platform-auth',
    description: 'Mock 部门：负责账号、角色、权限矩阵和菜单授权能力。',
    leader: '赵宇',
    memberCount: 12,
    name: '权限平台组',
    parent: '平台部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-platform-infra',
    description: 'Mock 部门：负责脚手架、工程框架、公共组件和构建链路。',
    leader: '陈曦',
    memberCount: 14,
    name: '基础架构组',
    parent: '平台部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 4,
    code: 'dept-operations',
    description: '负责业务运营、用户增长和日常活动配置。',
    leader: '青',
    memberCount: 50,
    name: '运营部',
    parent: '-',
    projectCount: 13,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-operations-activity',
    description: 'Mock 部门：负责运营活动配置、日常数据巡检和策略标注。',
    leader: '沈悦',
    memberCount: 10,
    name: '活动运营组',
    parent: '运营部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 1,
    code: 'dept-risk',
    description: '负责风险复核、审计追踪和异常流程处置。',
    leader: '林',
    memberCount: 9,
    name: '风控部',
    parent: '运营部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-risk-review',
    description: 'Mock 部门：负责高风险账号、异常登录和敏感操作二次复核。',
    leader: '林然',
    memberCount: 4,
    name: '异常复核组',
    parent: '风控部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-market',
    description: 'Mock 部门：负责市场活动、投放素材和增长实验。',
    leader: '白芷',
    memberCount: 15,
    name: '市场部',
    parent: '运营部',
    projectCount: 8,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-service',
    description: 'Mock 部门：负责客服工单、知识库和服务质量追踪。',
    leader: '傅妍',
    memberCount: 22,
    name: '客服部',
    parent: '运营部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-service-ticket',
    description: 'Mock 部门：负责客服工单分派、处理时效和服务质量追踪。',
    leader: '夏禾',
    memberCount: 12,
    name: '工单服务组',
    parent: '客服部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-service-knowledge',
    description: 'Mock 部门：负责知识库维护、常见问题整理和客服素材审核。',
    leader: '惠明',
    memberCount: 10,
    name: '知识库组',
    parent: '客服部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 3,
    code: 'dept-rd',
    description: 'Mock 部门：负责核心产品研发、工程质量和版本交付。',
    leader: '周寻',
    memberCount: 42,
    name: '研发部',
    parent: '-',
    projectCount: 12,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-rd-fe',
    description: 'Mock 部门：前端体验、组件库和管理端页面交付。',
    leader: '梁博',
    memberCount: 16,
    name: '研发一组',
    parent: '研发部',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-rd-be',
    description: 'Mock 部门：服务端接口、鉴权链路和数据模型维护。',
    leader: '何青',
    memberCount: 18,
    name: '研发二组',
    parent: '研发部',
    projectCount: 6,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-rd-qa',
    description: 'Mock 部门：测试计划、自动化回归和发布验收。',
    leader: '乔楠',
    memberCount: 8,
    name: '测试部',
    parent: '研发部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-ui',
    description: 'Mock 部门：负责设计系统、交互规范和视觉验收。',
    leader: '孟雅',
    memberCount: 11,
    name: 'UI部',
    parent: '-',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-ui-interaction',
    description: 'Mock 部门：负责管理端交互流程、可用性验收和原型标注。',
    leader: '柯澄',
    memberCount: 5,
    name: '交互设计组',
    parent: 'UI部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-ui-visual',
    description: 'Mock 部门：负责视觉规范、图标资产和页面走查。',
    leader: '孟雅',
    memberCount: 6,
    name: '视觉设计组',
    parent: 'UI部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-sre',
    description: 'Mock 部门：负责环境部署、监控告警和发布窗口。',
    leader: '吴凯',
    memberCount: 17,
    name: '运维部',
    parent: '-',
    projectCount: 8,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-sre-runtime',
    description: 'Mock 部门：负责运行时监控、容量巡检和故障应急。',
    leader: '吴凯',
    memberCount: 9,
    name: 'SRE组',
    parent: '运维部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-sre-release',
    description: 'Mock 部门：负责发布计划、变更窗口和上线复盘。',
    leader: '严恺',
    memberCount: 8,
    name: '发布管理组',
    parent: '运维部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-product',
    description: 'Mock 部门：负责需求规划、验收标准和业务流程设计。',
    leader: '苏黎',
    memberCount: 14,
    name: '产品部',
    parent: '-',
    projectCount: 9,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-product-growth',
    description: 'Mock 部门：负责增长实验、活动流程和转化数据标注。',
    leader: '宋静',
    memberCount: 6,
    name: '增长产品组',
    parent: '产品部',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-product-admin',
    description: 'Mock 部门：负责后台信息架构、权限场景和审批链路。',
    leader: '江南',
    memberCount: 8,
    name: '后台产品组',
    parent: '产品部',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-data',
    description: 'Mock 部门：负责指标口径、离线任务和数据权限。',
    leader: '谢承',
    memberCount: 19,
    name: '数据部',
    parent: '-',
    projectCount: 11,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-data-engineering',
    description: 'Mock 部门：负责离线任务、数据集同步和数据权限配置。',
    leader: '樊星',
    memberCount: 10,
    name: '数据开发组',
    parent: '数据部',
    projectCount: 6,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-data-analysis',
    description: 'Mock 部门：负责指标分析、看板校验和口径文档维护。',
    leader: '谢承',
    memberCount: 9,
    name: '指标分析组',
    parent: '数据部',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-security',
    description: 'Mock 部门：负责安全审计、敏感权限复核和巡检。',
    leader: '唐禹',
    memberCount: 12,
    name: '安全部',
    parent: '-',
    projectCount: 6,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-security-audit',
    description: 'Mock 部门：负责权限巡检、操作审计和安全策略复核。',
    leader: '秦岚',
    memberCount: 6,
    name: '安全审计组',
    parent: '安全部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-security-compliance',
    description: 'Mock 部门：负责合规检查、敏感数据复核和例外流程归档。',
    leader: '顾昕',
    memberCount: 6,
    name: '合规复核组',
    parent: '安全部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-finance',
    description: 'Mock 部门：负责预算、报表和审批数据复核。',
    leader: '蔡远',
    memberCount: 15,
    name: '财务部',
    parent: '-',
    projectCount: 5,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-finance-budget',
    description: 'Mock 部门：负责预算审批、费用归集和成本结构复核。',
    leader: '蔡远',
    memberCount: 8,
    name: '预算组',
    parent: '财务部',
    projectCount: 3,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-finance-settlement',
    description: 'Mock 部门：负责结算数据、账单核验和报表归档。',
    leader: '茂森',
    memberCount: 7,
    name: '结算组',
    parent: '财务部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 2,
    code: 'dept-hr',
    description: 'Mock 部门：负责组织架构、人员档案和入离职流程。',
    leader: '邓露',
    memberCount: 13,
    name: '人事部',
    parent: '-',
    projectCount: 4,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-hr-recruiting',
    description: 'Mock 部门：负责招聘流程、候选人档案和面试排期。',
    leader: '邓露',
    memberCount: 7,
    name: '招聘组',
    parent: '人事部',
    projectCount: 2,
    status: '启用'
  },
  {
    childrenCount: 0,
    code: 'dept-hr-organization',
    description: 'Mock 部门：负责组织发展、岗位档案和入离职流程优化。',
    leader: '宁微',
    memberCount: 6,
    name: '组织发展组',
    parent: '人事部',
    projectCount: 2,
    status: '停用'
  }
]

// Mock API 保持和真实请求一致的 Promise + AbortSignal 形态，方便后续替换为 axios。
export const adminMockApi = {
  about: (signal?: AbortSignal) => delay(getProjectInfo(), signal),
  createUser: (input: UserInput) => {
    userIdSeed += 1
    const record: UserRecord = {
      account: `user${userIdSeed}`,
      department: input.department,
      email: input.email,
      gender: '男',
      id: `user-created-${userIdSeed}`,
      lastLogin: '尚未登录',
      loginMethod: '密码',
      name: input.name,
      phone: '',
      riskLevel: input.riskLevel,
      role: input.role,
      status: input.status
    }

    mutableUsers = [record, ...mutableUsers]
    return delay(record)
  },
  deleteUser: (id: string) => {
    mutableUsers = mutableUsers.filter(user => user.id !== id)
    return delay(undefined)
  },
  departments: (signal?: AbortSignal) => delay(departments, signal),
  menu: (signal?: AbortSignal) => delay(mockAdminMenu, signal),
  menus: (signal?: AbortSignal) => delay(menus, signal),
  notifications: (signal?: AbortSignal) => delay(notifications, signal),
  overview: (signal?: AbortSignal) => delay(overviewSummary, signal),
  roles: (signal?: AbortSignal) => delay(roles, signal),
  updateUser: (id: string, input: UserInput) => {
    mutableUsers = mutableUsers.map(user => (user.id === id ? { ...user, ...input } : user))
    const updated = mutableUsers.find(user => user.id === id)

    if (!updated) {
      return Promise.reject(new HttpError({ code: 404, message: '用户不存在', status: 404 }))
    }

    return delay(updated)
  },
  users: (signal?: AbortSignal) => delay(mutableUsers, signal),
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
