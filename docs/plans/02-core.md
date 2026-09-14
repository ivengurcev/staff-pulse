# Staff Pulse CORE Implementation Plan

> **Статус:** реализован; ручное ревью и все проверки пройдены. `step/2` готов к закрытию и тегированию; commit и tag `step/2` создаются только по отдельной команде.

**Goal:** Добавить аналитическую таблицу с агрегированными показателями поверх существующего интерактивного дерева FOUNDATION: агрегаты `headcount`/`budget`, взвешенная `performance`, уровень узла, сортировка, realtime-фильтр по названию (debounce 250 мс), синхронизация выбора строки с деревом и форматирование бюджета.

**Architecture:** Агрегаты и derived data считаются чистыми model-функциями и мемоизируются через `useMemo`. Индекс, агрегаты и базовые строки таблицы пересчитываются только при изменении `query.data`; filtered/sorted rows зависят дополнительно от debounced-фильтра и сортировки. Координирующий UI-state остаётся в `OrgExplorer`. Header закреплён сверху страницы; при ширине `>= 1280 px` используется split-view со sticky tree-панелью шириной ориентировочно 330–360 px под header и таблицей на оставшемся пространстве; при `< 1280 px` используется переключатель.

**Tech Stack:** без изменений — React 19, Vite 8, TypeScript 6, TanStack Query, Zod, styled-components, встроенный `node:test`. Новых dependencies нет.

**Spec:** `docs/task.md` (02 CORE), `docs/steps.md` (step/2), `docs/steps/02-core.md`, `docs/decisions.md`, `docs/clarifications.md`.

## Global Constraints

- Реализовать только `step/2 — CORE`; не добавлять realtime, patch, инкрементальный пересчёт, keyboard navigation, анимацию дерева, `prefers-reduced-motion`, Docker/Nginx/`.env`, AI-search.
- Server не изменяется: CORE — полностью client-side.
- Не добавлять новые зависимости (debounce локальный, table без TanStack Table).
- Агрегаты считаются один раз на snapshot и мемоизируются; не пересчитывать через `useEffect`.
- `buildOrgAggregates()` и `getAncestorIds()` — чистые model-функции, покрытые unit-тестами.
- UI-state (`selectedNodeId`, `viewMode`, `sort`, `filterText`) принадлежит `OrgExplorer`; `expandedNodeIds` остаётся там же.
- Selection двусторонний: строка таблицы выбирает узел дерева, содержимое узла дерева выбирает строку таблицы; chevron управляет только expand/collapse.
- Selection не сбрасывает текущие filter/sort; для видимого выбранного узла или строки допускается `scrollIntoView({ block: 'nearest' })`.
- Агрегаты считаются по полному snapshot; фильтр не влияет на их значения.
- Не создавать commit или tag без отдельной команды пользователя.

## File Map

### Client — model (чистые функции, покрываются `node:test`)

- `apps/client/src/features/org-tree/model/buildOrgAggregates.ts` — `OrgAggregate`, `buildOrgAggregates()`.
- `apps/client/src/features/org-tree/model/getAncestorIds.ts` — `getAncestorIds()`.
- `apps/client/src/features/org-tree/model/orgTable.ts` — `OrgTableRow`, `SortColumn`, `SortState`, `buildOrgTableRows()`, `filterOrgTableRows()`, `sortOrgTableRows()`.

### Client — UI

- `apps/client/src/features/org-tree/ui/useDebouncedValue.ts` — локальный debounce hook.
- `apps/client/src/features/org-tree/ui/orgTableFormat.ts` — форматирование чисел и единое presentation-сопоставление уровня с подписью и цветом для дерева и таблицы.
- `apps/client/src/features/org-tree/ui/OrgTable.tsx` — semantic table, заголовки сортировки, строки и прокрутка к выбранной видимой строке.
- `apps/client/src/features/org-tree/ui/ViewToggle.tsx` — переключатель «Дерево» / «Таблица».
- `apps/client/src/features/org-tree/ui/orgTable.styles.ts` — стили таблицы и переключателя.
- `apps/client/src/features/org-tree/ui/OrgExplorer.tsx` — владелец UI-state, header search, композиция дерева/таблицы и responsive-логика.
- `apps/client/src/features/org-tree/ui/OrgTree.tsx` — принимает `selectedNodeId` и отдельный callback selection, передаёт вниз.
- `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx` — раздельные chevron/selection actions, подсветка и прокрутка к выбранному узлу.
- `apps/client/src/features/org-tree/ui/orgTree.styles.ts` — компактные строки дерева, header search и стиль выбранного узла.

