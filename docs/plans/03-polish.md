# Staff Pulse POLISH Implementation Plan

> **Статус:** step/3 architecture approved; implementation has not started.

**Goal:** Добавить realtime-обновления (SSE) и UX: живой патч узлов без полного refetch, инкрементальный пересчёт агрегатов, connection indicator с exponential backoff, подсветку обновившихся ячеек, keyboard navigation таблицы и анимацию раскрытия дерева с учётом `prefers-reduced-motion`.

**Architecture:** Сервер хранит один mutable org state в памяти; REST `GET /api/org-tree` и SSE `GET /api/org-tree/events` читают одно состояние, детерминированный timer меняет один узел каждые 3 секунды. Client остаётся на TanStack Query: query cache переходит с `OrgNode[]` на `OrgSnapshot` (nodes + index + aggregates), SSE-патчи применяются через `queryClient.setQueryData()` с инкрементальным пересчётом агрегатов по цепочке предков.

**Tech Stack:** без изменений — Node.js 24.19, pnpm 12.4.1, TypeScript 6, Hono, React 19, Vite 8, TanStack Query, Zod, styled-components, встроенный `node:test`. Новых библиотек нет (SSE — нативный EventSource, анимация — CSS, keyboard navigation — вручную).

**Spec:** `docs/task.md` (03 POLISH), `docs/steps.md` (step/3), `docs/decisions.md` (POLISH), `docs/clarifications.md`.

## Global Constraints

- Реализовать только `step/3 — POLISH`; не добавлять Docker/Nginx/`.env` и AI-search (step/4).
- Не менять контракт `GET /api/org-tree` и существующий `OrgNode`; `id`/`name`/`parentId` в realtime не меняются.
- Не добавлять новые зависимости (realtime, animation, keyboard navigation — без библиотек).
- TanStack Query остаётся единственным источником server state.
- `OrgExplorer` не разбирает SSE самостоятельно; realtime-логика изолирована от UI.
- Обычный realtime update — `O(depth)`; полный `buildOrgAggregates()` — только initial load / resync.
- Не создавать commit/tag без отдельной команды пользователя.

## File Map

### Server

- `apps/server/src/state/orgStore.ts` — mutable in-memory org state, единый источник для REST и SSE.
- `apps/server/src/state/updateLoop.ts` — детерминированный timer: один узел/одна метрика каждые 3 с.
- `apps/server/src/app.ts` — маршруты `/health`, `/api/org-tree`, `GET /api/org-tree/events`.
- `apps/server/src/index.ts` — создаёт store, запускает update loop, поднимает сервер.
- `apps/server/tests/updateLoop.test.ts` — детерминированность update.
- `apps/server/tests/app.test.ts` — REST + SSE contract (где практично).

### Client — api

- `apps/client/src/features/org-tree/api/fetchOrgTree.ts` — остаётся network boundary: `fetch` + runtime validation, возвращает валидный `OrgNode[]`.
- `apps/client/src/features/org-tree/api/useOrgTreeQuery.ts` — `queryFn` возвращает `OrgSnapshot` (через `createOrgSnapshot`).

### Client — model

- `apps/client/src/features/org-tree/model/orgSnapshot.ts` — `OrgSnapshot`, `createOrgSnapshot()`, `mergeOrgNodes()`.
- `apps/client/src/features/org-tree/model/orgEvents.ts` — Zod-схема события, `parseOrgEvent()`.
- `apps/client/src/features/org-tree/model/applyOrgNodePatch.ts` — `applyOrgNodePatch()`, инкрементальные агрегаты и delta.
- `apps/client/src/features/org-tree/model/buildOrgAggregates.ts` — расширить внутренний aggregate полем `weightedPerformanceSum`.

### Client — realtime

- `apps/client/src/features/org-tree/realtime/connectionStatus.ts` — `ConnectionStatus` и тексты статусов.
- `apps/client/src/features/org-tree/realtime/useOrgRealtime.ts` — EventSource, backoff, reconnect, `setQueryData`.

### Client — UI

- `apps/client/src/features/org-tree/ui/ConnectionIndicator.tsx` — индикатор в header.
- `apps/client/src/features/org-tree/ui/OrgTable.tsx` — keyboard navigation + подсветка обновившихся ячеек.
- `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx` / `orgTree.styles.ts` — CSS-анимация раскрытия.
- `apps/client/src/features/org-tree/ui/OrgExplorer.tsx` — подключить realtime hook и индикатор.

