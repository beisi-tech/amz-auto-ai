import { Users, Activity, Settings, Database, LayoutDashboard, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: '概览',
      icon: LayoutDashboard
    },
    {
      id: 'users',
      label: '用户管理',
      icon: Users
    },
    {
      id: 'workflow',
      label: '工作流管理',
      icon: Activity
    },
    {
      id: 'system',
      label: '系统设置',
      icon: Settings
    }
  ]

  const handleDifyLogin = () => {
    // 新窗口打开 Dify
    window.open('http://localhost:4080', '_blank')
  }

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 h-screen flex flex-col fixed left-0 top-0 pt-16 z-30">
      <div className="flex-1 py-4 flex flex-col justify-between">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900 hover:scale-[1.02]"
                )}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  activeTab === item.id ? "text-purple-600" : "text-gray-400 group-hover:text-gray-500"
                )} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-4 pb-4">
          <button
            onClick={handleDifyLogin}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            进入 Dify 控制台
          </button>
        </div>
      </div>
    </div>
  )
}
