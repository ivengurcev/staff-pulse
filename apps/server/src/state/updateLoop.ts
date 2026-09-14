import type { OrgNode } from '#server/domain/orgNode'
import type { OrgStore } from '#server/state/orgStore'

const TICK_INTERVAL_MS = 3000

const METRIC_CYCLE = ['headcount', 'budget', 'performance'] as const
type Metric = (typeof METRIC_CYCLE)[number]

const HEADCOUNT_MODULO = 100
const BUDGET_STEP = 125_000
const BUDGET_MODULO = 10_000_000
const PERFORMANCE_MODULO = 101

const NEXT_METRIC: Record<Metric, (node: OrgNode) => Partial<OrgNode>> = {
    headcount: (node) => ({ headcount: (node.headcount + 1) % HEADCOUNT_MODULO }),
    budget: (node) => ({ budget: (node.budget + BUDGET_STEP) % BUDGET_MODULO }),
    performance: (node) => ({ performance: (node.performance + 1) % PERFORMANCE_MODULO }),
}

export type UpdateLoop = {
    start(): void
    stop(): void
    tick(): OrgNode | null
}

type UpdateLoopOptions = {
    now?: () => Date
    onUpdate?: (node: OrgNode) => void
}

export function createUpdateLoop(
    store: OrgStore,
    options: UpdateLoopOptions = {},
): UpdateLoop {
    const { now = () => new Date(), onUpdate } = options
    let nodeIndex = 0
    let metricIndex = 0
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = (): OrgNode | null => {
        const nodes = store.getNodes()
        if (nodes.length === 0) {
            return null
        }

        const target = nodes[nodeIndex % nodes.length]
        if (!target) {
            return null
        }

        const metric = METRIC_CYCLE[metricIndex % METRIC_CYCLE.length] ?? 'headcount'

        const updated: OrgNode = {
            ...target,
            ...NEXT_METRIC[metric](target),
            updatedAt: now().toISOString(),
        }

        store.replaceNode(updated)
        onUpdate?.(updated)

        nodeIndex += 1
        metricIndex += 1

        return updated
    }

    return {
        tick,
        start() {
            if (timer === null) {
                timer = setInterval(tick, TICK_INTERVAL_MS)
            }
        },
        stop() {
            if (timer !== null) {
                clearInterval(timer)
                timer = null
            }
        },
    }
}