### Client — tests

- `apps/client/tests/orgSnapshot.test.ts`
- `apps/client/tests/applyOrgNodePatch.test.ts`
- `apps/client/tests/orgEvents.test.ts`

### Documentation (обновляется на этапе реализации)

- `docs/architecture.md`
- `docs/data-model.md`

## Data Contracts and Algorithms

### SSE event

```ts
type OrgUpdatedEvent = {
    type: 'node.updated'
    node: OrgNode
}
```

`GET /api/org-tree/events` — поток `data:` строк с JSON-событиями. Отправляется полное новое состояние одного `OrgNode` (не partial fields). Клиент валидирует `unknown` через Zod.

### Server state

`orgStore` хранит плоский `OrgNode[]` и предоставляет общий доступ для REST и SSE. `updateLoop` каждые 3 секунды выбирает следующий узел по кругу и меняет ровно одну метрику по циклу `headcount → budget → performance → …`, всегда обновляя `updatedAt`. Изменения детерминированные (индексы/счётчики, без `Math.random()`). Значения всегда остаются валидными по `OrgNode` schema: `headcount` — целое неотрицательное, `budget` — конечное неотрицательное, `performance` остаётся в диапазоне 0–100 (например, циклически с заворачиванием), `updatedAt` — ISO datetime.

### OrgSnapshot

```ts
type OrgSnapshot = {
    nodes: readonly OrgNode[]
    index: OrgTreeIndex
    aggregates: ReadonlyMap<string, OrgAggregate>
}

function createOrgSnapshot(nodes: readonly OrgNode[]): OrgSnapshot
```

`createOrgSnapshot` принимает уже валидный `OrgNode[]` (после runtime validation в `fetchOrgTree`) и строит index и полные aggregates за `O(n)`; повторную Zod-валидацию внутри не выполняет. `fetchOrgTree()` остаётся network boundary (fetch + runtime validation), а `queryFn` в `useOrgTreeQuery` возвращает `OrgSnapshot`.

### Incremental aggregate

Внутренний aggregate расширяется полем `weightedPerformanceSum` для delta-обновления:

```ts
type OrgAggregate = {
    nodeId: string
    level: number
    totalHeadcount: number
    totalBudget: number
    weightedPerformanceSum: number
    averagePerformance: number | null
}
```

Для изменённого узла delta:

- `Δheadcount = new.headcount - old.headcount`;
- `Δbudget = new.budget - old.budget`;
- `ΔweightedPerformanceSum = new.performance * new.headcount - old.performance * old.headcount`.

Delta применяется только к цепочке `updated node → parent → … → root` (`O(depth)`). `averagePerformance` пересчитывается как `weightedPerformanceSum / totalHeadcount` (или `null` при нулевом `totalHeadcount`).

### applyOrgNodePatch

```ts
function applyOrgNodePatch(
    snapshot: OrgSnapshot,
    node: OrgNode,
): OrgSnapshot
```

- `updatedAt` нового node должен быть строго новее текущего; stale/duplicate patch отбрасывается.
- Заменяется один `OrgNode` в `nodes`; `index` сохраняется (структура дерева не меняется).
- Инкрементально обновляются агрегаты узла и его предков; прочие агрегаты не изменяются.
- Возвращается новый snapshot без мутации старого.

### Reconnect / backoff

Не полагаться на встроенную стратегию EventSource. На error — закрыть EventSource, переподключаться вручную с exponential backoff `1s → 2s → 4s → 8s → 16s → max 30s`. После успешного `open` backoff сбрасывается. При unmount — закрыть EventSource и очистить reconnect timer.

Первичный успешный `open` EventSource не вызывает дополнительный resync: cache уже получен initial `GET /api/org-tree`. Full resync выполняется только после реального reconnect после обрыва.

### Resync / merge

Full resync после reconnect не заменяет cache слепо. Если во время `GET` уже пришёл более новый SSE patch:

- сравнить `nodes` из cache и `nodes` из fetched по `id` + `updatedAt`;
- для каждого node сохранить более новую версию;
- после merge один раз полностью построить index/aggregates за `O(n)`;
- затем снова применять обычные SSE patches за `O(depth)`.

```ts
function mergeOrgNodes(
    current: readonly OrgNode[],
    fetched: readonly OrgNode[],
): readonly OrgNode[]
```

