import { useEffect, useState } from 'react'
import { useTransactionStore } from '../stores/transactionStore'

export function useInitStore() {
  const { isInitialized, initialize, error } = useTransactionStore()
  const [initError, setInitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      setIsLoading(true)
      initialize()
        .catch((e) => {
          setInitError(e instanceof Error ? e.message : '初始化失败')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isInitialized, initialize, isLoading])

  useEffect(() => {
    if (error) {
      setInitError(error)
    }
  }, [error])

  return { isInitialized, initError }
}