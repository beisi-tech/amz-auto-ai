'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Play, Save, History, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface WorkflowHistory {
  id: string
  name: string
  input_data: string
  output_data: string
  status: string
  created_at: string
}

export default function WorkflowPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [inputData, setInputData] = useState('')
  const [outputData, setOutputData] = useState('')
  const [history, setHistory] = useState<WorkflowHistory[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsHistoryLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/workflows/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      toast.error('获取历史记录失败')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const handleRunWorkflow = async () => {
    if (!inputData.trim()) {
      toast.error('请输入工作流数据')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/workflows/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workflowName || '未命名工作流',
          input_data: inputData,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOutputData(data.output_data || '工作流执行成功')
        toast.success('工作流执行成功')
        await fetchHistory()
      } else {
        toast.error('工作流执行失败')
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWorkflow = async () => {
    if (!inputData.trim()) {
      toast.error('请输入工作流数据')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/workflows/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workflowName || '未命名工作流',
          input_data: inputData,
          output_data: outputData,
        }),
      })

      if (response.ok) {
        toast.success('工作流保存成功')
        await fetchHistory()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试')
    }
  }

  const handleLoadHistory = (item: WorkflowHistory) => {
    setWorkflowName(item.name)
    setInputData(item.input_data)
    setOutputData(item.output_data)
    toast.success('已加载历史记录')
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            工作流
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            使用AI驱动的工作流优化您的电商业务
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fetchHistory()}
            >
              <History className="w-4 h-4" />
              历史记录
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>工作流历史</SheetTitle>
              <SheetDescription>
                查看和管理您的工作流执行记录
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无历史记录</p>
              ) : (
                history.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => handleLoadHistory(item)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status === 'completed' ? '已完成' : '进行中'}
                        </span>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(item.created_at).toLocaleString('zh-CN')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {item.input_data}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              输入配置
            </CardTitle>
            <CardDescription>
              配置您的工作流参数和输入数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">工作流名称</label>
              <Input
                placeholder="输入工作流名称"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">输入数据</label>
              <Textarea
                placeholder="输入工作流数据..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={12}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRunWorkflow}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    执行工作流
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveWorkflow}
                variant="outline"
                disabled={!outputData}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full" />
              输出结果
            </CardTitle>
            <CardDescription>
              查看工作流执行的结果和输出
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="工作流输出将显示在这里..."
              value={outputData}
              onChange={(e) => setOutputData(e.target.value)}
              rows={16}
              className="transition-all duration-200 focus:ring-2 focus:ring-green-500 resize-none"
              readOnly={!isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
