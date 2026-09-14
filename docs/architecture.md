# Архитектура FOUNDATION

Документ описывает только реализованный `step/1 — FOUNDATION`.

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

## Client

Client организован вокруг feature `org-tree`:

- `api/` — HTTP boundary и TanStack Query hook;
- `model/` — Zod-схема, domain-validation и индексы дерева;
- `ui/` — `OrgExplorer`, `OrgTree`, рекурсивный `OrgTreeNode` и стили.

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
buildOrgTreeIndex()
    ↓
OrgExplorer → OrgTree → OrgTreeNode
```

`fetchOrgTree()` получает `AbortSignal` от TanStack Query и передаёт его в `fetch`. Ошибка HTTP, JSON parsing, Zod или domain-validation завершает query с ошибкой и приводит UI в error-state.

TanStack Query хранит server state с `staleTime: 5000`. На FOUNDATION ручной invalidation нет; для эквивалентных JSON-ответов используется default structural sharing.

## Владение состоянием

- TanStack Query владеет загруженными данными и состоянием запроса.
- `OrgExplorer` владеет `expandedNodeIds`.
- `OrgTree` и `OrgTreeNode` получают expansion state и callback через props.
- API-объекты не содержат UI-флагов.

Такое разделение оставляет server data неизменяемыми и не прячет состояние раскрытия внутри рекурсивных узлов.

## UI

`OrgExplorer` различает initial loading, error, empty response и success. В success-state плоские данные преобразуются в индексы один раз на ссылку query data. Корневые Division раскрыты по умолчанию, поэтому видны Division и Department, а Team появляются после раскрытия Department.

Все стили реализованы через styled-components. Агрегация, аналитическая таблица, realtime transport и incremental updates на FOUNDATION отсутствуют.
