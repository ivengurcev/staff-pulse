# Staff Pulse — step/3 POLISH

## Задача

Реализовать только `03 POLISH` — realtime-обновления и UX поверх реализованного CORE.

Не переходить к требованиям BONUS.

## Требования

### Realtime transport

- SSE, endpoint `GET /api/org-tree/events`.
- Сервер: один общий mutable org state в памяти, единый для REST и SSE; один общий server timer на процесс.
- Детерминированный update каждые 3 секунды: один существующий узел, ровно одна метрика по циклу `headcount → budget → performance → …`; `updatedAt` обновляется всегда; `id`/`name`/`parentId` не меняются; значения всегда остаются валидными по `OrgNode` schema (в частности `performance` в 0–100).
- Событие `{ type: 'node.updated', node: OrgNode }` — полное состояние одного узла, runtime validation на клиенте.

### Client cache и patch

- TanStack Query остаётся единственным источником server state; кэш переходит с `OrgNode[]` на `OrgSnapshot` (nodes + index + aggregates).
- Patch через `queryClient.setQueryData()` без полного refetch.
- Инкрементальный пересчёт агрегатов только для изменённого узла и его предков (`O(depth)`); полный build — только initial load / resync.
- `updatedAt` — версия узла; stale/duplicate patch не затирает более новый node.

### Reconnect

- Ручной reconnect с exponential backoff `1s → 2s → 4s → 8s → 16s → max 30s`; сброс после успешного `open`.
- Один full resync (merge по `id` + `updatedAt`, не слепая замена) только после реального reconnect после обрыва; первичный `open` не вызывает resync.

### Connection indicator

- Статусы `connecting` / `online` / `reconnecting` / `offline`; в header точка + текст; на мобильном не скрывается.

### Updated cells

- Подсветка только реально изменившихся числовых ячеек (`totalHeadcount`, `totalBudget`, `averagePerformance`), fade-out ~1.5 с.

### Keyboard navigation

- `ArrowUp` / `ArrowDown`, `Home` / `End`, `Enter` = click row, по видимым строкам после filter/sort.

### Tree animation

- CSS `grid-template-rows: 0fr → 1fr` + `overflow: hidden`; collapsed subtree — `inert`/`aria-hidden`; `prefers-reduced-motion: reduce` отключает transition.

## Что не делать на step/3

Не реализовывать:

- Docker / docker-compose / `.env`;
- Nginx / gzip;
- ограничение production bundle ≤200 КБ gzip;
- AI-поиск;
- fallback на текстовый поиск.

## План

Подробный утверждённый план реализации: `docs/plans/03-polish.md`.

Статус:

- implementation complete;
- automated checks passed;
- manual review passed;
- fixes applied;
- documentation synced;
- ready for `step/3` tag.

Tag `step/3` ещё не создан и ставится только по отдельной команде.
