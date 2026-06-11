import { useNavigate } from '@tanstack/react-router'

import { ADMIN_DEFAULT_PATH } from '@/router/app-data'
import { Button } from '@/components/ui/button'

/** 渲染后台 404 页面，提示路径不存在并提供回首页入口。 */
export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="grid place-items-center gap-4 py-24 text-center" data-slot="not-found-page">
      <div className="text-6xl font-semibold text-muted-foreground">404</div>
      <p className="text-sm text-muted-foreground">页面不存在或已被移除。</p>
      <Button onClick={() => void navigate({ replace: true, to: ADMIN_DEFAULT_PATH })}>
        返回首页
      </Button>
    </div>
  )
}
