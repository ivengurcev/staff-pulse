# Архитектура

Документ описывает реализованные `step/1 — FOUNDATION` и `step/2 — CORE`.

## Workspace

Проект организован как pnpm workspace с двумя приложениями:

```text
apps/client    browser application
apps/server    mock HTTP API
```

Client и server имеют независимые TypeScript-конфигурации. Client использует Vite alias `@/*`, server — нативные Node.js package imports `#server/*`.

## Server

Server разделён на четыре части:

- `domain/orgNode.ts` — TypeScript-контракт API-узла;
- `data/orgTree.ts` — детерминированный плоский snapshot из 51 узла;
- `app.ts` — Hono application и маршруты;
- `index.ts` — process entry point, открывающий порт 3001.

Разделение `app` и `index` позволяет проверять маршруты через `app.request()` без запуска сетевого порта. Production build выполняет обычный `tsc`; дополнительного bundler или post-processing импортов нет.

CORE не меняет server: агрегация и аналитическая таблица реализованы целиком на client.

## Client

Client организован вокруг feature `org-tree`:

- `api/` — HTTP boundary и TanStack Query hook;
- `model/` — Zod-схема, domain-validation, индексы дерева, агрегаты, ancestors и table model;
- `ui/` — `OrgExplorer`, `OrgTree`, рекурсивный `OrgTreeNode`, `OrgTable`, `ViewToggle`, formatters, hooks и стили.

На уровне приложения находятся единый `QueryClient`, global styles и composition root.

## Поток данных

```text
GET /api/org-tree
    ↓
HTTP status + JSON
    ↓
Zod object validation
    ↓
validateOrgTree()
    ↓
TanStack Query cache
    ↓
buildOrgTreeIndex()          O(n)
    ↓
buildOrgAggregates()         O(n)
    ↓
buildOrgTableRows()
    ↓
debounced filter → sort
    ↓
OrgExplorer → OrgTree / OrgTable
```

`fetchOrgTree()` получает `AbortSignal` от TanStack Query и передаёт его в `fetch`. Ошибка HTTP, JSON parsing, Zod или domain-validation завершает query с ошибкой и приводит UI в error-state.

TanStack Query хранит server state с `staleTime: 5000`. Ручная invalidation не выполняется; для эквивалентных JSON-ответов используется default structural sharing.

## Агрегаты и derived data

Индекс, агрегаты и базовые строки таблицы считаются чистыми model-функциями и мемоизируются через `useMemo` только при изменении `query.data`:

- `index` → `buildOrgTreeIndex()`;
- `aggregates` → `buildOrgAggregates()` (post-order, `O(n)`, взвешенная performance);
- `tableRows` → `buildOrgTableRows()`.

`filteredRows` пересчитываются при изменении `rows` или debounced-фильтра; `sortedRows` — при изменении `filteredRows` или `sort`. Отдельного cache/selector layer поверх TanStack Query нет.

## Владение состоянием

- TanStack Query владеет загруженными данными и состоянием запроса.
- `OrgExplorer` владеет `expandedNodeIds`, `selectedNodeId`, `viewMode`, `sort` и `filterText`.
- `OrgTree`/`OrgTreeNode` получают expansion state, `selectedNodeId` и callback через props.
- `OrgTable` получает строки, `sort`, `selectedNodeId`, `filterText` и callbacks через props.
- API-объекты не содержат UI-флагов.

`selectedNodeId` изменяется только кликом по строке таблицы; при этом `getAncestorIds()` находит предков, которые добавляются в `expandedNodeIds`. Клик по узлу дерева сохраняет expand/collapse и не меняет `selectedNodeId`.

## Responsive layout

Ширина viewport в JavaScript не определяется. Видимость управляется CSS media query (`min-width: 1280px`) в styled-components:

- `>= 1280px` — split-view: дерево слева (40%), таблица справа (60%); переключатель скрыт.
- `< 1280px` — переключатель «Дерево» / «Таблица» управляет `viewMode`; CSS показывает только выбранную панель.

Обе панели остаются смонтированными.

## UI

`OrgExplorer` различает initial loading, error, empty response и success. В success-state плоские данные преобразуются в индексы и агрегаты один раз на ссылку query data, после чего рендерятся дерево и таблица. Корневые Division раскрыты по умолчанию.

Все стили реализованы через styled-components. Realtime transport, incremental updates и keyboard navigation относятся к следующим этапам и здесь не описываются как реализованные.
