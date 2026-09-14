# Staff Pulse — обсуждения и принятые решения

Этот файл фиксирует решения, которые были приняты в ходе подготовки проекта.
Это не исходное ТЗ работодателя.

## Репозиторий

Название:

```text
staff-pulse
```

Причина:

- короткое;
- нейтральное;
- проект можно показывать как самостоятельную работу;
- не используется название вида `test-task-*`.

## Package manager

Выбран:

```text
pnpm
```

Причины:

- быстрые установки;
- экономия диска;
- строгая работа с зависимостями;
- обычный Node.js runtime;
- понятный lock-файл;
- не добавляет отдельный runtime, как Bun;
- не требует PnP-модели Yarn.

Используемая версия при старте проекта:

```text
pnpm 12.4.1
```

## Node.js

Используемая версия при старте проекта:

```text
Node.js 24.19.0
```

## Vite

Vite используется как готовый frontend toolchain:

- dev server;
- HMR;
- обработка TS/TSX/CSS;
- production build;
- env;
- plugin system.

Это заменяет набор задач, которые ранее можно было собирать вручную через esbuild + собственные скрипты.

## Линтер

Выбран ESLint, а не Oxlint.

Причина:

- ожидаемый вариант для React + TypeScript;
- понятен ревьюеру;
- широкая экосистема;
- скорость линтера в небольшом тестовом проекте не критична.

## Абсолютные импорты

Для client выбран alias Vite/TypeScript:

```text
@ → ./src
```

Пример:

```ts
import App from '@/App.tsx'
```

Для server выбран нативный механизм Node.js package imports:

```text
#server/* → внутренние модули server
```

В `apps/server/package.json` используется условное сопоставление:

```json
"imports": {
    "#server/*": {
        "development": "./src/*.ts",
        "default": "./dist/*.js"
    }
}
```

Development запускается с условием `development`, а собранное приложение использует `default`:

```text
dev:   tsx watch --conditions=development src/index.ts
build: tsc -p tsconfig.json
start: node dist/index.js
```

Различие выбрано сознательно: client использует alias своего toolchain, server — нативный механизм Node.js. Префикс `#server/*` не зависит от относительно новой поддержки specifier-имён вида `#/`.

Server сохраняет обычную сборку через `tsc`. Post-processing alias-импортов и дополнительный bundler не используются.

`baseUrl` не используется, поскольку в TypeScript 6 он deprecated.

## Workspace

Выбрана структура:

```text
staff-pulse/
    apps/
        client/
        server/
```

Причина:

- server является полноценной частью задания;
- позже появятся realtime и Docker;
- явная граница client/server;
- удобнее документировать архитектуру.

## Server

Выбран Hono.

Причина:

- пользователь хорошо с ним знаком;
- подходит для REST;
- подходит для будущего SSE;
- лёгкий;
- TypeScript-friendly.

## TypeScript

Первоначально server подтянул TypeScript 7.

Решено пока сохранить согласованную ветку TypeScript 6.x, чтобы не смешивать версии client/server и не создавать лишнюю несовместимость с текущим tooling.

## Runtime validation

Для client boundary validation выбран Zod.

Причина:

TypeScript не проверяет данные, пришедшие из сети во время выполнения.

## Server state

Для запросов и кэша выбран TanStack Query.

Причины:

- `staleTime`;
- cache;
- request deduplication;
- AbortSignal;
- удобное обновление server state в следующих этапах.

На FOUNDATION:

- `staleTime` равен 5000 мс;
- ручная cache invalidation не выполняется;
- для эквивалентных JSON-ответов используется default structural sharing TanStack Query.

## Test runner

Для FOUNDATION используется встроенный `node:test` из Node.js 24.19.

Отдельную test-runner dependency, например Vitest или Jest, не добавлять.

## Стили

Выбран styled-components.

Причина:

- прямо указан в исходном задании как плюс;
- подходит для typed React UI;
- позволяет избежать inline CSS.

## Realtime

Предварительный выбор для step/3:

```text
SSE
```

Причина:

- поток изменений нужен в основном server → client;
- двусторонний канал WebSocket пока не требуется;
- проще контракт и reconnect.

Это решение ещё не реализовано и может быть пересмотрено перед step/3.

## CORE (step/2)

Решения по аналитической таблице и агрегатам. Утверждены до начала реализации step/2.

### Представление

Responsive-раскладка реализуется только через CSS; ширина viewport в JavaScript не определяется (`useMediaQuery`, `useSyncExternalStore`, resize-listener не используются).

- Шапка (`header`) — `position: sticky`, `top: 0`, непрозрачный фон поверх контента. В ней слева бренд, справа единственный search input; на `<1280` там же находится переключатель.
- При ширине `>= 1280 px` — split-view: слева sticky-дерево шириной ориентировочно 330–360 px под header, справа таблица на всём оставшемся пространстве. Значение `viewMode` на desktop не скрывает панели.
- При ширине `< 1280 px` — переключатель «Дерево» / «Таблица» в sticky-шапке управляет `viewMode`; CSS показывает только выбранную панель.
- Обе панели могут оставаться смонтированными; видимость определяется CSS. Отдельного state ширины viewport нет.
- Существующее дерево FOUNDATION сохраняется.

### Агрегаты

Агрегаты считаются чистой model-функцией:

```ts
type OrgAggregate = {
    nodeId: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}

function buildOrgAggregates(
    nodes: readonly OrgNode[],
    index: OrgTreeIndex,
): ReadonlyMap<string, OrgAggregate>
```

