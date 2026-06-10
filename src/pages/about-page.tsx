import { useQuery } from '@tanstack/react-query'

import { Page, PageSection } from '@/components/page'
import { aboutQueries } from '@/pages/admin-queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// 组件：AboutPage。展示项目基本信息和 workspace 依赖版本。
export default function AboutPage() {
  const { data } = useQuery(aboutQueries.project())
  const description = data?.description ?? '展示当前项目的基础信息和 workspace 依赖版本。'

  return (
    <Page title="关于项目" description={description}>
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 xl:grid-cols-4">
            {(data?.meta ?? []).map(item => (
              <div className="border-t px-4 py-5" key={item.label}>
                <div className="text-sm font-medium">{item.label}</div>
                {item.href && item.value !== '-' ? (
                  <a
                    className="mt-3 block break-all text-sm text-primary hover:underline"
                    href={item.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    点击查看
                  </a>
                ) : (
                  <div className="mt-3 break-all text-sm text-muted-foreground">{item.value}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </PageSection>
      {(data?.dependencyGroups ?? []).map(group => (
        <PageSection key={group.type}>
          <Card>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 xl:grid-cols-4">
              {group.dependencies.map(dependency => (
                <div className="border-t px-4 py-4" key={dependency.name}>
                  <div className="break-all text-sm font-medium">{dependency.name}</div>
                  <div className="mt-2 break-all text-sm text-muted-foreground">
                    {dependency.version}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </PageSection>
      ))}
    </Page>
  )
}
