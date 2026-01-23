'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, Shield, Users, Activity, AlertCircle, CheckCircle, Clock, XCircle, Crown, Trash2, MoreVertical } from 'lucide-react'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import { MagicCard } from '@/components/magic/MagicCard'
import axios from 'axios'

interface User {
  id: string
  email: string
  username: string
  created_at: string
  is_admin: number
  status: string
}

interface Stats {
  total_users: number
  active_users: number
  admin_users: number
  total_apps: number
  system_status: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
    fetchStats()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        router.push('/auth/login')
        return
      }

      // 获取当前用户信息
      const userResponse = await axios.get('http://localhost:8001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const user = userResponse.data
      if (user.is_admin !== 1) {
        toast.error('无权访问管理员后台')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (error: any) {
      console.error('Admin access check failed:', error)
      if (error.response?.status === 403) {
        toast.error('无权访问管理员后台')
        router.push('/dashboard')
      } else {
        toast.error('验证管理员权限失败')
      }
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8001/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setUsers(response.data.data)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8001/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleGrantAdmin = async (userId: string, username: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8001/api/admin/grant-admin',
        { user_id: parseInt(userId) },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      toast.success(`用户 ${username} 已被授予管理员权限`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      console.error('Failed to grant admin:', error)
      toast.error(error.response?.data?.detail || '授权失败')
    }
  }

  const handleRevokeAdmin = async (userId: string, username: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8001/api/admin/revoke-admin',
        { user_id: parseInt(userId) },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      toast.success(`用户 ${username} 的管理员权限已被撤销`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      console.error('Failed to revoke admin:', error)
      toast.error(error.response?.data?.detail || '撤销权限失败')
    }
  }

  const handleUpdateUserStatus = async (userId: string, username: string, isActive: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8001/api/admin/update-user-status',
        { user_id: parseInt(userId), is_active: isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      toast.success(`用户 ${username} 已被${isActive === 1 ? '激活' : '禁用'}`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      console.error('Failed to update user status:', error)
      toast.error(error.response?.data?.detail || '更新状态失败')
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`确定要删除用户 ${username} 吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:8001/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`用户 ${username} 已删除`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.detail || '删除用户失败')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">验证管理员权限...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  管理员后台
                </h1>
              </div>
            </div>
            <AnimatedButton
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              返回主界面
            </AnimatedButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MagicCard className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">总用户数</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_users}</p>
                </div>
                <Users className="w-12 h-12 text-purple-200" />
              </div>
            </MagicCard>

            <MagicCard className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">活跃用户</p>
                  <p className="text-3xl font-bold mt-1">{stats.active_users}</p>
                </div>
                <Activity className="w-12 h-12 text-green-200" />
              </div>
            </MagicCard>

            <MagicCard className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">管理员</p>
                  <p className="text-3xl font-bold mt-1">{stats.admin_users}</p>
                </div>
                <Crown className="w-12 h-12 text-amber-200" />
              </div>
            </MagicCard>

            <MagicCard className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">应用数量</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_apps}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-blue-200" />
              </div>
            </MagicCard>
          </div>
        )}

        {/* User Management */}
        <MagicCard className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">用户管理</h2>
            <input
              type="text"
              placeholder="搜索用户（邮箱或用户名）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">用户</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">角色</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">注册时间</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            活跃
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            禁用
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.is_admin === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Crown className="w-3 h-3 mr-1" />
                            管理员
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <User className="w-3 h-3 mr-1" />
                            普通用户
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {user.is_admin === 0 ? (
                            <AnimatedButton
                              size="sm"
                              onClick={() => handleGrantAdmin(user.id, user.username)}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs"
                            >
                              设为管理员
                            </AnimatedButton>
                          ) : (
                            <AnimatedButton
                              size="sm"
                              onClick={() => handleRevokeAdmin(user.id, user.username)}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs"
                            >
                              撤销权限
                            </AnimatedButton>
                          )}

                          {user.status === 'active' ? (
                            <AnimatedButton
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, user.username, 0)}
                              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs"
                            >
                              禁用
                            </AnimatedButton>
                          ) : (
                            <AnimatedButton
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, user.username, 1)}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs"
                            >
                              激活
                            </AnimatedButton>
                          )}

                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">没有找到用户</p>
                </div>
              )}
            </div>
          )}
        </MagicCard>
      </div>
    </div>
  )
}
