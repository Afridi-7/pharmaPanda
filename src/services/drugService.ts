import type { Drug } from '@/types'
import { drugs, getDrug } from '@/data/drugs'
import { notFound, request } from './api'

/**
 * Drug knowledge is intentionally thin in the prototype. The service boundary is
 * the important part: `search()` and `get()` map cleanly onto a future curated
 * knowledge base with retrieval, so the pages here will not need rewriting.
 */
export const drugService = {
  async search(query: string): Promise<Drug[]> {
    return request(
      () => {
        const needle = query.trim().toLowerCase()
        if (!needle) return drugs
        return drugs.filter((drug) =>
          [drug.name, drug.genericFor ?? '', drug.drugClass, drug.summary, ...drug.commonUses]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        )
      },
      { latency: 240, label: 'drugService.search' },
    )
  },

  async get(id: string): Promise<Drug> {
    return request(() => getDrug(id) ?? notFound('drug'), { latency: 240, label: 'drugService.get' })
  },

  async related(id: string): Promise<Drug[]> {
    return request(
      () => {
        const drug = getDrug(id)
        if (!drug) return []
        return drugs.filter((d) => d.id !== id).slice(0, 3)
      },
      { latency: 200, label: 'drugService.related' },
    )
  },
}
