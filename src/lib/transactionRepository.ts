import { initDatabase, getTransactions as dbGetTransactions, addTransactions as dbAddTransactions, updateTransaction as dbUpdateTransaction, deleteTransaction as dbDeleteTransaction, getMonthlyStats as dbGetMonthlyStats, getCategories as dbGetCategories, getSources as dbGetSources, getAvailableMonths as dbGetAvailableMonths, clearAllData as dbClearAllData } from './database-simple'
import type { Transaction, QueryOptions, MonthlyStats } from '../types/database'

export { initDatabase }

export function getTransactions(options: QueryOptions = {}): { data: Transaction[]; total: number } {
  return dbGetTransactions(options)
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'uuid' | 'created_at' | 'updated_at'>): number {
  return dbAddTransactions([tx]).imported > 0 ? 1 : 0
}

export function addTransactions(txs: Omit<Transaction, 'id' | 'uuid' | 'created_at' | 'updated_at'>[]): { imported: number; duplicates: number } {
  return dbAddTransactions(txs)
}

export function getTransactionById(id: number): Transaction | null {
  const result = dbGetTransactions({ limit: 1000, offset: 0 })
  return result.data.find(t => t.id === id) || null
}

export function updateTransaction(id: number, updates: Partial<Transaction>): void {
  dbUpdateTransaction(id, updates)
}

export function deleteTransaction(id: number): void {
  dbDeleteTransaction(id)
}

export function getMonthlyStats(year: number, month: number): MonthlyStats | null {
  return dbGetMonthlyStats(year, month)
}

export function getCategories(): string[] {
  return dbGetCategories()
}

export function getSources(): string[] {
  return dbGetSources()
}

export function getAvailableMonths(): { year: number; month: number }[] {
  return dbGetAvailableMonths()
}

export function clearAllData(): void {
  dbClearAllData()
}