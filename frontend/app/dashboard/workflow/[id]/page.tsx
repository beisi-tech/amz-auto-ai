'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MagicCard } from '@/components/magic/MagicCard'
import { AnimatedButton } from '@/components/magic/AnimatedButton'
import { Loader2, ExternalLink, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.id as string
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)

  const difyUrl = process.env.NEXT_PUBLIC_DIFY_URL || 'http://localhost:3001'
  const workflowUrl = `${difyUrl}/app/${appId}/workflow`

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoading(false)
  }

  // Handle iframe error (basic timeout check or if we could detect it)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeLoading) {
        // If still loading after 10s, it might be X-Frame-Options blocking or just slow
        // We don't set error immediately, but we could show a hint
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [iframeLoading])

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <AnimatedButton
            variant="ghost"
            onClick={() => router.push('/dashboard/workflow')}
            className="text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            返回列表
          </AnimatedButton>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            工作流编辑器
          </h1>
          <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            ID: {appId}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3 w-3 mr-2" />
            如果无法显示，请尝试在新窗口打开或确保已在 Dify 中登录
          </div>
          
          <AnimatedButton
            variant="outline"
            onClick={() => {
              setIframeLoading(true)
              const iframe = document.querySelector('iframe')
              if (iframe) iframe.src = iframe.src
            }}
            title="刷新编辑器"
          >
            <RefreshCw className={`h-4 w-4 ${iframeLoading ? 'animate-spin' : ''}`} />
          </AnimatedButton>
          
          <AnimatedButton
            variant="gradient"
            onClick={() => window.open(workflowUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            在新窗口打开
          </AnimatedButton>
        </div>
      </div>

      {/* Main Content - Iframe */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {iframeLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-20 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">正在加载编辑器...</p>
            <p className="text-sm text-gray-500 mt-2">首次加载可能需要登录 Dify</p>
          </div>
        )}
        
        <iframe
          src={workflowUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  )
}
