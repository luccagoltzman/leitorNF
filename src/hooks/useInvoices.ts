import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InvoiceFilters } from '../types/nfe'
import * as invoiceService from '../services/invoices'

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceService.fetchInvoices(filters),
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.fetchInvoiceById(id!),
    enabled: Boolean(id),
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
