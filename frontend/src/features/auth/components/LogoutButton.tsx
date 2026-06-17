'use client'
import { useLogout } from '@/features/auth/api/use-auth'
import { useAuthStore } from '@/store/auth-store'

export function LogoutButton() {
  const { mutate: logout, isPending } = useLogout()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
          {user?.email?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.email ?? '사용자'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.role ?? ''}</p>
        </div>
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          title="로그아웃"
        >
          {isPending ? '...' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}
