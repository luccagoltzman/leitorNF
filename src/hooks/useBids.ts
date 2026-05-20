import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BidInput } from '../types/nfe'
import * as bidsService from '../services/bids'

export function useBids() {
  return useQuery({
    queryKey: ['bids'],
    queryFn: bidsService.fetchBids,
  })
}

export function useCreateBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      userId,
    }: {
      input: BidInput
      userId: string
    }) => bidsService.createBid(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] })
    },
  })
}

export function useUpdateBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BidInput }) =>
      bidsService.updateBid(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

export function useDeleteBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bidsService.deleteBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
