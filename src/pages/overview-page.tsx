import { useQuery } from '@tanstack/react-query'

import { overviewQueries } from '@/pages/admin-queries'
import { Page, PageSection } from '@/components/page'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// 组件：OverviewPage。作为系统首页展示 mock 概览数据。
export default function OverviewPage() {
  const { data, isLoading } = useQuery(overviewQueries.summary())

  return (
    <Page title="概览" description="展示系统关键指标、运行状态和 mock 数据集。">
      <PageSection contentClassName="grid gap-4 lg:grid-cols-4">
        {(data?.stats ?? Array.from({ length: 4 })).map((item, index) => (
          <Card key={item ? item.label : index}>
            <CardHeader>
              <CardDescription>
                {item ? item.label : <Skeleton className="h-4 w-20" />}
              </CardDescription>
              <CardTitle>
                {item && !isLoading ? item.value : <Skeleton className="h-6 w-24" />}
              </CardTitle>
              <CardAction>
                {item ? (
                  <Badge variant="outline">{item.trend}</Badge>
                ) : (
                  <Skeleton className="h-5 w-12" />
                )}
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </PageSection>
      <PageSection contentClassName="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>运行概览</CardTitle>
            <CardDescription>通过 TanStack Query 请求 mock 数据并渲染首页状态。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {(data?.healthItems ?? []).map(item => (
                <div className="rounded-lg border bg-background p-3" key={item.label}>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>数据状态</CardTitle>
            <CardDescription>当前 mock 模块暴露的核心数据集。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(data?.operationItems ?? []).map(item => (
              <div
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                key={item.label}
              >
                <span>{item.label}</span>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageSection>
    </Page>
  )
}
