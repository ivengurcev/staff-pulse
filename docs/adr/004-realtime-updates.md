# ADR 004: Realtime-обновления через SSE

## Контекст

Дерево и таблица должны обновляться в реальном времени без полного refetch. Поток изменений в основном направлен server → client. Нужно учесть частоту обновлений, обрыв соединения, гонки между resync и уже пришедшими событиями, и не пересчитывать агрегаты целиком на каждое изменение.

## Решение

- Транспорт — SSE (`GET /api/org-tree/events`), а не WebSocket или polling.
- На server один mutable org state (`orgStore`), общий для REST и SSE; детерминированный update loop меняет один узел/одну метрику каждые ~3 с.
- Событие — `{ type: 'node.updated', node: OrgNode }` — полное состояние одного узла как semantic patch; на клиенте валидируется через Zod.
- Client кэш — `OrgSnapshot { nodes, index, aggregates }` в TanStack Query; patch применяется через `queryClient.setQueryData()` и `applyOrgNodePatch()` без полного refetch.
- `OrgAggregate` содержит `weightedPerformanceSum`; `applyOrgNodePatch()` пересчитывает агрегаты только изменённого узла и его предков через delta. Пересчёт агрегатов — `O(depth)`; сам patch дополнительно заменяет узел в `nodes` и в `nodesById` (линейные по числу узлов операции).
- `updatedAt` — версия узла; stale/duplicate patch отбрасывается.
- Reconnect — ручной с exponential backoff (`1s → 2s → 4s → 8s → 16s → max 30s`); после реального reconnect выполняется один race-safe resync: `fetchOrgTree()` → `mergeOrgNodes()` (по `id` + `updatedAt`) → `createOrgSnapshot()`.

## Альтернативы

- WebSocket — отклонён: поток в основном однонаправленный, двусторонний канал не нужен, SSE проще по контракту и reconnect.
- Polling — допустимый вариант по заданию, но отклонён: создаёт регулярные запросы даже при отсутствии изменений и добавляет задержку; для однонаправленного server → client потока SSE проще и экономнее.
- Partial-поля в patch — отклонено: полный `OrgNode` как semantic patch проще валидировать и применять.
- Полный пересчёт агрегатов на каждый patch (`buildOrgAggregates()` за `O(n)`) — отклонён: нужен инкрементальный пересчёт только затронутой ветви.

## Последствия

- UI обновляется без полного refetch; агрегаты пересчитываются только у изменённого узла и его предков.
- `OrgSnapshot` делает index/aggregates переиспользуемыми между REST и realtime.
- `updatedAt`-версия и merge при resync защищают от гонок (старый GET не откатывает более новый SSE-узел).
- Realtime-логика изолирована от UI в `realtime/`; `orgStore`/`updateLoop` не знают про Hono/SSE.