### Client — tests

- `apps/client/tests/buildOrgAggregates.test.ts`
- `apps/client/tests/getAncestorIds.test.ts`
- `apps/client/tests/orgTable.test.ts`
- `apps/client/tests/orgTableFormat.test.ts`

### Documentation (обновляется на этапе реализации)

- `docs/architecture.md`
- `docs/data-model.md`
- `docs/adr/003-core-aggregation.md`
- `README.md`

## Data Contracts and Algorithms

### Aggregates

```ts
export type OrgAggregate = {
    nodeId: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}

export function buildOrgAggregates(
    nodes: readonly OrgNode[],
    index: OrgTreeIndex,
): ReadonlyMap<string, OrgAggregate>
```

Алгоритм — post-order DFS от `index.rootIds` за `O(n)`:

- внутренний шаг `visit(nodeId, level)` возвращает промежуточный результат `{ totalHeadcount, totalBudget, weightedPerformanceSum }`, где
  - `totalHeadcount = node.headcount + Σ child.totalHeadcount`;
  - `totalBudget = node.budget + Σ child.totalBudget`;
  - `weightedPerformanceSum = node.performance * node.headcount + Σ child.weightedPerformanceSum`.
- публичный `OrgAggregate` для узла: `nodeId`, `level`, `totalHeadcount`, `totalBudget` и `averagePerformance = totalHeadcount === 0 ? null : weightedPerformanceSum / totalHeadcount`.

Промежуточный тип с `weightedPerformanceSum` используется только внутри `buildOrgAggregates` и не экспортируется.

- `level`: 0 = Division, 1 = Department, 2 = Team (глубина, не выводится из id/name).
- Порядок узлов в результате значения не имеет (это `Map`); порядок строк таблицы задаётся отдельно `buildOrgTableRows()`.

### Ancestors

```ts
export function getAncestorIds(
    nodeId: string,
    index: OrgTreeIndex,
): readonly string[]
```

Проходит вверх через `nodesById.get(id).parentId`, пока родитель существует. Возвращает id предков от ближайшего (родитель) до корня, исключая сам `nodeId`. Для корня и неизвестного `nodeId` возвращает `[]`.

### Table model

```ts
export type SortColumn =
    | 'name'
    | 'level'
    | 'totalHeadcount'
    | 'totalBudget'
    | 'averagePerformance'

export type SortState = { column: SortColumn; direction: 'asc' | 'desc' }

export type OrgTableRow = {
    nodeId: string
    name: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}

export function buildOrgTableRows(
    nodes: readonly OrgNode[],
    aggregates: ReadonlyMap<string, OrgAggregate>,
): readonly OrgTableRow[]

export function filterOrgTableRows(
    rows: readonly OrgTableRow[],
    filterText: string,
): readonly OrgTableRow[]

export function sortOrgTableRows(
    rows: readonly OrgTableRow[],
    sort: SortState | null,
): readonly OrgTableRow[]
```

- `buildOrgTableRows`: идёт по `nodes` в порядке API; для каждого узла берёт `name`/`nodeId` из узла и `level`/`totalHeadcount`/`totalBudget`/`averagePerformance` из `aggregates.get(node.id)`. Aggregate обязан существовать для каждого `node`; отсутствие aggregate — внутренняя ошибка согласованности, приводящая к `Error` (строку не пропускать и fallback-значения не подставлять).
- `filterOrgTableRows`: `needle = filterText.trim().toLowerCase()`; пустой `needle` возвращает `rows` без изменений; иначе отбирает строки, где `row.name.toLowerCase().includes(needle)`. Возвращает новый массив.
- `sortOrgTableRows`: при `sort === null` возвращает `rows` без изменений (порядок API). Иначе копирует массив и сортирует компаратором:
  - `name`: `a.name.localeCompare(b.name)` (конкретная locale/options — локальная обратимая деталь);
  - `level` / `totalHeadcount` / `totalBudget`: числовая разность;
  - `averagePerformance`: обе `null` → равны; `null` всегда после не-`null` независимо от направления; две не-`null` сравниваются численно;
  - `direction: 'desc'` инвертирует сравнение только для не-`null` пар; `null` остаются внизу в обоих направлениях.
- Сортируется копия массива; входной массив не мутируется. Используется нативный стабильный `Array.prototype.sort`. `sort === null` — исходное состояние до первой сортировки (порядок API), а не third state внутри выбранной колонки.

