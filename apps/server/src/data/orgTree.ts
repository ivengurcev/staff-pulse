import type { OrgNode } from '#server/domain/orgNode'

const UPDATED_AT = '2026-09-01T00:00:00.000Z'

const organization = [
    {
        name: 'Engineering',
        departments: ['Platform', 'Product Engineering', 'Quality', 'Data'],
    },
    {
        name: 'Operations',
        departments: ['People', 'Finance', 'Legal', 'Workplace'],
    },
    {
        name: 'Commercial',
        departments: ['Sales', 'Marketing', 'Customer Success', 'Partnerships'],
    },
] as const

function buildOrgTree(): OrgNode[] {
    const nodes: OrgNode[] = []
    let ordinal = 0

    const createNode = (
        id: string,
        name: string,
        parentId: string | null,
    ): OrgNode => {
        const nodeOrdinal = ordinal
        ordinal += 1

        return {
            id,
            name,
            parentId,
            headcount: 4 + (nodeOrdinal % 17),
            budget: 250_000 + nodeOrdinal * 125_000,
            performance: 45 + ((nodeOrdinal * 11) % 51),
            updatedAt: UPDATED_AT,
        }
    }

    organization.forEach((division, divisionIndex) => {
        const divisionId = `division-${divisionIndex + 1}`
        nodes.push(createNode(divisionId, division.name, null))

        division.departments.forEach((departmentName, departmentIndex) => {
            const departmentId = `${divisionId}-department-${departmentIndex + 1}`
            nodes.push(createNode(departmentId, departmentName, divisionId))

            for (let teamIndex = 1; teamIndex <= 3; teamIndex += 1) {
                nodes.push(
                    createNode(
                        `${departmentId}-team-${teamIndex}`,
                        `${departmentName} Team ${teamIndex}`,
                        departmentId,
                    ),
                )
            }
        })
    })

    return nodes
}

export const orgTree: readonly OrgNode[] = buildOrgTree()
