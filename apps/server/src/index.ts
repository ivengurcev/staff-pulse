
import { serve } from '@hono/node-server'

import { app } from '#server/app'

serve({
    fetch: app.fetch,
    port: 3001,
})
