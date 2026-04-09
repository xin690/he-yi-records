import { useEffect, useState } from 'react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useInitStore } from '../../hooks/useInitStore'
import { ChevronLeft, ChevronRight, Search, Edit2, Trash2, X } from 'lucide-react'

export function HomePage() {
  const { isInitialized, initError } = useInitStore()
  const {
    transactions,
    currentStats,
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    categories,
    sources,
    updateTransaction,
    deleteTransaction,
  } = useTransactionStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [editingTx, setEditingTx] = useState<number | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editMode, setEditMode] = useState<'desc' | 'category'>('desc')

  const allCategories = ['餐饮', '购物', '交通', '居住', '娱乐', '医疗', '教育', '通讯', '社交', '金融', '收入', '其他']

  const navigateMonth = (direction: 'prev' | 'next') => {
    let { year, month } = selectedMonth
    if (direction === 'prev') {
      month--
      if (month < 1) {
        month = 12
        year--
      }
    } else {
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }
    setSelectedMonth(year, month)
  }

  const goToMonth = (year: number, month: number) => {
    setSelectedMonth(year, month)
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="card">
        <div className="text-red-500">初始化失败: {initError}</div>
      </div>
    )
  }

  const filteredTransactions = transactions.filter(tx => {
    if (searchKeyword && !tx.description?.toLowerCase().includes(searchKeyword.toLowerCase()) && 
        !tx.counterparty?.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false
    }
    if (filterCategory && tx.category !== filterCategory) return false
    if (filterSource && tx.source !== filterSource) return false
    return true
  })

  const groupFilteredByDate = () => {
    const groups: Record<string, typeof transactions> = {}
    filteredTransactions.forEach((tx) => {
      const date = tx.datetime.split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(tx)
    })
    return groups
  }

  const handleSaveEdit = (id: number) => {
    if (editMode === 'desc' && editDescription.trim()) {
      updateTransaction(id, { description: editDescription.trim() })
    } else if (editMode === 'category' && editCategory) {
      updateTransaction(id, { 
        category: editCategory,
        sub_category: getSubCategory(editCategory)
      })
    }
    setEditingTx(null)
    setEditDescription('')
    setEditCategory('')
  }

  const getSubCategory = (category: string): string => {
    const subMap: Record<string, string> = {
      '餐饮': '其他', '购物': '其他', '交通': '其他', '居住': '其他', 
      '娱乐': '其他', '医疗': '其他', '教育': '其他', '通讯': '其他', 
      '社交': '其他', '金融': '其他', '收入': '其他', '其他': '其他'
    }
    return subMap[category] || '其他'
  }

  const startEditCategory = (id: number, category: string) => {
    setEditingTx(id)
    setEditCategory(category)
    setEditMode('category')
    setEditDescription('')
  }

  const startEditDesc = (id: number, desc: string) => {
    setEditingTx(id)
    setEditDescription(desc || '')
    setEditMode('desc')
    setEditCategory('')
  }

  const handleDelete = (id: number) => {
    if (confirm('确定删除这笔交易吗？')) {
      deleteTransaction(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">全部分类</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">全部来源</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(searchKeyword || filterCategory || filterSource) && (
            <button
              onClick={() => { setSearchKeyword(''); setFilterCategory(''); setFilterSource('') }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {selectedMonth.year}年{selectedMonth.month}月
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {availableMonths.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {availableMonths.map(({ year, month }) => (
              <button
                key={`${year}-${month}`}
                onClick={() => goToMonth(year, month)}
                className={`text-xs px-2 py-1 rounded ${
                  year === selectedMonth.year && month === selectedMonth.month
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                }`}
              >
                {month}月
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">收入</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              ¥{formatAmount(currentStats?.totalIncome || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400">支出</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              ¥{formatAmount(currentStats?.totalExpense || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">结余</div>
            <div className={`text-xl font-bold ${(currentStats?.balance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
              ¥{formatAmount(currentStats?.balance || 0)}
            </div>
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">
          {transactions.length === 0 ? '暂无账单数据，请导入账单' : '没有符合条件的交易'}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupFilteredByDate()).map(([date, txs]) => (
            <div key={date} className="card">
              <div className="text-sm text-gray-500 mb-2">
                {new Date(date).toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group"
                  >
                    <div className="flex-1">
                      {editingTx === tx.id ? (
                        editMode === 'category' ? (
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                            autoFocus
                          >
                            <option value="">选择分类</option>
                            {allCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(tx.id!)}
                            className="w-full px-2 py-1 border rounded"
                            autoFocus
                          />
                        )
                      ) : (
                        <>
                          <div className="font-medium">{tx.description || tx.counterparty || '未知'}</div>
                          <div className="text-sm text-gray-500">
                            {tx.source} {tx.category && `· ${tx.category}`}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingTx === tx.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(tx.id!)} className="text-green-500 text-sm">保存</button>
                          <button onClick={() => { setEditingTx(null); setEditDescription(''); setEditCategory(''); }} className="text-gray-500 text-sm">取消</button>
                        </>
                      ) : (
                        <>
                          <div className={`font-medium ${tx.direction === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.direction === 'income' ? '+' : '-'}¥{formatAmount(Math.abs(tx.amount))}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <button onClick={() => startEditDesc(tx.id!, tx.description || '')} className="p-1 hover:bg-gray-200 rounded" title="编辑描述">
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button onClick={() => startEditCategory(tx.id!, tx.category || '')} className="p-1 hover:bg-gray-200 rounded" title="编辑分类">
                              <span className="text-xs text-gray-500">分类</span>
                            </button>
                            <button onClick={() => handleDelete(tx.id!)} className="p-1 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <div className="card text-center text-gray-500 py-2">
          共 {filteredTransactions.length} 笔交易，支出 ¥{formatAmount(currentStats?.totalExpense || 0)}
        </div>
      )}
    </div>
  )
}