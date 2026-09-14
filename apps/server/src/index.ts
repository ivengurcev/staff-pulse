import { serve } from '@hono/node-server'

import { createApp } from '#server/app'
import { createOrgStore } from '#server/state/orgStore'
import { createUpdateLoop } from '#server/state/updateLoop'

const store = createOrgStore()
const { app, hub } = createApp(store)

const updateLoop = createUpdateLoop(store, {
    onUpdate: (node) => {
        hub.broadcast({ type: 'node.updated', node })
    },
})

updateLoop.start()

serve({
    fetch: app.fetch,
    port: 3001,
})
