import { useQuery } from '@tanstack/react-query'

import { fetchOrgTree } from './fetchOrgTree.ts'

export const ORG_TREE_QUERY_KEY = ['org-tree'] as const

export function useOrgTreeQuery() {
    return useQuery({
        queryKey: ORG_TREE_QUERY_KEY,
        queryFn: ({ signal }) => fetchOrgTree(signal),
        staleTime: 5_000,
    })
}
