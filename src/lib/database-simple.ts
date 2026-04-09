// Simple JSON-based storage - no WASM required
// This replaces sql.js to avoid WebAssembly issues

export interface Transaction {
  id?: number
  uuid: string
  datetime: string
  amount: number
  direction: 'income' | 'expense'
  description: string
  counterparty?: string
  category: string
  sub_category?: string
  source: string
  source_transaction_id?: string
  payment_method?: string
  status?: string
  account?: string
  is_duplicate: number
  duplicate_of?: number
  confidence: number
  is_confirmed: number
  raw_json?: string
  created_at: string
  updated_at: string
}

interface Database {
  transactions: Transaction[]
  accounts: { id: number; name: string; type: string; icon?: string; color?: string; sort_order: number }[]
  category_rules: { id: number; keyword: string; match_field: string; category: string; sub_category?: string; source?: string; priority: number; is_system: number; is_user_defined: number }[]
  settings: Record<string, string>
  nextId: {
    transactions: number
    accounts: number
    category_rules: number
  }
}

const DB_KEY = 'heyi_records_db'

let db: Database | null = null

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function createDefaultDatabase(): Database {
  return {
    transactions: [],
    accounts: [],
    category_rules: [
      // 餐饮
      { id: 1, keyword: '美团|饿了么|外卖', match_field: 'description', category: '餐饮', sub_category: '外卖', priority: 1, is_system: 1, is_user_defined: 0 },
      { id: 2, keyword: '麦当劳|肯德基|汉堡王|必胜客', match_field: 'description', category: '餐饮', sub_category: '快餐', priority: 2, is_system: 1, is_user_defined: 0 },
      { id: 3, keyword: '星巴克|瑞幸|咖啡', match_field: 'description', category: '餐饮', sub_category: '饮品', priority: 3, is_system: 1, is_user_defined: 0 },
      { id: 4, keyword: '火锅|烧烤|川菜|粤菜|湘菜|日料|寿司', match_field: 'description', category: '餐饮', sub_category: '正餐', priority: 4, is_system: 1, is_user_defined: 0 },
      { id: 5, keyword: '沙县|兰州拉面|黄焖鸡|麻辣烫', match_field: 'description', category: '餐饮', sub_category: '快餐', priority: 5, is_system: 1, is_user_defined: 0 },
      
      // 交通
      { id: 6, keyword: '滴滴|打车|高德|花小猪|首汽', match_field: 'description', category: '交通', sub_category: '打车', priority: 6, is_system: 1, is_user_defined: 0 },
      { id: 7, keyword: '地铁|公交|公交车|轨道交通', match_field: 'description', category: '交通', sub_category: '公共交通', priority: 7, is_system: 1, is_user_defined: 0 },
      { id: 8, keyword: '加油|加油站|中石化|中石油', match_field: 'description', category: '交通', sub_category: '加油', priority: 8, is_system: 1, is_user_defined: 0 },
      { id: 9, keyword: '停车|停车场', match_field: 'description', category: '交通', sub_category: '停车', priority: 9, is_system: 1, is_user_defined: 0 },
      { id: 10, keyword: '火车|高铁|动车', match_field: 'description', category: '交通', sub_category: '火车', priority: 10, is_system: 1, is_user_defined: 0 },
      { id: 11, keyword: '飞机|机票|航班', match_field: 'description', category: '交通', sub_category: '飞机', priority: 11, is_system: 1, is_user_defined: 0 },
      
      // 通讯
      { id: 12, keyword: '话费|充值|移动|联通|电信', match_field: 'description', category: '通讯', sub_category: '话费', priority: 12, is_system: 1, is_user_defined: 0 },
      { id: 13, keyword: '宽带|网费|光纤', match_field: 'description', category: '通讯', sub_category: '网费', priority: 13, is_system: 1, is_user_defined: 0 },
      
      // 购物
      { id: 14, keyword: '淘宝|天猫|京东|拼多多|唯品会', match_field: 'description', category: '购物', sub_category: '网购', priority: 14, is_system: 1, is_user_defined: 0 },
      { id: 15, keyword: '超市|便利店|沃尔玛|盒马|永辉|罗森|全家', match_field: 'description', category: '购物', sub_category: '日用品', priority: 15, is_system: 1, is_user_defined: 0 },
      { id: 16, keyword: '水果|蔬菜|生鲜', match_field: 'description', category: '购物', sub_category: '食品', priority: 16, is_system: 1, is_user_defined: 0 },
      
      // 娱乐
      { id: 17, keyword: '爱奇艺|腾讯|优酷|b站|会员', match_field: 'description', category: '娱乐', sub_category: '会员', priority: 17, is_system: 1, is_user_defined: 0 },
      { id: 18, keyword: '网易云|QQ音乐|酷狗', match_field: 'description', category: '娱乐', sub_category: '音乐', priority: 18, is_system: 1, is_user_defined: 0 },
      { id: 19, keyword: '游戏|Steam|Epic|网易游戏', match_field: 'description', category: '娱乐', sub_category: '游戏', priority: 19, is_system: 1, is_user_defined: 0 },
      { id: 20, keyword: '电影|剧院|演唱会|门票', match_field: 'description', category: '娱乐', sub_category: '文化', priority: 20, is_system: 1, is_user_defined: 0 },
      { id: 21, keyword: '携程|飞猪|酒店', match_field: 'description', category: '娱乐', sub_category: '旅游', priority: 21, is_system: 1, is_user_defined: 0 },
      
      // 医疗
      { id: 22, keyword: '药|药店|药房', match_field: 'description', category: '医疗', sub_category: '药品', priority: 22, is_system: 1, is_user_defined: 0 },
      { id: 23, keyword: '医院|门诊|体检', match_field: 'description', category: '医疗', sub_category: '医疗', priority: 23, is_system: 1, is_user_defined: 0 },
      
      // 教育
      { id: 24, keyword: '学费|培训|课程|教育', match_field: 'description', category: '教育', sub_category: '培训', priority: 24, is_system: 1, is_user_defined: 0 },
      { id: 25, keyword: '书|图书|亚马逊|当当', match_field: 'description', category: '教育', sub_category: '书籍', priority: 25, is_system: 1, is_user_defined: 0 },
      
      // 居住
      { id: 26, keyword: '房租|租金', match_field: 'description', category: '居住', sub_category: '房租', priority: 26, is_system: 1, is_user_defined: 0 },
      { id: 27, keyword: '物业|水电|燃气', match_field: 'description', category: '居住', sub_category: '水电煤', priority: 27, is_system: 1, is_user_defined: 0 },
      
      // 金融
      { id: 28, keyword: '保险', match_field: 'description', category: '金融', sub_category: '保险', priority: 28, is_system: 1, is_user_defined: 0 },
      
      // 收入
      { id: 29, keyword: '工资|月薪|奖金|薪资', match_field: 'description', category: '收入', sub_category: '工资', priority: 29, is_system: 1, is_user_defined: 0 },
      { id: 30, keyword: '兼职|副业|稿费', match_field: 'description', category: '收入', sub_category: '兼职', priority: 30, is_system: 1, is_user_defined: 0 },
      { id: 31, keyword: '退款|退货|售后', match_field: 'description', category: '收入', sub_category: '退款', priority: 31, is_system: 1, is_user_defined: 0 },
      
      // 社交
      { id: 32, keyword: '红包|转账', match_field: 'description', category: '社交', sub_category: '转账', priority: 32, is_system: 1, is_user_defined: 0 },
      { id: 33, keyword: '聚餐|请客', match_field: 'description', category: '社交', sub_category: '聚餐', priority: 33, is_system: 1, is_user_defined: 0 },
    ],
    settings: {},
    nextId: {
      transactions: 1,
      accounts: 1,
      category_rules: 34,
    }
  }
}