### Presentation helpers (`ui/orgTableFormat.ts`)

```ts
export function formatBudget(value: number): string
export function formatPerformance(value: number | null): string
export function getLevelLabel(level: number): string
export function getLevelTone(level: number): OrgLevelTone
```

- `formatBudget` — `Intl.NumberFormat('ru-RU').format(value)` + ` руб.` → `12 345 678 руб.`.
- `formatPerformance` — `null` → `—`; иначе `value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })` + `%` → `82,9%`.
- `getLevelLabel` — `['Дивизион', 'Отдел', 'Команда'][level]`; для уровня вне 0..2 возвращает `String(level)`.
- `getLevelTone` — единое сопоставление глубины с presentation-tone: 0 = синий Division, 1 = фиолетовый Department, 2 = бирюзовый Team; неизвестный уровень получает нейтральный fallback. Палитра хранится рядом с сопоставлением и переиспользуется обоими view.
- В дереве уровень показывается небольшим цветным маркером перед названием; в таблице — компактным цветным badge в колонке «Уровень». Уровень дерева передаётся рекурсивно от корня (`0`) и не выводится из `id` или `name`.

### Hooks

```ts
export function useDebouncedValue<T>(value: T, delayMs: number): T
```

- `useState` + `useEffect` только для `setTimeout`/`clearTimeout`; первый рендер возвращает `value` сразу; при изменении `value` обновляет отложенное значение через `delayMs`.

## State Ownership

Все состояния принадлежат `OrgExplorer`:

- `expandedNodeIds: ReadonlySet<string> | null` (существующее);
- `selectedNodeId: string | null` (initial `null`);
- `viewMode: 'tree' | 'table'` (initial `'tree'`);
- `sort: SortState | null` (initial `null` = исходное состояние без сортировки, порядок API; не third state внутри колонки);
- `filterText: string` (initial `''`).

`OrgTree`/`OrgTreeNode` получают `expandedNodeIds`, `onToggle`, `selectedNodeId`, `onSelectNode` через props. `OrgTable` получает строки, `sort`, `onSortAsc`, `onSortDesc`, `selectedNodeId`, `onSelectRow` через props. Header search в `OrgExplorer` получает `filterText` и `onFilterChange`. Ни `OrgTreeNode`, ни `OrgTable` не хранят собственного UI-state.

Обработчики в `OrgExplorer`:

- `onToggle(nodeId)` — как на FOUNDATION.
- `onSortAsc(column)` → `setSort({ column, direction: 'asc' })`.
- `onSortDesc(column)` → `setSort({ column, direction: 'desc' })`.
- `onSelectRow(nodeId)`:
  1. `setSelectedNodeId(nodeId)`;
  2. `getAncestorIds(nodeId, index)` → добавить предков в `expandedNodeIds` (новый `Set` из `current ?? initialExpandedNodeIds`);
  3. `setViewMode('tree')`, чтобы при `<1280` показать и прокрутить выбранный узел.
- `onSelectNode(nodeId)` → `setSelectedNodeId(nodeId)` и `setViewMode('table')`, чтобы при `<1280` показать и прокрутить соответствующую строку; раскрытие, filter и sort не меняются.
- `onFilterChange(text)` → `setFilterText(text)`.

Chevron вызывает только `onToggle` и не меняет `selectedNodeId` или `viewMode`. Клик по остальному содержимому узла вызывает `onSelectNode` и не раскрывает/сворачивает ветвь. После смены selection выбранный видимый узел/строка прокручивается через `scrollIntoView({ block: 'nearest' })`; если строка исключена текущим фильтром, filter/sort не сбрасываются и прокрутка не выполняется. Обработчики задают целевой `viewMode` без определения ширины в JavaScript: на desktop обе панели всё равно показаны CSS, а на mobile/tablet это переключает видимое представление.

## Data Flow

```text
query.data (OrgNode[], snapshot)
    ↓ useMemo(index)
buildOrgTreeIndex()
    ↓ useMemo(aggregates) по [query.data, index]
buildOrgAggregates()
    ↓ useMemo(rows) по [query.data, aggregates]
buildOrgTableRows()
    ↓ debounced = useDebouncedValue(filterText, 250)
    ↓ useMemo(filtered) по [rows, debounced]
filterOrgTableRows()
    ↓ useMemo(sorted) по [filtered, sort]
sortOrgTableRows()
    ↓
render (OrgTree + OrgTable)
```

