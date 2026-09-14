import { useQuery } from '@tanstack/react-query'

import { fetchOrgTree } from './fetchOrgTree.ts'
import { createOrgSnapshot } from '../model/orgSnapshot.ts'

export const ORG_TREE_QUERY_KEY = ['org-tree'] as const

export function useOrgTreeQuery() {
    return useQuery({
        queryKey: ORG_TREE_QUERY_KEY,
        queryFn: async ({ signal }) => {
            const nodes = await fetchOrgTree(signal)
            return createOrgSnapshot(nodes)
        },
        staleTime: 5_000,
    })
}
