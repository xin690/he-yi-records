import { useState } from 'react'
import { User, Database, Palette, Info, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useInitStore } from '../../hooks/useInitStore'

export function SettingsPage() {
  const { isInitialized } = useInitStore()
  const { clearAllData, transactions } = useTransactionStore()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('没有数据可导出')
      return
    }

    const headers = ['时间', '类型', '金额', '描述', '分类', '来源', '对方账号']
    const rows = transactions.map(t => [
      t.datetime,
      t.direction,
      t.amount,
      t.description,
      t.category,
      t.source,
      t.counterparty || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `合一记账_导出_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleBackup = () => {
    const savedData = localStorage.getItem('heyi_records_db')
    if (!savedData) {
      alert('没有数据可备份')
      return
    }

    const blob = new Blob([savedData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `合一记账_备份_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        localStorage.setItem('heyi_records_db', data)
        window.location.reload()
      } catch (err) {
        alert('恢复失败: ' + (err instanceof Error ? err.message : '未知错误'))
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    clearAllData()
    setShowClearConfirm(false)
  }

  const toggleTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    localStorage.setItem('heyi_theme', newTheme)
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">设置</h1>
        <p className="text-gray-500">管理您的应用设置</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">功能设置</h2>
        <div className="space-y-3">
          <button
            onClick={() => setActiveSection(activeSection === 'accounts' ? null : 'accounts')}
            className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-medium">账户管理</div>
              <div className="text-sm text-gray-500">管理您的账户信息</div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')}
            className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-medium">数据管理</div>
              <div className="text-sm text-gray-500">备份、恢复、导出数据</div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection(activeSection === 'theme' ? null : 'theme')}
            className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-medium">主题设置</div>
              <div className="text-sm text-gray-500">选择深色/浅色主题</div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection(activeSection === 'about' ? null : 'about')}
            className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-medium">关于</div>
              <div className="text-sm text-gray-500">应用信息和版本</div>
            </div>
          </button>
        </div>
      </div>

      {activeSection === 'data' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">数据管理</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium">当前数据</div>
                <div className="text-sm text-gray-500">{transactions.length} 条交易记录</div>
              </div>
              <button
                onClick={handleExport}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出CSV
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium">备份数据</div>
                <div className="text-sm text-gray-500">导出完整数据备份文件</div>
              </div>
              <button
                onClick={handleBackup}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                备份
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium">恢复数据</div>
                <div className="text-sm text-gray-500">从备份文件恢复数据</div>
              </div>
              <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                恢复
                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
              </label>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                <div>
                  <div className="font-medium text-red-600 dark:text-red-400">清空所有数据</div>
                  <div className="text-sm text-red-500">不可恢复，请谨慎操作</div>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="btn bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'theme' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">主题设置</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => toggleTheme('light')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 ${
                theme === 'light' ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>浅色模式</span>
              {theme === 'light' && <span className="text-primary-500">✓</span>}
            </button>

            <button
              onClick={() => toggleTheme('dark')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 ${
                theme === 'dark' ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>深色模式</span>
              {theme === 'dark' && <span className="text-primary-500">✓</span>}
            </button>

            <button
              onClick={() => toggleTheme('system')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 ${
                theme === 'system' ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>跟随系统</span>
              {theme === 'system' && <span className="text-primary-500">✓</span>}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'about' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">关于</h2>
          
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-2xl font-bold mb-2">合一记账</div>
              <div className="text-gray-500">版本 1.0.0</div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <div className="text-green-700 dark:text-green-300 font-medium mb-1">
                ✅ 纯本地存储
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                所有数据仅存储在您的设备本地，不会上传到任何服务器
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center">
              © 2026 合一记账 - 纯本地运行的个人财务管理应用
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div className="font-bold">确认清空数据</div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              此操作将删除所有交易记录，且不可恢复。确定要继续吗？
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="btn bg-red-500 text-white hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}