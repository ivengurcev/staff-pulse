# ADR 003: Агрегация и derived data на CORE

## Контекст

Аналитическая таблица требует агрегированных показателей (суммарные headcount/budget и средняя эффективность, взвешенная по headcount) для каждого узла дерева. Значения должны пересчитываться один раз после загрузки snapshot и мемоизироваться, а не считаться в JSX или в `useEffect`.

## Решение

- `buildOrgAggregates(nodes, index)` — чистая model-функция, вычисляющая `ReadonlyMap<string, OrgAggregate>` за `O(n)` через post-order DFS от корней.
- Взвешенная эффективность: `averagePerformance = weightedPerformanceSum / totalHeadcount`; при нулевом `totalHeadcount` — `null`.
- Derived pipeline собирается через `useMemo` в `OrgExplorer`: `index` → `aggregates` → `tableRows` → debounced filter → sort.
- `index`, `aggregates`, `tableRows` зависят только от `query.data`; `filteredRows` дополнительно от debounced-фильтра, `sortedRows` — от `sort`.
- `getAncestorIds()` — чистая функция поиска предков для раскрытия дерева при выборе строки.
- Отдельный cache/selector layer поверх TanStack Query не вводится.

## Альтернативы

- Считать агрегаты в JSX на каждый рендер — отклонено из-за повторных вычислений и смешивания логики с разметкой.
- Вынести агрегацию на server — отклонено: CORE не требует изменений API; агрегация остаётся client-side.
- Ввести отдельный selector/cache layer (например, reselect) — отклонено как лишняя сложность: достаточно `useMemo` на ссылку `query.data`.
- Инкрементальный пересчёт агрегатов — отклонён: относится к realtime (step/3) и не нужен на CORE.

## Последствия

- Агрегаты считаются детерминированно и тестируются независимо как чистая функция.
- Каждый шаг pipeline пересчитывается только при изменении своего входа; нет лишних вычислений.
- `O(n)` по времени и памяти на построение агрегатов.
- Отсутствие aggregate для узла трактуется как внутренняя ошибка согласованности (`Error`) — клиент не подставляет fallback-значения.
- Инкрементальный пересчёт откладывается на step/3.
