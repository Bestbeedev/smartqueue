import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/axios'
import { toast } from 'sonner'

interface UseApiDataOptions<T> {
  initialData?: T | null
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  showToast?: boolean
}

interface UseApiDataReturn<T> {
  data: T | null
  loading: boolean
  refreshing: boolean
  error: string | null
  load: () => Promise<void>
  refresh: () => Promise<void>
  setData: (data: T | null) => void
}

export function useApiData<T>(
  endpoint: string,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const { 
    initialData = null, 
    onSuccess, 
    onError, 
    showToast = true 
  } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((error: any) => {
    const status = error?.response?.status
    let errorMessage = 'Erreur lors du chargement des données'

    switch (status) {
      case 401:
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        break
      case 403:
        errorMessage = 'Accès refusé. Permissions requises.'
        break
      case 404:
        errorMessage = 'Endpoint non trouvé. Vérifiez l\'API.'
        break
      case 422:
        errorMessage = 'Données invalides. Vérifiez votre requête.'
        break
      case 429:
        errorMessage = 'Trop de requêtes. Veuillez réessayer plus tard.'
        break
      default:
        if (status >= 500) {
          errorMessage = 'Erreur serveur. Contactez l\'administrateur.'
        } else if (error?.message) {
          errorMessage = error.message
        }
    }

    setError(errorMessage)
    if (showToast) {
      toast.error(errorMessage)
    }
    onError?.(error)
  }, [showToast, onError])

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await api.get(endpoint)
      const responseData = response.data?.data || response.data

      // Handle different response formats
      const processedData = Array.isArray(responseData) ? responseData : responseData

      setData(processedData)
      onSuccess?.(processedData)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, onSuccess, handleError])

  const load = useCallback(() => loadData(false), [loadData])
  const refresh = useCallback(() => loadData(true), [loadData])

  // Auto-load on mount
  useEffect(() => {
    if (initialData === null) {
      load()
    }
  }, [load, initialData])

  return {
    data,
    loading,
    refreshing,
    error,
    load,
    refresh,
    setData
  }
}

// Hook for paginated data
export function usePaginatedApiData<T>(
  endpoint: string,
  options: UseApiDataOptions<T> & { perPage?: number } = {}
) {
  const { perPage = 100, ...apiOptions } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: perPage,
    last_page: 1
  })

  const handleError = useCallback((error: any) => {
    const status = error?.response?.status
    let errorMessage = 'Erreur lors du chargement des données'

    switch (status) {
      case 401:
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        break
      case 403:
        errorMessage = 'Accès refusé. Permissions requises.'
        break
      case 404:
        errorMessage = 'Endpoint non trouvé. Vérifiez l\'API.'
        break
      case 422:
        errorMessage = 'Données invalides. Vérifiez votre requête.'
        break
      case 429:
        errorMessage = 'Trop de requêtes. Veuillez réessayer plus tard.'
        break
      default:
        if (status >= 500) {
          errorMessage = 'Erreur serveur. Contactez l\'administrateur.'
        } else if (error?.message) {
          errorMessage = error.message
        }
    }

    setError(errorMessage)
    toast.error(errorMessage)
    apiOptions.onError?.(error)
  }, [apiOptions])

  const loadData = useCallback(async (params: Record<string, any> = {}, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await api.get(endpoint, { 
        params: { per_page: perPage, ...params } 
      })
      
      const responseData = response.data
      const items = responseData?.data || responseData.data || []
      const paginationData = {
        current_page: responseData.current_page || 1,
        total: responseData.total || 0,
        per_page: responseData.per_page || perPage,
        last_page: responseData.last_page || 1
      }

      setData(Array.isArray(items) ? items : [])
      setPagination(paginationData)
      apiOptions.onSuccess?.(items)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, perPage, apiOptions, handleError])

  const load = useCallback((params?: Record<string, any>) => loadData(params, false), [loadData])
  const refresh = useCallback((params?: Record<string, any>) => loadData(params, true), [loadData])

  useEffect(() => {
    load()
  }, [load])

  return {
    data,
    loading,
    refreshing,
    error,
    pagination,
    load,
    refresh,
    setData
  }
}
