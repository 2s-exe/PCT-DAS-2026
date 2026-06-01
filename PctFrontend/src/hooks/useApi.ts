import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type ApiError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }

/**
 * Hook useMutation avec gestion automatique des erreurs Laravel
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void
    successMsg?: string
    invalidate?: string[][]
  }
) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options?.successMsg) toast.success(options.successMsg)
      if (options?.invalidate) {
        options.invalidate.forEach(key => qc.invalidateQueries({ queryKey: key }))
      }
      options?.onSuccess?.(data)
    },
    onError: (err: ApiError) => {
      const msg = err.response?.data?.message
      const errors = err.response?.data?.errors
      if (errors) {
        // Afficher les erreurs de validation Laravel
        const firstError = Object.values(errors)[0]?.[0]
        toast.error(firstError || 'Erreur de validation')
      } else {
        toast.error(msg || 'Une erreur est survenue')
      }
    },
  } as UseMutationOptions<TData, ApiError, TVariables>)
}
