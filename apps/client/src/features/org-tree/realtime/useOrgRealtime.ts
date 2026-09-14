import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchOrgTree } from '../api/fetchOrgTree.ts'
import { ORG_TREE_QUERY_KEY } from '../api/useOrgTreeQuery.ts'
import { applyOrgNodePatch } from '../model/applyOrgNodePatch.ts'
import { parseOrgEvent } from '../model/orgEvents.ts'
import type { OrgNode } from '../model/orgNode.ts'
import {
    createOrgSnapshot,
    mergeOrgNodes,
    type OrgSnapshot,
} from '../model/orgSnapshot.ts'
import type { ConnectionStatus } from './connectionStatus.ts'

const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

export function useOrgRealtime(): ConnectionStatus {
    const queryClient = useQueryClient()
    const [status, setStatus] = useState<ConnectionStatus>('connecting')

    useEffect(() => {
        let eventSource: EventSource | null = null
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let resyncController: AbortController | null = null
        let attempt = 0
        let hasConnected = false

        const applyPatch = (node: OrgNode): void => {
            queryClient.setQueryData<OrgSnapshot>(ORG_TREE_QUERY_KEY, (current) => {
                if (!current) {
                    return current
                }
                return applyOrgNodePatch(current, node)
            })
        }

        const resync = async (): Promise<void> => {
            if (resyncController) {
                resyncController.abort()
            }
            const controller = new AbortController()
            resyncController = controller

            try {
                const fetched = await fetchOrgTree(controller.signal)
                queryClient.setQueryData<OrgSnapshot>(ORG_TREE_QUERY_KEY, (current) => {
                    if (!current) {
                        return current
                    }
                    return createOrgSnapshot(mergeOrgNodes(current.nodes, fetched))
                })
            } catch {
                if (controller.signal.aborted) {
                    return
                }
                // keep applying SSE patches; a later reconnect can resync again
            } finally {
                if (resyncController === controller) {
                    resyncController = null
                }
            }
        }

        const scheduleReconnect = (): void => {
            if (reconnectTimer !== null) {
                return
            }
            const delay = Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)
            attempt += 1
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null
                connect()
            }, delay)
        }

        const connect = (): void => {
            setStatus(hasConnected ? 'reconnecting' : 'connecting')
            eventSource = new EventSource('/api/org-tree/events')

            eventSource.onopen = () => {
                const wasReconnect = hasConnected
                hasConnected = true
                attempt = 0
                setStatus('online')
                if (wasReconnect) {
                    void resync()
                }
            }

            eventSource.onmessage = (event) => {
                try {
                    const parsed = parseOrgEvent(JSON.parse(event.data))
                    applyPatch(parsed.node)
                } catch {
                    // ignore malformed events
                }
            }

            eventSource.onerror = () => {
                eventSource?.close()
                eventSource = null
                if (!navigator.onLine) {
                    setStatus('offline')
                    return
                }
                setStatus('reconnecting')
                scheduleReconnect()
            }
        }

        const handleOffline = (): void => {
            setStatus('offline')
            eventSource?.close()
            eventSource = null
            if (reconnectTimer !== null) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
        }

        const handleOnline = (): void => {
            connect()
        }

        connect()

        window.addEventListener('offline', handleOffline)
        window.addEventListener('online', handleOnline)

        return () => {
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('online', handleOnline)
            eventSource?.close()
            eventSource = null
            if (reconnectTimer !== null) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
            resyncController?.abort()
            resyncController = null
        }
    }, [queryClient])

    return status
}
