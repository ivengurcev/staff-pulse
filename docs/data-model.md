# Модель данных FOUNDATION

Документ описывает только модель, реализованную на `step/1 — FOUNDATION`.

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

`headcount`, `budget` и `performance` принадлежат самому узлу. Агрегированные значения на FOUNDATION не рассчитываются.

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

## Состояние раскрытия

`expandedNodeIds` — отдельный `ReadonlySet<string>` на уровне `OrgExplorer`. Начальное значение содержит только `rootIds`: Division раскрыты, Department видны, Team скрыты.

Realtime-патчи, частичный пересчёт агрегатов и контракт обновлений относятся к следующим этапам и здесь не описываются как реализованные.
