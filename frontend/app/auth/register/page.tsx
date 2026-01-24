'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MagicCard } from '@/components/magic/MagicCard'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import { Input } from '@/components/magic/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hasAdmin, setHasAdmin] = useState(true) // Default to true to hide hint initially
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })

  useEffect(() => {
    // Check if system has admin configured
    fetch('/api/auth/setup-status')
      .then((res) => res.json())
      .then((data) => {
        setHasAdmin(data.has_admin)
      })
      .catch((err) => console.error('Failed to check setup status', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 8) {
      toast.error('密码长度至少为8位')
      return
    }

    // 简单验证是否包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(formData.password)
    const hasNumber = /[0-9]/.test(formData.password)
    if (!hasLetter || !hasNumber) {
      toast.error('密码必须包含字母和数字')
      return
    }

    setIsLoading(true)

    try {
      // Use relative path which is proxied
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('注册成功，请登录')
        router.push('/auth/login')
      } else {
        toast.error(data.detail || '注册失败')
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
              创建一个新账户
            </p>
            {!hasAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                💡 提示：注册的账户将自动成为<span className="font-bold">系统管理员</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username"
              type="text"
              label="用户名"
              placeholder="请输入用户名（2-20个字符）"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              minLength={2}
              maxLength={20}
            />

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
              placeholder="请输入密码（至少8位，包含字母和数字）"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={8}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="确认密码"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />

            <AnimatedButton
              type="submit"
              loading={isLoading}
              variant="gradient"
              className="w-full"
            >
              注册
            </AnimatedButton>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            已有账户？{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </MagicCard>
      </div>
    </div>
  )
}
