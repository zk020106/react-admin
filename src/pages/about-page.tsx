import { useQuery } from '@tanstack/react-query'
import { Card, Tag } from '@douyinfe/semi-ui-19'

import { Page, PageSection } from '@/components/page'
import { aboutQueries } from '@/api/queries'

/** 展示项目基本信息和 workspace 依赖版本。 */
export default function AboutPage() {
  const { data } = useQuery(aboutQueries.project())
  const description = data?.description ?? '展示当前项目的基础信息和 workspace 依赖版本。'

  return (
    <Page title="关于项目" description={description}>
      <PageSection>
        <Card title="基本信息" shadows="hover">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 py-2">
            {(data?.meta ?? []).map(item => (
              <div className="rounded-lg border bg-background/50 p-4" key={item.label}>
                <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
                {item.href && item.value !== '-' ? (
                  <a
                    className="mt-2 block break-all text-sm text-primary hover:underline font-medium"
                    href={item.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.value || '点击查看'}
                  </a>
                ) : (
                  <div className="mt-2 break-all text-sm font-semibold">{item.value}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </PageSection>
      {(data?.dependencyGroups ?? []).map(group => (
        <PageSection key={group.type}>
          <Card
            title={group.title}
            shadows="hover"
            headerExtraContent={
              <span className="text-xs text-muted-foreground">{group.description}</span>
            }
          >
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 py-2">
              {group.dependencies.map(dependency => (
                <div
                  className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2.5"
                  key={dependency.name}
                >
                  <span className="truncate text-xs font-medium mr-2">{dependency.name}</span>
                  <Tag color="blue" size="small">
                    {dependency.version}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        </PageSection>
      ))}
    </Page>
  )
}