export async function initDatabase(): Promise<void> {
  if (db) return

  try {
    const savedData = localStorage.getItem(DB_KEY)
    if (savedData) {
      try {
        db = JSON.parse(savedData)
        console.log('Loaded database from localStorage')
      } catch (e) {
        console.warn('Failed to parse saved data, creating new database:', e)
        db = createDefaultDatabase()
      }
    } else {
      db = createDefaultDatabase()
      console.log('Created new database')
    }
  } catch (e) {
    console.error('Failed to initialize database:', e)
    db = createDefaultDatabase()
  }
}

function saveDatabase(): void {
  if (!db) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (e) {
    console.error('Failed to save database:', e)
  }
}

export function getTransactions(options: {
  startDate?: string
  endDate?: string
  category?: string
  source?: string
  direction?: 'income' | 'expense'
  keyword?: string
  limit?: number
  offset?: number
} = {}): { data: Transaction[]; total: number } {
  if (!db) return { data: [], total: 0 }

  let filtered = [...db.transactions]

  if (options.startDate) {
    filtered = filtered.filter(t => t.datetime >= options.startDate!)
  }
  if (options.endDate) {
    filtered = filtered.filter(t => t.datetime < options.endDate!)
  }
  if (options.category) {
    filtered = filtered.filter(t => t.category === options.category)
  }
  if (options.source) {
    filtered = filtered.filter(t => t.source === options.source)
  }
  if (options.direction) {
    filtered = filtered.filter(t => t.direction === options.direction)
  }
  if (options.keyword) {
    const kw = options.keyword.toLowerCase()
    filtered = filtered.filter(t => 
      t.description?.toLowerCase().includes(kw) || 
      t.counterparty?.toLowerCase().includes(kw)
    )
  }

  // Sort by datetime descending
  filtered.sort((a, b) => b.datetime.localeCompare(a.datetime))

  const total = filtered.length
  const offset = options.offset || 0
  const limit = options.limit || 50
  const data = filtered.slice(offset, offset + limit)

  return { data, total }
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'uuid' | 'created_at' | 'updated_at'>): number {
  if (!db) throw new Error('Database not initialized')

  const now = new Date().toISOString()
  const id = db.nextId.transactions++
  
  const transaction: Transaction = {
    ...tx,
    id,
    uuid: generateUUID(),
    created_at: now,
    updated_at: now,
  }
  
  db.transactions.push(transaction)
  saveDatabase()
  
  return id
}

