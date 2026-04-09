import { create } from 'zustand'
import { initDatabase, getTransactions, addTransactions, updateTransaction, deleteTransaction, getMonthlyStats, getCategories, getSources, getAvailableMonths, clearAllData } from '../lib/transactionRepository'
import type { Transaction, MonthlyStats, QueryOptions } from '../types/database'

interface TransactionState {
  isInitialized: boolean
  isLoading: boolean
  transactions: Transaction[]
  total: number
  currentStats: MonthlyStats | null
  availableMonths: { year: number; month: number }[]
  categories: string[]
  sources: string[]
  selectedMonth: { year: number; month: number }
  error: string | null

  initialize: () => Promise<void>
  loadTransactions: (options?: QueryOptions) => Promise<void>
  loadMonthlyStats: (year: number, month: number) => Promise<void>
  addTransactions: (txs: Omit<Transaction, 'id' | 'uuid' | 'created_at' | 'updated_at'>[]) => Promise<{ imported: number; duplicates: number }>
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
  setSelectedMonth: (year: number, month: number) => void
  clearError: () => void
  clearAllData: () => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  transactions: [],
  total: 0,
  currentStats: null,
  availableMonths: [],
  categories: [],
  sources: [],
  selectedMonth: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })
      await initDatabase()
      console.log('Database initialized successfully')

      const { selectedMonth } = get()
      const stats = getMonthlyStats(selectedMonth.year, selectedMonth.month)
      const months = getAvailableMonths()
      const categories = getCategories()
      const sources = getSources()

      console.log('Loaded stats:', stats)
      console.log('Available months:', months)

      set({
        isInitialized: true,
        isLoading: false,
        currentStats: stats,
        availableMonths: months,
        categories,
        sources,
      })

      await get().loadTransactions()
    } catch (e) {
      console.error('Initialize error:', e)
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to initialize database',
      })
    }
  },

  loadTransactions: async (options = {}) => {
    try {
      const { selectedMonth } = get()
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`
      const endDate = selectedMonth.month === 12
        ? `${selectedMonth.year + 1}-01-01`
        : `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`

      const result = getTransactions({
        ...options,
        startDate,
        endDate,
      })

      set({ transactions: result.data, total: result.total })
    } catch (e) {
      console.error('Load transactions error:', e)
      set({ error: e instanceof Error ? e.message : 'Failed to load transactions' })
    }
  },

  loadMonthlyStats: async (year: number, month: number) => {
    try {
      const stats = getMonthlyStats(year, month)
      set({ currentStats: stats })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load stats' })
    }
  },

  addTransactions: async (txs) => {
    try {
      set({ isLoading: true })
      const result = addTransactions(txs)
      console.log('Import result:', result)

      const { selectedMonth } = get()
      const stats = getMonthlyStats(selectedMonth.year, selectedMonth.month)
      const months = getAvailableMonths()
      const categories = getCategories()
      const sources = getSources()

      await get().loadTransactions()

      set({
        isLoading: false,
        currentStats: stats,
        availableMonths: months,
        categories,
        sources,
      })

      return result
    } catch (e) {
      console.error('Add transactions error:', e)
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to add transactions' })
      return { imported: 0, duplicates: 0 }
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      updateTransaction(id, updates)
      await get().loadTransactions()

      const { selectedMonth } = get()
      const stats = getMonthlyStats(selectedMonth.year, selectedMonth.month)
      set({ currentStats: stats })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update transaction' })
    }
  },

  deleteTransaction: async (id) => {
    try {
      deleteTransaction(id)
      await get().loadTransactions()

      const { selectedMonth } = get()
      const stats = getMonthlyStats(selectedMonth.year, selectedMonth.month)
      set({ currentStats: stats })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete transaction' })
    }
  },

  setSelectedMonth: (year, month) => {
    set({ selectedMonth: { year, month } })
    get().loadMonthlyStats(year, month)
    get().loadTransactions()
  },

  clearError: () => set({ error: null }),

  clearAllData: async () => {
    try {
      clearAllData()
      set({
        transactions: [],
        total: 0,
        currentStats: null,
        availableMonths: [],
        categories: [],
        sources: [],
      })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to clear data' })
    }
  },
}))