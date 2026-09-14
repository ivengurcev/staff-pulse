import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

import type { OrgNode } from '#server/domain/orgNode'
import type { OrgStore } from '#server/state/orgStore'

export type OrgUpdatedEvent = {
    type: 'node.updated'
    node: OrgNode
}

type Subscriber = (event: OrgUpdatedEvent) => void

export type SseHub = {
    subscribe(subscriber: Subscriber): () => void
    broadcast(event: OrgUpdatedEvent): void
}

export function createSseHub(): SseHub {
    const subscribers = new Set<Subscriber>()

    return {
        subscribe(subscriber) {
            subscribers.add(subscriber)
            return () => {
                subscribers.delete(subscriber)
            }
        },
        broadcast(event) {
            for (const subscriber of subscribers) {
                subscriber(event)
            }
        },
    }
}

export function createApp(store: OrgStore): { app: Hono; hub: SseHub } {
    const hub = createSseHub()
    const app = new Hono()

    app.get('/health', (context) => {
        return context.json({ status: 'ok' })
    })

    app.get('/api/org-tree', (context) => {
        return context.json(store.getNodes())
    })

    app.get('/api/org-tree/events', (context) => {
        return streamSSE(context, async (stream) => {
            await new Promise<void>((resolve) => {
                const unsubscribe = hub.subscribe((event) => {
                    void stream.writeSSE({ data: JSON.stringify(event) })
                })

                stream.onAbort(() => {
                    unsubscribe()
                    resolve()
                })
            })
        })
    })

    return { app, hub }
}
