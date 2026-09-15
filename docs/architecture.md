# Архитектура

Документ описывает реализованные `step/1 — FOUNDATION`, `step/2 — CORE` и `step/3 — POLISH`.

## Workspace

Проект организован как pnpm workspace с двумя приложениями:

```text
apps/client    browser application
apps/server    mock HTTP API
```

Client и server имеют независимые TypeScript-конфигурации. Client использует Vite alias `@/*`, server — нативные Node.js package imports `#server/*`.

## Server

Server разделён на несколько частей:

- `domain/orgNode.ts` — TypeScript-контракт API-узла;
- `data/orgTree.ts` — детерминированный плоский начальный snapshot из 51 узла;
- `state/orgStore.ts` — mutable in-memory org state, единый источник для REST и SSE;
- `state/updateLoop.ts` — детерминированный update loop: один узел/одна метрика каждые ~3 с;
- `app.ts` — Hono application и маршруты `/health`, `/api/org-tree`, `GET /api/org-tree/events`;
- `index.ts` — process entry point: создаёт store, запускает update loop, связывает `onUpdate` с SSE broadcast.

Разделение `app` и `index` позволяет проверять маршруты через `app.request()` без запуска сетевого порта. Production build выполняет обычный `tsc`; дополнительного bundler или post-processing импортов нет.

Store, update loop и SSE transport разделены: `orgStore`/`updateLoop` не знают про Hono/SSE; SSE transport (`createSseHub`) только подписывает клиентов и рассылает события, не меняя данные. REST и SSE читают один и тот же store. Один общий server timer на процесс; изменения детерминированные (по кругу, без `Math.random()`), значения всегда валидны по `OrgNode` schema, `id`/`name`/`parentId` не меняются.

## Client

Client организован вокруг feature `org-tree`:

- `api/` — HTTP boundary и TanStack Query hook;
- `model/` — Zod-схема, domain-validation, индексы дерева, агрегаты, ancestors, snapshot, event-контракт и patch;
- `realtime/` — `useOrgRealtime` (EventSource, backoff, reconnect, статусы) и `connectionStatus`;
- `ui/` — `OrgExplorer`, `OrgTree`, рекурсивный `OrgTreeNode`, `OrgTable`, `ViewToggle`, `ConnectionIndicator`, formatters, hooks и стили.

На уровне приложения находятся единый `QueryClient`, global styles и composition root.

## Поток данных

```text
initial / resync
    GET /api/org-tree → fetchOrgTree() (Zod + validateOrgTree)
    → OrgNode[] → createOrgSnapshot() → OrgSnapshot → TanStack Query cache
        ↓
    buildOrgTableRows() → debounced filter → sort → OrgExplorer → OrgTree / OrgTable

realtime
    GET /api/org-tree/events (SSE) → parseOrgEvent() (Zod)
    → queryClient.setQueryData(applyOrgNodePatch(snapshot, node))
    → обновившиеся ячейки подсвечиваются
```

`fetchOrgTree()` получает `AbortSignal` от TanStack Query и передаёт его в `fetch`. Ошибка HTTP, JSON parsing, Zod или domain-validation завершает query с ошибкой и приводит UI в error-state.

TanStack Query хранит server state (`OrgSnapshot`) с `staleTime: 5000`, query key — `['org-tree']`. Realtime-патчи применяются через `queryClient.setQueryData()` без полного refetch.

## Агрегаты и derived data

Индекс, агрегаты и базовые строки таблицы считаются чистыми model-функциями и мемоизируются через `useMemo` только при изменении `query.data`:

- `index` → `buildOrgTreeIndex()`;
- `aggregates` → `buildOrgAggregates()` (post-order, `O(n)`, взвешенная performance);
- `tableRows` → `buildOrgTableRows()`.

`filteredRows` пересчитываются при изменении `rows` или debounced-фильтра; `sortedRows` — при изменении `filteredRows` или `sort`. Отдельного cache/selector layer поверх TanStack Query нет.

При realtime-патче полный `buildOrgAggregates()` не вызывается: `OrgAggregate` содержит `weightedPerformanceSum`, а `applyOrgNodePatch()` пересчитывает агрегаты только изменённого узла и его предков через delta. Пересчёт агрегатов — `O(depth)`; сам patch дополнительно заменяет узел в `nodes` и в `nodesById` (линейные по числу узлов операции).