export function addTransactions(txs: Omit<Transaction, 'id' | 'uuid' | 'created_at' | 'updated_at'>[]): { imported: number; duplicates: number } {
  if (!db) return { imported: 0, duplicates: 0 }

  let imported = 0
  let duplicates = 0

  for (const tx of txs) {
    let existing: Transaction | undefined
    
    // 精确匹配: source_transaction_id + source
    if (tx.source_transaction_id) {
      existing = db.transactions.find(
        t => t.source === tx.source && t.source_transaction_id === tx.source_transaction_id
      )
    }
    
    // 模糊匹配: 时间+金额+描述完全相同
    if (!existing) {
      existing = db.transactions.find(
        t => t.source === tx.source && 
             t.datetime === tx.datetime && 
             Math.abs(t.amount - tx.amount) < 0.01 &&
             t.description === tx.description
      )
    }
    
    if (existing) {
      duplicates++
      continue
    }

    addTransaction(tx)
    imported++
  }

  return { imported, duplicates }
}

export function deleteTransaction(id: number): void {
  if (!db) return
  db.transactions = db.transactions.filter(t => t.id !== id)
  saveDatabase()
}

export function updateTransaction(id: number, updates: Partial<Transaction>): void {
  if (!db) return
  
  const idx = db.transactions.findIndex(t => t.id === id)
  if (idx === -1) return
  
  db.transactions[idx] = {
    ...db.transactions[idx],
    ...updates,
    updated_at: new Date().toISOString()
  }
  saveDatabase()
}

export function getMonthlyStats(year: number, month: number): {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  categoryBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
  transactionCount: number
} | null {
  if (!db) return null

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const monthTransactions = db.transactions.filter(
    t => t.datetime >= startDate && t.datetime < endDate
  )

  const totalIncome = monthTransactions
    .filter(t => t.direction === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = monthTransactions
    .filter(t => t.direction === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const categoryBreakdown: Record<string, number> = {}
  monthTransactions
    .filter(t => t.direction === 'expense')
    .forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount)
    })

  const sourceBreakdown: Record<string, number> = {}
  monthTransactions.forEach(t => {
    sourceBreakdown[t.source] = (sourceBreakdown[t.source] || 0) + Math.abs(t.amount)
  })

  return {
    year,
    month,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
    sourceBreakdown,
    transactionCount: monthTransactions.length,
  }
}

export function getCategories(): string[] {
  if (!db) return []
  const categories = new Set(db.transactions.map(t => t.category))
  return Array.from(categories).sort()
}

export function getSources(): string[] {
  if (!db) return []
  const sources = new Set(db.transactions.map(t => t.source))
  return Array.from(sources).sort()
}

export function getAvailableMonths(): { year: number; month: number }[] {
  if (!db) return []
  
  const months = new Set<string>()
  db.transactions.forEach(t => {
    const date = new Date(t.datetime)
    months.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
  })
  
  return Array.from(months)
    .map(m => {
      const [year, month] = m.split('-').map(Number)
      return { year, month }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
}

export function clearAllData(): void {
  if (!db) return
  db.transactions = []
  saveDatabase()
}