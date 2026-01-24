'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TopNav from '@/components/TopNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!res.ok) {
          throw new Error('Unauthorized')
        }
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
