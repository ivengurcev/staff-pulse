import { z } from 'zod'

import { orgNodeSchema } from './orgNode.ts'

export const orgUpdatedEventSchema = z.object({
    type: z.literal('node.updated'),
    node: orgNodeSchema,
})

export type OrgUpdatedEvent = z.infer<typeof orgUpdatedEventSchema>

export function parseOrgEvent(payload: unknown): OrgUpdatedEvent {
    return orgUpdatedEventSchema.parse(payload)
}
