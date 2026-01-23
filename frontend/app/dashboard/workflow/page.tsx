'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagicCard } from '@/components/magic/MagicCard'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import { Plus, Settings, Edit, Workflow as WorkflowIcon, ExternalLink, RefreshCw, Loader2, Play } from 'lucide-react'
import { DropdownMenu, DropdownItem } from '@/components/magic/Dropdown'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/magic/Dialog'
import { Input } from '@/components/magic/Input'
import { Textarea } from '@/components/magic/Textarea'
import { Select, SelectItem } from '@/components/magic/Select'
import { toast } from 'sonner'

interface DifyApp {
  id: string
  name: string
  description: string
  mode: string
  created_at: string
  updated_at: string
}

export default function WorkflowListPage() {
  const router = useRouter()
  const [apps, setApps] = useState<DifyApp[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedApp, setSelectedApp] = useState<DifyApp | null>(null)
  const [runInputs, setRunInputs] = useState<Record<string, any>>({})
  const [runResult, setRunResult] = useState<any>(null)
  
  const [isCreating, setIsCreating] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newAppDescription, setNewAppDescription] = useState('')
  const [newAppMode, setNewAppMode] = useState<'workflow' | 'chatbot'>('workflow')

  useEffect(() => {
    fetchDifyApps()
  }, [])


  const fetchDifyApps = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8001/api/dify/apps', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApps(data.apps || [])
      } else {
        console.error('获取 Dify 应用失败')
        setApps([])
      }
    } catch (error) {
      console.error('获取 Dify 应用失败:', error)
      setApps([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDify = (appId: string) => {
    const difyUrl = process.env.NEXT_PUBLIC_DIFY_URL || 'http://localhost:3001'
    window.open(`${difyUrl}/app/${appId}/workflow`, '_blank')
  }

  const handleCreateApp = async () => {
    if (!newAppName.trim()) {
      toast.error('请输入应用名称')
      return
    }

    setIsCreating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/dify/apps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAppName,
          description: newAppDescription,
          mode: newAppMode,
          icon: '🤖',
          icon_background: '#3B82F6'
        })
      })

      if (response.ok) {
        const newApp = await response.json()
        toast.success('应用创建成功！')
        
        await fetchDifyApps()
        
        setIsCreateDialogOpen(false)
        setNewAppName('')
        setNewAppDescription('')
        setNewAppMode('workflow')
        
        // Removed auto-jump to Dify to improve UX
        // The user can click the app card to open it when ready
      } else {
        const error = await response.json()
        toast.error(error.detail || '创建失败')
      }
    } catch (error) {
      console.error('创建应用失败:', error)
      toast.error('创建应用时发生错误')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRunApp = async () => {
    if (!selectedApp) return

    setIsRunning(true)
    setRunResult(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8001/api/dify/apps/${selectedApp.id}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runInputs)
      })

      if (response.ok) {
        const result = await response.json()
        setRunResult(result)
        toast.success('运行成功')
      } else {
        const error = await response.json()
        toast.error(error.detail || '运行失败')
      }
    } catch (error) {
      console.error('运行应用失败:', error)
      toast.error('运行应用时发生错误')
    } finally {
      setIsRunning(false)
    }
  }

  const openRunDialog = (app: DifyApp) => {
    setSelectedApp(app)
    setRunInputs({})
    setRunResult(null)
    setIsRunDialogOpen(true)
  }

  const handleOpenDifyHome = () => {
    const difyUrl = process.env.NEXT_PUBLIC_DIFY_URL || 'http://localhost:3001'
    window.open(difyUrl, '_blank')
  }

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'workflow':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'chatbot':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'advanced-chat':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getModeText = (mode: string) => {
    switch (mode) {
      case 'workflow':
        return '工作流'
      case 'chatbot':
        return '聊天机器人'
      case 'advanced-chat':
        return '高级聊天'
      default:
        return mode
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              工作流管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              管理您的 AI 应用和工作流
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AnimatedButton
              variant="outline"
              onClick={fetchDifyApps}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </AnimatedButton>
            <AnimatedButton
              variant="gradient"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              创建
            </AnimatedButton>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <WorkflowIcon className="mr-2 h-5 w-5" />
              应用列表 ({apps.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <MagicCard className="p-12 text-center" delay={0.1}>
              <WorkflowIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">暂无应用</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                创建您的第一个 AI 工作流应用
              </p>
              <AnimatedButton variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                创建应用
              </AnimatedButton>
            </MagicCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app, index) => (
                <MagicCard
                  key={app.id}
                  delay={index * 0.05}
                  className="group p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                  onClick={() => handleOpenDify(app.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`text-xs px-3 py-1 rounded-full ${getModeBadge(app.mode)}`}>
                      {getModeText(app.mode)}
                    </div>
                    <DropdownMenu
                      trigger={
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Settings className="h-4 w-4 text-gray-500" />
                        </button>
                      }
                    >
                      <DropdownItem onClick={(e) => {
                        e.stopPropagation()
                        openRunDialog(app)
                      }}>
                        <Play className="mr-2 h-4 w-4 text-green-600" />
                        运行应用
                      </DropdownItem>
                      <DropdownItem onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDify(app.id)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        在 Dify 中编辑
                      </DropdownItem>
                      <DropdownItem onClick={(e) => {
                        e.stopPropagation()
                        const difyUrl = process.env.NEXT_PUBLIC_DIFY_URL || 'http://localhost:3001'
                        window.open(`${difyUrl}/app/${app.id}/overview`, '_blank')
                      }}>
                        <Settings className="mr-2 h-4 w-4" />
                        应用配置
                      </DropdownItem>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {app.description || '暂无描述' }
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <WorkflowIcon className="h-4 w-4" />
                        <span>ID: {app.id.slice(0, 8)}...</span>
                      </div>
                      <div>•</div>
                      <div>更新于 {new Date(app.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      创建于 {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </MagicCard>
              ))}
            </div>
          )}
        </div>

        <MagicCard className="p-6 mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" delay={0.2}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">直接访问 Dify</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                点击下方按钮打开 Dify 完整界面，在原生环境中管理所有工作流
              </p>
            </div>
            <AnimatedButton
              onClick={handleOpenDifyHome}
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              打开 Dify
            </AnimatedButton>
          </div>
        </MagicCard>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建应用</DialogTitle>
              <DialogDescription>
                创建一个新的 AI 应用，选择应用类型并填写基本信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                id="app-name"
                label="应用名称 *"
                placeholder="输入应用名称"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                disabled={isCreating}
              />
              <Textarea
                id="app-description"
                label="应用描述"
                placeholder="输入应用描述（可选）"
                value={newAppDescription}
                onChange={(e) => setNewAppDescription(e.target.value)}
                className="min-h-[100px]"
                disabled={isCreating}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">应用类型</label>
                <Select
                  value={newAppMode}
                  onValueChange={(value) => setNewAppMode(value as 'workflow' | 'chatbot')}
                  disabled={isCreating}
                >
                  <SelectItem value="workflow">🔄 工作流</SelectItem>
                  <SelectItem value="chatbot">💬 聊天机器人</SelectItem>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <AnimatedButton
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                取消
              </AnimatedButton>
              <AnimatedButton
                onClick={handleCreateApp}
                disabled={isCreating}
                variant="gradient"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    创建
                  </>
                )}
              </AnimatedButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>运行应用: {selectedApp?.name}</DialogTitle>
              <DialogDescription>
                输入参数并运行应用
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <Textarea
                  label="输入参数 (JSON格式，例如 {'query': 'hello'})"
                  placeholder='{"query": "hello"}'
                  value={JSON.stringify(runInputs, null, 2) === '{}' ? '' : JSON.stringify(runInputs, null, 2)}
                  onChange={(e) => {
                    try {
                      setRunInputs(JSON.parse(e.target.value))
                    } catch (err) {
                      // Allow typing, validate on submit or blur if needed
                      // For now just treating as text until parsed
                    }
                  }}
                  className="min-h-[150px] font-mono"
                />
              </div>

              {runResult && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[300px]">
                  <h4 className="text-sm font-semibold mb-2">运行结果:</h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(runResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <DialogFooter>
              <AnimatedButton
                variant="outline"
                onClick={() => setIsRunDialogOpen(false)}
                disabled={isRunning}
              >
                关闭
              </AnimatedButton>
              <AnimatedButton
                onClick={handleRunApp}
                disabled={isRunning}
                variant="gradient"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    运行中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    运行
                  </>
                )}
              </AnimatedButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