## Realtime

- Endpoint `GET /api/org-tree/events` (SSE). Событие: `{ type: 'node.updated', node: OrgNode }` — полное состояние одного узла.
- Клиент: `useOrgRealtime()` держит `EventSource`, валидирует каждое сообщение через `parseOrgEvent()` (Zod) и применяет `applyOrgNodePatch()` через `queryClient.setQueryData()`.
- `updatedAt` — версия узла; stale/duplicate patch отбрасывается (не затирает более новый узел).
- Reconnect — ручной, с exponential backoff `1s → 2s → 4s → 8s → 16s → max 30s`; после `open` backoff сбрасывается. Первичный `open` не делает resync; после реального reconnect выполняется один resync: `fetchOrgTree()` → `mergeOrgNodes()` (по `id` + `updatedAt`) → `createOrgSnapshot()`.
- Статусы соединения: `connecting` / `online` / `reconnecting` / `offline`; показываются в header (`ConnectionIndicator`).

## Владение состоянием

- TanStack Query владеет загруженными данными (`OrgSnapshot`) и состоянием запроса.
- `useOrgRealtime` владеет connection status, `EventSource`, backoff timer и применяет patches.
- `OrgExplorer` владеет `expandedNodeIds`, `selectedNodeId`, `viewMode`, `sort` и `filterText`.
- `OrgTree`/`OrgTreeNode` получают expansion state, `selectedNodeId`, `onToggle` и `onSelectNode` через props.
- `OrgTable` получает строки, `sort`, `selectedNodeId`, `onSortAsc`/`onSortDesc` и `onSelectRow` через props; search находится в header `OrgExplorer`; подсветка обновившихся ячеек и активная строка — локальное transient-состояние таблицы.
- API-объекты не содержат UI-флагов.

Selection двусторонний: клик по строке таблицы устанавливает `selectedNodeId`, раскрывает предков через `getAncestorIds()` и задаёт `viewMode = 'tree'`; клик по содержимому узла дерева устанавливает `selectedNodeId` и задаёт `viewMode = 'table'`. Chevron — отдельная кнопка только для expand/collapse. Selection не сбрасывает filter/sort; выбранный видимый узел/строка прокручивается через `scrollIntoView({ block: 'nearest' })`.

## Responsive layout

Ширина viewport в JavaScript не определяется. Видимость управляется CSS media query (`min-width: 1280px`) в styled-components:

- Header `position: sticky`, `top: 0`, непрозрачный фон; слева бренд и индикатор соединения, справа search; на `<1280` там же переключатель.
- `>= 1280px` — split-view: sticky-дерево слева (330–360 px, собственный `overflow-y: auto`) и таблица на оставшемся пространстве; переключатель скрыт.
- `< 1280px` — переключатель в header управляет `viewMode`; CSS показывает только выбранную панель.

Обе панели остаются смонтированными. Desktop-высота header, gap и нижний viewport-gap задаются общими CSS custom properties, чтобы header и tree использовали один источник размеров.

## UI

`OrgExplorer` различает initial loading, error, empty response и success. В success-state рендерятся дерево и таблица. Корневые Division раскрыты по умолчанию.

- Единственный search input находится в sticky-шапке и фильтрует только таблицу.
- Уровень узла отображается цветным маркером в дереве и цветным badge в таблице через единое presentation-сопоставление `orgTableFormat`.
- `ConnectionIndicator` показывает точку + текст статуса соединения; на мобильном не скрывается.
- После realtime-патча подсвечиваются только реально изменившиеся числовые ячейки (`totalHeadcount`, `totalBudget`, `averagePerformance`), fade ~1.5 с; `name`/`level` не подсвечиваются.
- Keyboard navigation таблицы: `ArrowUp`/`ArrowDown`, `Home`/`End`, `Enter` = click row, по видимым строкам; фокус визуально видим.
- Анимация раскрытия дерева — CSS `grid-template-rows: 0fr → 1fr` + `overflow: hidden`; collapsed subtree помечается `inert`/`aria-hidden`; `prefers-reduced-motion: reduce` отключает transition; smooth-scroll строки учитывает reduced motion.

Все стили реализованы через styled-components.
