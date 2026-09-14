import type { ConnectionStatus } from '../realtime/connectionStatus.ts'
import { CONNECTION_STATUS_LABELS } from '../realtime/connectionStatus.ts'
import { ConnectionBox, ConnectionDot, ConnectionText } from './orgTree.styles.ts'

type ConnectionIndicatorProps = {
    status: ConnectionStatus
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
    return (
        <ConnectionBox role="status" aria-live="polite">
            <ConnectionDot $status={status} aria-hidden="true" />
            <ConnectionText>{CONNECTION_STATUS_LABELS[status]}</ConnectionText>
        </ConnectionBox>
    )
}
