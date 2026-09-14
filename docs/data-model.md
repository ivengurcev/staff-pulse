# Модель данных

Документ описывает модель, реализованную на `step/1 — FOUNDATION` и `step/2 — CORE`.

## API-узел

```ts
type OrgNode = {
    id: string
    name: string
    parentId: string | null
    headcount: number
    budget: number
    performance: number
    updatedAt: string
}
```

Ограничения:

- `id` и `name` — непустые строки;
- `parentId` — существующий `id` либо `null` для корня;
- `headcount` — целое неотрицательное число;
- `budget` — конечное неотрицательное число;
- `performance` — конечное число от 0 до 100;
- `updatedAt` — ISO date-time.

`headcount`, `budget` и `performance` принадлежат самому узлу; агрегированные значения считаются отдельно на client.

## Представление иерархии

API возвращает плоский массив с тремя уровнями:

```text
Division
    Department
        Team
```

Snapshot содержит 3 Division, 12 Department и 36 Team — всего 51 узел. ID и значения генерируются детерминированно, поэтому ответ воспроизводим между запусками.

## Валидация

Проверка client boundary состоит из двух независимых этапов:

```text
unknown JSON
    ↓
Zod schema
    ↓
OrgNode[]
    ↓
validateOrgTree()
    ↓
валидная иерархия
```

Zod проверяет форму и значения каждого объекта. `validateOrgTree()` проверяет уникальность ID, существование родителей, отсутствие self-parent и циклов. Обнаружение циклов выполняется DFS по parent-ссылкам с состояниями `visiting`/`visited` за `O(n)` времени и памяти.

## Индексы client

После успешной валидации `buildOrgTreeIndex()` за один проход создаёт:

```ts
type OrgTreeIndex = {
    nodesById: ReadonlyMap<string, OrgNode>
    childrenByParentId: ReadonlyMap<string, readonly string[]>
    rootIds: readonly string[]
}
```

- `nodesById` обеспечивает поиск узла по ID;
- `childrenByParentId` хранит ID прямых потомков;
- `rootIds` хранит корневые Division;
- порядок узлов из API сохраняется.

Индексы не изменяют исходные API-объекты и не добавляют в них UI-state.

## Агрегаты

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

Алгоритм — post-order DFS от `index.rootIds` за `O(n)`:

- `totalHeadcount` = headcount узла + headcount всех потомков;
- `totalBudget` = budget узла + budget всех потомков;
- `weightedPerformanceSum` = performance * headcount узла + weightedPerformanceSum потомков;
- `averagePerformance` = weightedPerformanceSum / totalHeadcount;
- при `totalHeadcount === 0` — `averagePerformance = null` (в UI `—`).

`level` — глубина дерева: 0 = Division, 1 = Department, 2 = Team. Уровень вычисляется из структуры, а не из `id`/`name`.

## Ancestors

```ts
function getAncestorIds(nodeId: string, index: OrgTreeIndex): readonly string[]
```

Проходит вверх через `parentId` и возвращает id предков от ближайшего (родитель) до корня. Для корня и неизвестного `nodeId` возвращает `[]`.

## Строка таблицы

```ts
type OrgTableRow = {
    nodeId: string
    name: string
    level: number
    totalHeadcount: number
    totalBudget: number
    averagePerformance: number | null
}

function buildOrgTableRows(
    nodes: readonly OrgNode[],
    aggregates: ReadonlyMap<string, OrgAggregate>,
): readonly OrgTableRow[]
```

Строки строятся в порядке API. Для каждого узла берётся `name`/`nodeId` из узла и значения из соответствующего `OrgAggregate`. Aggregate обязан существовать для каждого узла; отсутствие aggregate — внутренняя ошибка согласованности (`Error`), строка не пропускается и fallback-значения не подставляются.

## Фильтр и сортировка

```ts
type SortColumn =
    | 'name' | 'level' | 'totalHeadcount' | 'totalBudget' | 'averagePerformance'

type SortState = { column: SortColumn; direction: 'asc' | 'desc' }

function filterOrgTableRows(
    rows: readonly OrgTableRow[],
    filterText: string,
): readonly OrgTableRow[]

function sortOrgTableRows(
    rows: readonly OrgTableRow[],
    sort: SortState | null,
): readonly OrgTableRow[]
```

- Фильтр — только по `name`, `trim` + case-insensitive substring; пустая строка возвращает все строки.
- `sort === null` — исходное состояние без сортировки (порядок API).
- Сортировка — нативная стабильная `Array.prototype.sort` по копии массива; входной массив не мутируется.
- Сравнение `name` — через `localeCompare`; числовые колонки — по разности.
- `averagePerformance === null` всегда внизу независимо от направления.

Агрегаты считаются по полному snapshot и не зависят от фильтра.

## Состояние раскрытия

`expandedNodeIds` — отдельный `ReadonlySet<string>` на уровне `OrgExplorer`. Начальное значение содержит только `rootIds`: Division раскрыты, Department видны, Team скрыты.

Realtime-патчи, частичный пересчёт агрегатов и контракт обновлений относятся к следующим этапам и здесь не описываются как реализованные.
