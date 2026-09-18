import { useQuery } from '@tanstack/react-query'
import { useStore } from 'zustand'
import { Card, Tag } from '@douyinfe/semi-ui-19'

import { workplaceQueries } from '@/api/queries'
import { Page, PageSection } from '@/components/page'
import { getAdminMessages } from '@/i18n/admin-i18n'
import { preferenceStore } from '@/store/preferences'

/** 展示工作台任务、指标和活动流。 */
export default function WorkplacePage() {
  const locale = useStore(preferenceStore, state => state.preferences.appLocale)
  const messages = getAdminMessages(locale)
  const workplace = messages.pages.workplace
  const { data } = useQuery(workplaceQueries.summary())

  return (
    <Page title={workplace.title} description={workplace.description}>
      <PageSection contentClassName="grid gap-4 md:grid-cols-3">
        {(data?.metrics ?? workplace.items.map(label => ({ label, trend: '-', value: '0' }))).map(
          item => (
            <Card
              key={item.label}
              shadows="hover"
              title={
                <span className="text-xs text-muted-foreground font-normal">{item.label}</span>
              }
              headerExtraContent={
                <Tag color="blue" size="small">
                  {item.trend}
                </Tag>
              }
            >
              <div className="text-2xl font-bold mt-1">{item.value}</div>
            </Card>
          )
        )}
      </PageSection>
      <PageSection contentClassName="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          shadows="hover"
          title={workplace.title}
          headerExtraContent={
            <span className="text-xs text-muted-foreground">{workplace.description}</span>
          }
        >
          <div className="grid gap-3">
            {(data?.tasks ?? []).map(task => (
              <div
                className="flex flex-col gap-2 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
                key={task.title}
              >
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {task.assignee} / {task.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={task.priority === '高' ? 'red' : 'grey'} size="small">
                    {task.priority}
                  </Tag>
                  <Tag color="cyan" size="small">
                    {task.status}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          shadows="hover"
          title="活动流"
          headerExtraContent={
            <span className="text-xs text-muted-foreground">展示最近的操作动态</span>
          }
        >
          <div className="grid gap-3">
            {(data?.activities ?? []).map(activity => (
              <div
                className="rounded-lg border bg-background p-3"
                key={`${activity.actor}-${activity.time}`}
              >
                <div className="text-sm font-medium">{activity.action}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {activity.actor} / {activity.time}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageSection>
    </Page>
  )
}
