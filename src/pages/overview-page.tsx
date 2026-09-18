import { useQuery } from '@tanstack/react-query'
import { Card, Skeleton, Tag } from '@douyinfe/semi-ui-19'

import { overviewQueries } from '@/api/queries'
import { Page, PageSection } from '@/components/page'

/** 作为系统首页展示 mock 概览数据。 */
export default function OverviewPage() {
  const { data, isLoading } = useQuery(overviewQueries.summary())

  return (
    <Page title="概览" description="展示系统关键指标、运行状态和 mock 数据集。">
      <PageSection contentClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.stats ?? Array.from({ length: 4 })).map((item, index) => (
          <Card
            key={item ? item.label : index}
            shadows="hover"
            headerExtraContent={
              item ? (
                <Tag color="cyan" size="small">
                  {item.trend}
                </Tag>
              ) : (
                <Skeleton.Title style={{ width: 48, height: 20 }} />
              )
            }
            title={
              item ? (
                <span className="text-xs text-muted-foreground font-normal">{item.label}</span>
              ) : (
                <Skeleton.Title style={{ width: 80, height: 16 }} />
              )
            }
          >
            <div className="text-2xl font-bold mt-1">
              {item && !isLoading ? (
                item.value
              ) : (
                <Skeleton.Title style={{ width: 100, height: 28 }} />
              )}
            </div>
          </Card>
        ))}
      </PageSection>
      <PageSection contentClassName="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card
          shadows="hover"
          title="运行概览"
          headerExtraContent={
            <span className="text-xs text-muted-foreground">
              通过 TanStack Query 请求 mock 数据并渲染首页状态
            </span>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {(data?.healthItems ?? []).map(item => (
              <div className="rounded-lg border bg-background p-3" key={item.label}>
                <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          shadows="hover"
          title="数据状态"
          headerExtraContent={
            <span className="text-xs text-muted-foreground">当前 mock 模块暴露的核心数据集</span>
          }
        >
          <div className="grid gap-2">
            {(data?.operationItems ?? []).map(item => (
              <div
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                key={item.label}
              >
                <span>{item.label}</span>
                <Tag color="green" size="small">
                  {item.status}
                </Tag>
              </div>
            ))}
          </div>
        </Card>
      </PageSection>
    </Page>
  )
}
