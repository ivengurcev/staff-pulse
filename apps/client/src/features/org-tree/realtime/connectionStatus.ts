export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline'

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
    connecting: 'Подключение…',
    online: 'Онлайн',
    reconnecting: 'Переподключение…',
    offline: 'Офлайн',
}