Семантика:

- `totalHeadcount` = headcount текущего узла + headcount всех потомков.
- `totalBudget` = budget текущего узла + budget всех потомков.
- `weightedPerformanceSum` = performance * headcount текущего узла + weightedPerformanceSum всех потомков.
- `averagePerformance` = weightedPerformanceSum / totalHeadcount.

Алгоритм — post-order traversal, `O(n)`.

Если `totalHeadcount === 0`, то `averagePerformance = null`; UI показывает `—`.

`level` — глубина дерева: 0 = Division, 1 = Department, 2 = Team. Русские подписи уровня («Дивизион», «Отдел», «Команда») относятся к presentation layer. Уровень не выводится из id или name.

### Владение UI state

Координирующий UI-state остаётся на уровне `OrgExplorer`:

```ts
selectedNodeId: string | null
viewMode: 'tree' | 'table'
sort: SortState | null          // null = исходное состояние без сортировки (порядок API), не third state внутри колонки
filterText: string
```

Существующий `expandedNodeIds` остаётся там же.

Selection двусторонний:

- Клик по строке таблицы:
  1. `selectedNodeId = row.nodeId`;
  2. чистая model-функция `getAncestorIds(nodeId, index)` находит предков и добавляет их в `expandedNodeIds`;
  3. `viewMode = 'tree'` (на `<1280` показывает и прокручивает дерево до выбранного узла).
- Клик по содержимому узла дерева: `selectedNodeId = nodeId` и `viewMode = 'table'` (на `<1280` показывает и прокручивает соответствующую строку). Раскрытие, filter и sort не меняются.
- Chevron — отдельная кнопка только для expand/collapse; не меняет `selectedNodeId` и `viewMode`.

`selectedNodeId` передаётся и в дерево, и в таблицу; выбранный узел/строка визуально выделяются. После смены selection выбранный видимый узел/строка прокручивается через `scrollIntoView({ block: 'nearest' })`; если строка исключена текущим фильтром, filter/sort не сбрасываются и прокрутка не выполняется.

На desktop обе панели показаны CSS; на `<1280` обработчики задают `viewMode` противоположного представления, не определяя ширину в JavaScript.

### Фильтрация и сортировка

- Фильтр применяется только к таблице; дерево не фильтруется. Единственный search input находится в шапке.
- Фильтр: только по `name`, `trim`, case-insensitive substring match, debounce 250 мс; пустая строка показывает все узлы.
- Показываются только реально совпавшие строки; предков совпавших строк искусственно не добавлять.
- Агрегаты всегда рассчитываются по полному snapshot; фильтрация не влияет на значения агрегатов.
- Сортировка по всем пяти колонкам: `name`, `level`, `totalHeadcount`, `totalBudget`, `averagePerformance`.
- Тип: `SortState = { column: SortColumn; direction: 'asc' | 'desc' }`; состояние — `SortState | null`.
- Начальное `null` — отсутствие сортировки, сохраняется порядок API. Это отдельное исходное состояние до первой сортировки, а не third state внутри выбранной колонки.
- Сравнение `name` — через `localeCompare`; конкретная locale/options — локальная обратимая деталь реализации, не архитектурное решение.
- Обычный клик по заголовку → ASC; double click по заголовку → DESC.
- Для `averagePerformance === null` строки всегда располагаются внизу независимо от направления.

### Memoization / data pipeline

Derived data строятся только при изменении snapshot `query.data`:

```text
query.data
    ↓
buildOrgTreeIndex()          O(n), один раз на snapshot
    ↓
buildOrgAggregates()         O(n), один раз на snapshot
    ↓
OrgTableRow[]                один раз на snapshot
    ↓
debounced filter
    ↓
sort
    ↓
render
```

Тип строки таблицы:

```ts
type OrgTableRow = {
    nodeId: string
    name: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}
```

React `useMemo` используется для index, aggregates, table rows, filtered rows и sorted rows. Отдельный cache/selector layer поверх TanStack Query не создаётся. `buildOrgAggregates()` и `getAncestorIds()` — чистые функции в model layer.

Debounce реализуется локальным `useDebouncedValue(value, 250)` без новой dependency. `useEffect` используется только внутри debounce hook (таймер) и для прокрутки выбранных DOM-элементов (`scrollIntoView`); derived data через `useEffect` не синхронизируются.

### Таблица и форматирование

- Обычная semantic HTML table; TanStack Table и другие table dependency не добавлять.
- Колонки: Подразделение, Уровень, Всего сотрудников, Бюджет суммарный, Средняя эффективность.
- Бюджет: `Intl.NumberFormat('ru-RU')`, итоговый вид `12 345 678 руб.`.
- Performance: один знак после запятой, ru locale, пример `82,9%`; `null` → `—`.
- Уровень показывается цветным badge с единым presentation-сопоставлением (Division — синий, Department — фиолетовый, Team — бирюзовый); в дереве уровень отображается цветным маркером перед названием.
- На обычном desktop таблица не имеет горизонтального скролла; на `<1280` допускается horizontal overflow, обязательные колонки не скрываются.
- В split-view таблица занимает всё оставшееся после sticky-дерева пространство.
- Заголовок сортировки — semantic `<th>` с интерактивной кнопкой внутри; весь `<th>` в произвольный clickable container не превращать. Индикатор сортировки резервирует фиксированный слот (`visibility: hidden`), чтобы его появление не меняло высоту шапки таблицы.
- Keyboard navigation не добавляется — это step/3 POLISH.
