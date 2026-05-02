import { useQuery } from '@tanstack/react-query'
import { getTagsByCategories } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_TAGS_BY_CATEGORIES } from '@/lib/dflow/mockData'

export function useTags() {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'tags'],
    queryFn: dummy ? () => MOCK_TAGS_BY_CATEGORIES : getTagsByCategories,
    staleTime: 60 * 60 * 1000,
  })
}
