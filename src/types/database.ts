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

export interface Account {
  id?: number
  name: string
  type: 'payment' | 'bank' | 'cash' | 'credit'
  icon?: string
  color?: string
  sort_order: number
}

export interface CategoryRule {
  id?: number
  keyword: string
  match_field: 'description' | 'counterparty'
  category: string
  sub_category?: string
  source?: string
  priority: number
  is_system: number
  is_user_defined: number
}

export interface MonthlySummary {
  id?: number
  year: number
  month: number
  total_income: number
  total_expense: number
  balance: number
  category_breakdown: string
  source_breakdown: string
  updated_at: string
}

export interface QueryOptions {
  startDate?: string
  endDate?: string
  category?: string
  source?: string
  direction?: 'income' | 'expense'
  keyword?: string
  limit?: number
  offset?: number
}

export interface MonthlyStats {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  categoryBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
  transactionCount: number
}

export interface ImportResult {
  total: number
  imported: number
  skipped: number
  duplicates: number
  errors: string[]
}