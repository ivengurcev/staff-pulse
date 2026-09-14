import { Hono } from 'hono'

import { orgTree } from '#server/data/orgTree'

export const app = new Hono()

app.get('/health', (context) => {
    return context.json({ status: 'ok' })
})

app.get('/api/org-tree', (context) => {
    return context.json(orgTree)
})
