'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MagicCard } from '@/components/magic/MagicCard'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import { Input } from '@/components/magic/Input'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('登录成功')
        router.push('/dashboard')
      } else {
        toast.error(data.detail || '登录失败')
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <MagicCard className="p-8 space-y-6" delay={0.1} gradient>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-gradient">
              AMZ Auto AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              欢迎回来，请登录您的账户
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="邮箱地址"
              placeholder="请输入您的邮箱地址"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              id="password"
              type="password"
              label="密码"
              placeholder="请输入您的密码"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <AnimatedButton
              type="submit"
              loading={isLoading}
              variant="gradient"
              className="w-full"
            >
              登录
            </AnimatedButton>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            还没有账户？{' '}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              立即注册
            </Link>
          </p>
        </MagicCard>
      </div>
    </div>
  )
}