Возвращает массив, где каждый `id` представлен более новой версией по `updatedAt`; затем `createOrgSnapshot()` перестраивает snapshot за `O(n)`.

### Connection status

```ts
type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline'
```

Тексты: «Подключение…», «Онлайн», «Переподключение…», «Офлайн». В header — точка + текст; цвет только дополнительный сигнал. На мобильном индикатор не скрывается.

### Updated cells

Подсветка только числовых ячеек `totalHeadcount`, `totalBudget`, `averagePerformance`, значение которых реально изменилось. Обновление Team может подсветить Team, Department и Division. Fade-out ~1.5 с. `name`/`level` не подсвечиваются. Отдельной realtime-подсветки дерева нет.

### Keyboard navigation

`ArrowUp`/`ArrowDown` — смена активной строки; `Home`/`End` — первая/последняя видимая строка; `Enter` = click row. Работает по видимым (отфильтрованным/отсортированным) строкам. Фокус визуально видим. Таблица не превращается в spreadsheet/grid navigation по отдельным ячейкам.

### Tree animation

CSS wrapper `display: grid` + `grid-template-rows: 0fr → 1fr` и `overflow: hidden`. Без animation library и без JS-измерения `scrollHeight`. При `prefers-reduced-motion: reduce` transition полностью отключается.

Collapsed subtree остаётся смонтированным ради CSS height transition, поэтому его интерактивные элементы помечаются `inert` и/или `aria-hidden="true"` (или эквивалентно) и не попадают в keyboard focus / accessibility tree.

## State Ownership

- TanStack Query владеет `OrgSnapshot` (query key `['org-tree']`).
- `useOrgRealtime` владеет connection status, EventSource и backoff timer; применяет patch через `queryClient.setQueryData()`.
- `OrgExplorer` владеет UI-state (`expandedNodeIds`, `selectedNodeId`, `viewMode`, `sort`, `filterText`) и получает snapshot и connection status из hooks.
- Подсветка обновившихся ячеек и keyboard navigation — локальный UI-state таблицы.

## Data Flow (realtime)

```text
initial / resync
    GET /api/org-tree → fetchOrgTree() (validate) → OrgNode[] → createOrgSnapshot() → OrgSnapshot → cache

realtime
    GET /api/org-tree/events (SSE)
        → parseOrgEvent() (Zod)
        → queryClient.setQueryData(applyOrgNodePatch(snapshot, node))
        → обновившиеся ячейки подсвечиваются
```

## Tasks

### Task 1: Server mutable state и deterministic update loop

**Files:**

- Create: `apps/server/src/state/orgStore.ts`
- Create: `apps/server/src/state/updateLoop.ts`
- Create: `apps/server/tests/updateLoop.test.ts`

- [ ] **Step 1:** Написать failing-тесты детерминированного update (один узел за tick, одна метрика по циклу, `updatedAt` всегда растёт, `id`/`name`/`parentId` неизменны).
- [ ] **Step 2:** Реализовать `orgStore` (mutable snapshot) и `updateLoop` (общий timer на процесс, 3 с, по кругу).
- [ ] **Step 3:** Запустить server tests.

### Task 2: SSE endpoint и event contract

**Files:**

