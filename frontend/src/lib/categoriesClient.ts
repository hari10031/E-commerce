import { api } from '@/lib/api'
import type { Category } from '@/types'

let categoriesPromise: Promise<Category[]> | null = null

/** Deduped client-side categories fetch (Navbar + CategoryFilter share one request). */
export function fetchCategoriesClient(): Promise<Category[]> {
  if (!categoriesPromise) {
    categoriesPromise = api
      .get<Category[]>('/api/categories')
      .catch((err) => {
        categoriesPromise = null
        throw err
      })
  }
  return categoriesPromise
}