Зависимости `useMemo`:

- `index`, `aggregates`, `rows` — пересчитываются только при изменении `query.data`;
- `filtered` — при изменении `rows` или `debouncedFilterText`;
- `sorted` — при изменении `filtered` или `sort`.

Фильтр применяется только к строкам таблицы, дерево использует `index` без фильтрации.

## Responsive Behavior

Ширина viewport в JavaScript не определяется. Никакого `useMediaQuery`, `useSyncExternalStore` или resize-listener; отдельного state ширины нет.

Визуальная раскладка управляется только CSS (styled-components) через media query `min-width: 1280px`. Фактическая desktop-высота header, gap между sticky-элементами и нижний viewport-gap задаются общими CSS custom properties на `Page`, чтобы header и tree использовали один источник размеров. У `Page` нет верхнего padding: начальные позиции header и tree сразу совпадают с их sticky offsets и элементы не смещаются в начале прокрутки.

- header: `position: sticky`, `top: 0`, непрозрачный background и `z-index` поверх page content;
- `>= 1280px`: одновременно видны дерево и таблица; tree-панель имеет ширину ориентировочно 330–360 px, `position: sticky`, вычисляемый из высоты header и gap `top`, вычисляемый относительно viewport `max-height` и собственный `overflow-y: auto`; таблица занимает всё оставшееся пространство; `viewMode` не скрывает панели, переключатель не отображается.
- `< 1280px`: переключатель находится внутри sticky-header и управляет `viewMode`; CSS показывает только выбранную панель (дерево или таблицу).

Обе панели остаются смонтированными; видимость определяется CSS (например, через `display`/grid по media query). Клик строки таблицы задаёт `viewMode = 'tree'`, клик содержимого узла — `viewMode = 'table'`; на desktop это не скрывает панели, а при `<1280` обеспечивает переход к выбранному элементу противоположного view.

## Tasks

### Task 1: Implement and test model functions

**Files:**

- Create: `apps/client/src/features/org-tree/model/buildOrgAggregates.ts`
- Create: `apps/client/src/features/org-tree/model/getAncestorIds.ts`
- Create: `apps/client/src/features/org-tree/model/orgTable.ts`
- Create: `apps/client/tests/buildOrgAggregates.test.ts`
- Create: `apps/client/tests/getAncestorIds.test.ts`
- Create: `apps/client/tests/orgTable.test.ts`

**Interfaces:**

- Produces: `OrgAggregate`, `buildOrgAggregates()`, `getAncestorIds()`, `OrgTableRow`, `SortColumn`, `SortState`, `buildOrgTableRows()`, `filterOrgTableRows()`, `sortOrgTableRows()`.

- [ ] **Step 1: Write failing tests**

`buildOrgAggregates`: leaf (totalHeadcount/budget равны значениям узла, averagePerformance равен performance); parent+descendants (суммы); weighted performance (проверка `weightedPerformanceSum / totalHeadcount`); multiple levels (level 0/1/2); zero total headcount → `null`; level values.

`getAncestorIds`: leaf → предки от родителя к корню; root → `[]`; неизвестный id → `[]`.

`orgTable`: `buildOrgTableRows` (порядок API и значения из aggregates); `filterOrgTableRows` (trim, case-insensitive, пустая строка → все); `sortOrgTableRows` (null → порядок API; asc/desc по числовым колонкам; name через localeCompare; `averagePerformance === null` всегда внизу в обоих направлениях).

- [ ] **Step 2: Run tests and confirm failure**

```bash
pnpm --filter @staff-pulse/client test
```

- [ ] **Step 3: Implement the model functions**

Реализовать контракты и алгоритмы из раздела «Data Contracts and Algorithms». Не мутировать входные массивы; не добавлять UI-state в модель.

- [ ] **Step 4: Run client model tests**

```bash
pnpm --filter @staff-pulse/client test
```

### Task 2: Implement presentation helpers and hooks

**Files:**

- Create: `apps/client/src/features/org-tree/ui/useDebouncedValue.ts`
- Create: `apps/client/src/features/org-tree/ui/orgTableFormat.ts`
- Create: `apps/client/tests/orgTableFormat.test.ts`

- [ ] **Step 1: Implement `useDebouncedValue`** — по контракту из раздела «Hooks».

- [ ] **Step 2: Test and implement formatting and level presentation** — реализовать контракты из раздела «Presentation helpers»; проверить сопоставление уровней и уникальность цветов для Division/Department/Team.

- [ ] **Step 3: Run type-check**