- Modify: `apps/server/src/app.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `apps/server/tests/app.test.ts`

- [ ] **Step 1:** Добавить `GET /api/org-tree/events` (SSE), читающий тот же store; `GET /api/org-tree` отдаёт текущее состояние store.
- [ ] **Step 2:** Покрыть contract тестами где практично (event type `node.updated`, полный `OrgNode`).
- [ ] **Step 3:** Запустить server tests и build.

### Task 3: Client snapshot, incremental aggregates, patch

**Files:**

- Create: `apps/client/src/features/org-tree/model/orgSnapshot.ts`
- Create: `apps/client/src/features/org-tree/model/orgEvents.ts`
- Create: `apps/client/src/features/org-tree/model/applyOrgNodePatch.ts`
- Modify: `apps/client/src/features/org-tree/model/buildOrgAggregates.ts`
- Create: `apps/client/tests/orgSnapshot.test.ts`
- Create: `apps/client/tests/applyOrgNodePatch.test.ts`
- Create: `apps/client/tests/orgEvents.test.ts`

- [ ] **Step 1:** Написать failing-тесты: snapshot creation; weighted performance delta; update только node + ancestors; stale/duplicate `updatedAt`; untouched aggregates remain unchanged; resync merge (старый fetched snapshot не откатывает более новый SSE node в cache).
- [ ] **Step 2:** Реализовать `createOrgSnapshot`, расширенный aggregate, `applyOrgNodePatch`, Zod-схему события и `parseOrgEvent`.
- [ ] **Step 3:** Запустить client tests.

### Task 4: Client realtime hook (EventSource, backoff, status)

**Files:**

- Create: `apps/client/src/features/org-tree/realtime/connectionStatus.ts`
- Create: `apps/client/src/features/org-tree/realtime/useOrgRealtime.ts`

- [ ] **Step 1:** Реализовать `useOrgRealtime` — EventSource, ручной reconnect с exponential backoff, статусы, patch через `setQueryData`, resync после reconnect, очистка при unmount.

### Task 5: UI (connection indicator, cell fade, keyboard nav, tree animation)

**Files:**

- Create: `apps/client/src/features/org-tree/ui/ConnectionIndicator.tsx`
- Modify: `apps/client/src/features/org-tree/ui/OrgTable.tsx`
- Modify: `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx`
- Modify: `apps/client/src/features/org-tree/ui/orgTree.styles.ts`
- Modify: `apps/client/src/features/org-tree/ui/OrgExplorer.tsx`

- [ ] **Step 1:** Connection indicator в header (точка + текст; на мобильном не скрывать).
- [ ] **Step 2:** Подсветка обновившихся числовых ячеек (fade-out ~1.5 с).
- [ ] **Step 3:** Keyboard navigation таблицы (ArrowUp/Down, Home/End, Enter).
- [ ] **Step 4:** Анимация раскрытия дерева через `grid-template-rows: 0fr → 1fr`, `overflow: hidden`, отключение при `prefers-reduced-motion: reduce`.
- [ ] **Step 5:** Подключить realtime hook и индикатор в `OrgExplorer`.

### Task 6: Verify and document POLISH

**Files:**

- Modify: `docs/architecture.md`
- Modify: `docs/data-model.md`

- [ ] **Step 1:** Автоматические проверки:

```bash
pnpm --filter @staff-pulse/server test
pnpm --filter @staff-pulse/client test
pnpm --filter @staff-pulse/client lint
pnpm build
```

- [ ] **Step 2:** Ручные проверки: realtime update ~3 с; нет full refetch при обычном realtime; один resync после reconnect; connection indicator; exponential backoff; cell fade; keyboard navigation; tree animation; `prefers-reduced-motion`.
- [ ] **Step 3:** Обновить `docs/architecture.md` и `docs/data-model.md` фактическим реализованным realtime-контрактом.

## Review Checklist

- [ ] Server: один mutable store для REST и SSE; детерминированный update (одна метрика за tick, `updatedAt` всегда, `id`/`name`/`parentId` неизменны).
- [ ] SSE: `GET /api/org-tree/events`, событие `node.updated` с полным `OrgNode`.
- [ ] Client: `fetchOrgTree` остаётся network boundary + validation; `queryFn` возвращает `OrgSnapshot`; patch через `setQueryData`; index сохраняется.
- [ ] Агрегаты: `weightedPerformanceSum` для delta; update только node + ancestors; `O(depth)`; полный build только на initial/resync.
- [ ] Versioning/resync: stale/duplicate `updatedAt` не затирает новый node; resync после reconnect выполняет merge по `id` + `updatedAt`, а не слепую замену; первичный open не вызывает resync.
- [ ] Reconnect: ручной, exponential backoff 1s→2s→4s→8s→16s→max 30s, сброс после open, очистка при unmount.
- [ ] Connection indicator: статусы connecting/online/reconnecting/offline, текст обязателен, не скрывается на мобильном.
- [ ] Подсветка только реально изменившихся числовых ячеек; fade ~1.5 с; name/level не подсвечиваются; без отдельной подсветки дерева.
- [ ] Keyboard navigation по видимым строкам (ArrowUp/Down, Home/End, Enter = click); фокус видим; не grid по ячейкам.
- [ ] Анимация дерева через `grid-template-rows: 0fr → 1fr` + `overflow: hidden`; collapsed subtree — `inert`/`aria-hidden`; без library и JS-измерений; `prefers-reduced-motion` отключает transition.
- [ ] Никаких новых dependencies и никакой функциональности step/4.
- [ ] Реализация начинается только после отдельной команды пользователя.
