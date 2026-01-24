'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import {
  LayoutDashboard,
  Workflow,
  Settings,
  LogOut,
  Menu,
  Shield,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/magic/Sheet'
import { cn } from '@/lib/utils'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setIsVisible(true)
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Failed to parse user data', e)
      }
    }
  }, [])

  const menuItems = [
    { icon: LayoutDashboard, label: '仪表板', path: '/dashboard' },
    { icon: Workflow, label: '工作流', path: '/dashboard/workflow' },
    { icon: Settings, label: '设置', path: '/dashboard/settings' },
  ]

  if (user?.is_admin === 1) {
    // 隐藏管理员后台入口，通过直接访问 /admin 进入
    // menuItems.push({ icon: Shield, label: '管理员后台', path: '/admin' })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-500',
        !isVisible && '-translate-y-full',
        isVisible && 'translate-y-0'
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold text-gradient">
            AMZ Auto AI
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          {menuItems.map((item) => (
            <AnimatedButton
              key={item.path}
              variant={isActive(item.path) ? 'default' : 'ghost'}
              className={cn(
                isActive(item.path) && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              )}
              onClick={() => router.push(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </AnimatedButton>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden md:flex"
          >
            <LogOut className="h-5 w-5" />
          </AnimatedButton>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <AnimatedButton variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </AnimatedButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className={cn(
                'space-y-4 mt-8 transition-all duration-300',
                !isMobileMenuOpen && 'opacity-0 translate-x-4',
                isMobileMenuOpen && 'opacity-100 translate-x-0'
              )}>
                <h2 className="text-lg font-semibold">导航菜单</h2>
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <AnimatedButton
                      key={item.path}
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isActive(item.path) && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      )}
                      onClick={() => {
                        router.push(item.path)
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </AnimatedButton>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <AnimatedButton
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </AnimatedButton>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}


// Removed duplicate cn function