```bash
pnpm --filter @staff-pulse/client lint
```

### Task 3: Implement table UI

**Files:**

- Create: `apps/client/src/features/org-tree/ui/OrgTable.tsx`
- Create: `apps/client/src/features/org-tree/ui/ViewToggle.tsx`
- Create: `apps/client/src/features/org-tree/ui/orgTable.styles.ts`

**Interfaces:**

- Produces: `OrgTable({ rows, sort, selectedNodeId, onSortAsc, onSortDesc, onSelectRow })`.
- Produces: `ViewToggle({ viewMode, onChange })`.

- [ ] **Step 1: Render semantic table**

`<table>` с `<thead>` из пяти `<th>` (Подразделение, Уровень, Всего сотрудников, Бюджет суммарный, Средняя эффективность) и `<tbody>` со строками по `rows`.

- [ ] **Step 2: Sortable headers**

Внутри каждого `<th>` — `button type="button"`; `onClick` → `onSortAsc(column)`, `onDoubleClick` → `onSortDesc(column)`. Не делать весь `<th>` clickable container. Отражать текущие `sort.column`/`direction` визуально.

Каждый sortable header всегда резервирует фиксированный слот под `SortDirection`. Для неактивной колонки индикатор скрывается через `visibility: hidden`, поэтому появление `▲`/`▼` не меняет ширину содержимого или высоту table header.

- [ ] **Step 3: Row selection**

`<tr>` с `onClick={() => onSelectRow(row.nodeId)}`; выбранная строка (`row.nodeId === selectedNodeId`) получает выделение. Форматирование ячеек через `formatBudget`/`formatPerformance`/`getLevelLabel`; колонка уровня использует компактный badge из общего presentation-сопоставления.

- [ ] **Step 4: Header filter input**

Единственное поле поиска находится в компактном header `OrgExplorer`, value=`filterText`, `onChange` → `onFilterChange`; отдельного поиска внутри таблицы или дерева нет.

- [ ] **Step 5: ViewToggle and styles**

`ViewToggle` с кнопками «Дерево»/«Таблица» и активным состоянием по `viewMode` находится в header и виден только при `<1280`. Все стили — styled-components; horizontal overflow для таблицы при `<1280`; обязательные колонки не скрывать.

### Task 4: Wire `OrgExplorer` state and responsive layout

**Files:**

- Modify: `apps/client/src/features/org-tree/ui/OrgExplorer.tsx`
- Modify: `apps/client/src/features/org-tree/ui/OrgTree.tsx`
- Modify: `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx`
- Modify: `apps/client/src/features/org-tree/ui/orgTree.styles.ts`

- [ ] **Step 1: Add UI state**

Добавить `selectedNodeId`, `viewMode`, `sort`, `filterText` (по разделу «State Ownership»).

- [ ] **Step 2: Build derived data via `useMemo`**

`index` → `aggregates` → `rows`; затем `debouncedFilterText = useDebouncedValue(filterText, 250)` → `filtered` → `sorted`. Вызывать все hooks безусловно до условного рендера состояний.

- [ ] **Step 3: Compose responsive layout**

Разложить обе панели и переключатель по разделу «Responsive Behavior»; видимость управляется CSS media query (`min-width: 1280px`), без JS-определения ширины. Существующие состояния loading/error/empty/success сохраняются; таблица рендерится только в success.

- [ ] **Step 4: Bidirectional selection and scrolling**

Передать `selectedNodeId` и `onSelectNode` в `OrgTree`/`OrgTreeNode`; `OrgTreeNode` подсвечивает узел при `nodeId === selectedNodeId` и получает рекурсивную глубину для цветного level-маркера. Обработчик `onSelectRow` раскрывает предков и задаёт `viewMode = 'tree'`; клик по содержимому узла выбирает его и задаёт `viewMode = 'table'`, не меняя filter/sort. Chevron остаётся отдельной кнопкой только для expand/collapse и не меняет selection/view. Выбранный видимый узел/строка прокручивается через `scrollIntoView({ block: 'nearest' })`.

- [ ] **Step 5: Run static checks**

```bash
pnpm --filter @staff-pulse/client lint
pnpm --filter @staff-pulse/client test
pnpm build
```

### Task 5: Verify and document CORE

**Files:**

- Modify: `docs/architecture.md`
- Modify: `docs/data-model.md`
- Create: `docs/adr/003-core-aggregation.md`
- Modify: `README.md`

- [ ] **Step 1: Automated verification**

