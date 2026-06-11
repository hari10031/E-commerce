import { cache } from 'react'
import { api } from '@/lib/api'
import type { Category } from '@/types'

export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    return await api.get<Category[]>('/api/categories')
  } catch {
    return []
  }
})