```bash
pnpm --filter @staff-pulse/server test
pnpm --filter @staff-pulse/client test
pnpm --filter @staff-pulse/client lint
pnpm build
```

- [ ] **Step 2: Manual verification**

`pnpm dev`, затем:

- sticky header сразу расположен на `top: 0`, не смещается в начале прокрутки и непрозрачно перекрывает content; split-view при `>= 1280 px` использует sticky tree-панель ориентировочно 330–360 px непосредственно под header, а таблица занимает остаток; переключатель при `< 1280 px` находится в header и показывает одно представление;
- агрегированные headcount/budget и взвешенная performance корректны (проверить на одном Department с известными Team);
- уровень: Дивизион/Отдел/Команда, с отдельным согласованным цветом каждого уровня в дереве и таблице;
- сортировка по каждому столбцу: обычный клик → ASC, двойной клик → DESC; `averagePerformance === null` внизу;
- фильтр по названию realtime, debounce 250 мс, case-insensitive; пустая строка показывает все;
- клик строки выделяет узел, раскрывает предков, на `<1280` переключает view на дерево и при необходимости прокручивает sticky-панель; клик по содержимому узла выделяет строку, на `<1280` переключает view на таблицу и при необходимости прокручивает её; chevron только раскрывает/сворачивает; filter/sort не сбрасываются;
- формат бюджета `12 345 678 руб.`; performance `82,9%` / `—`.

- [ ] **Step 3: Scope checks**

```bash
rg -n 'style=|style:\s*\{' apps/client/src
```

Убедиться, что нет inline CSS, realtime/SSE/WebSocket/polling, keyboard navigation, height animation, Docker/Nginx/`.env`, AI-search и новых dependencies.

- [ ] **Step 4: Update documentation**

`docs/architecture.md` — добавить CORE-слои (model aggregates/ancestors/table, UI table/view toggle, владение state, pipeline). `docs/data-model.md` — модель `OrgAggregate`/`OrgTableRow`, алгоритм агрегации, sort/filter контракты. `docs/adr/003-core-aggregation.md` — контекст/решение/альтернативы/последствия для post-order агрегации и derived-data pipeline. `README.md` — scope (CORE реализован) и актуализированный раздел «AI в разработке» (только факты; подтверждённые ручные правки перечислить, если были).

- [ ] **Step 5: Report and stop for manual review**

Не создавать commit или tag `step/2` без отдельной команды.

## Review Checklist

- [ ] Все требования CORE из `docs/steps/02-core.md` покрыты задачей и проверкой.
- [ ] Агрегаты считаются чистой model-функцией post-order за O(n), включая взвешенную performance и `null` при нулевом headcount.
- [ ] `level` не выводится из id/name; русские подписи и единое цветовое сопоставление уровня — presentation layer, одинаковый для обоих view.
- [ ] `OrgExplorer` владеет `selectedNodeId`, `viewMode`, `sort`, `filterText`; `expandedNodeIds` остаётся там же.
- [ ] Selection двусторонний; клик строки раскрывает предков через `getAncestorIds`, клик содержимого дерева выбирает строку, chevron только раскрывает/сворачивает.
- [ ] Выбранный видимый узел/строка прокручивается через `scrollIntoView({ block: 'nearest' })`; selection не сбрасывает filter/sort и на `<1280` переключает `viewMode` на противоположное представление.
- [ ] Header sticky на `top: 0` и перекрывает content; tree sticky под ним, а `top`/`max-height` вычисляются из общих CSS custom properties без отдельного захардкоженного header offset.
- [ ] Header и tree сразу находятся на своих sticky offsets без начального смещения; mobile/tablet view toggle расположен в header.
- [ ] Фиксированный слот sort indicator сохраняет высоту table header при появлении `▲`/`▼`.
- [ ] Фильтр применяется только к таблице; агрегаты не зависят от фильтра.
- [ ] Сортировка: обычный клик → ASC, двойной → DESC; `averagePerformance === null` всегда внизу.
- [ ] Derived data строится только по изменению `query.data` через `useMemo`; нет cache/selector layer.
- [ ] `useEffect` используется только в debounce hook и для прокрутки выбранных DOM-элементов; ширина viewport в JS не определяется (CSS media query).
- [ ] Semantic table, budget `12 345 678 руб.`, performance `82,9%`/`—`.
- [ ] Никаких новых dependencies и никакой функциональности следующих этапов.
- [ ] Реализация начинается только после отдельной команды пользователя.
