# Staff Pulse FOUNDATION Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Статус:** утверждён. Реализация начинается только по отдельной команде пользователя.

**Goal:** Реализовать mock API из 51 узла и клиентский интерактивный просмотр орг-дерева со строгой runtime-валидацией, кэшированием и состояниями loading/error/empty/success.

**Architecture:** Hono-сервер отдаёт детерминированный плоский массив, а клиент последовательно выполняет HTTP-запрос, Zod-валидацию формы и domain-валидацию иерархии. TanStack Query владеет server state, `OrgExplorer` владеет локальным UI-state раскрытых узлов, а чистые model-функции строят индексы дерева и начальное состояние.

**Tech Stack:** Node.js 24.19, pnpm 12.4.1, TypeScript 6, Hono, React 19, Vite 8, Zod, TanStack Query, styled-components, встроенный `node:test`.

**Spec:** `docs/task.md`, `docs/steps.md`, `docs/steps/01-foundation.md`, `docs/decisions.md`, `docs/clarifications.md`.

## Global Constraints

- Реализовать только `step/1 — FOUNDATION`; не добавлять таблицу, агрегацию, поиск, realtime, Docker или AI-search.
- Сохранить pnpm workspace `apps/client` + `apps/server` и endpoint `GET /health`.
- Не обновлять major-версии существующих зависимостей.
- Не создавать commit или tag без отдельной команды пользователя.
- API остаётся плоским и возвращает ровно 51 детерминированный узел трёх уровней.
- Client использует `@/* → ./src/*`; server использует нативный `#server/*` через `package.json#imports`.
- Server build остаётся `tsc -p tsconfig.json`, без alias post-processing и bundler.
- На FOUNDATION используется встроенный `node:test`; новую test-runner dependency не добавлять.
- Клиент валидирует и форму объектов, и целостность иерархии до передачи данных UI.
- `expandedNodeIds` принадлежит `OrgExplorer`, не глобальному store и не `OrgTreeNode`.
- Второй уровень виден по умолчанию: раскрыты только корневые Division.
- Inline CSS и UI-библиотеки не использовать.
- После реализации выполнить автоматические и ручные проверки из Task 6.

---

## File Map

### Server

- `apps/server/package.json` — scripts и conditional package imports `#server/*`.
- `apps/server/tsconfig.json` — существующая NodeNext-сборка из `src` в `dist`.
- `apps/server/tsconfig.test.json` — type-check server tests с условием `development`.
- `apps/server/src/domain/orgNode.ts` — server-side контракт `OrgNode`.
- `apps/server/src/data/orgTree.ts` — детерминированные 51 mock-узел.
- `apps/server/src/app.ts` — Hono app и маршруты `/health`, `/api/org-tree` без открытия порта.
- `apps/server/src/index.ts` — единственная точка запуска HTTP-сервера на порту 3001.
- `apps/server/tests/app.test.ts` — contract/integrity tests обоих endpoint.

### Client

- `apps/client/package.json` — Zod, TanStack Query, styled-components и test script без нового test runner.
- `apps/client/vite.config.ts` — существующий `@` alias и proxy `/api` на server.
- `apps/client/tsconfig.test.json` — type-check чистых model tests.
- `apps/client/src/main.tsx` — React root.
- `apps/client/src/App.tsx` — QueryClientProvider, GlobalStyle и `OrgExplorer`.
- `apps/client/src/app/queryClient.ts` — единый `QueryClient`.
- `apps/client/src/features/org-tree/model/orgNode.ts` — Zod schema и выведенный `OrgNode`.
- `apps/client/src/features/org-tree/model/validateOrgTree.ts` — domain-validation иерархии.
- `apps/client/src/features/org-tree/model/buildOrgTreeIndex.ts` — линейное построение индексов.
- `apps/client/src/features/org-tree/model/getInitialExpandedNodeIds.ts` — начальное раскрытие корней.
- `apps/client/src/features/org-tree/api/fetchOrgTree.ts` — fetch → JSON → Zod → domain validation.
- `apps/client/src/features/org-tree/api/useOrgTreeQuery.ts` — query key, `staleTime` и AbortSignal.
- `apps/client/src/features/org-tree/ui/OrgExplorer.tsx` — владелец query/UI state и четырёх UI-состояний.
- `apps/client/src/features/org-tree/ui/OrgTree.tsx` — корневой список дерева.
- `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx` — рекурсивный узел и toggle.
- `apps/client/src/features/org-tree/ui/orgTree.styles.ts` — все стили feature.
- `apps/client/src/styles/GlobalStyle.ts` — reset, фон, typography и общая страница.
- `apps/client/tests/validateOrgTree.test.ts` — domain-validation cases.
- `apps/client/tests/buildOrgTreeIndex.test.ts` — индексы и начальное раскрытие.
- `apps/client/tests/fetchOrgTree.test.ts` — HTTP/schema/domain pipeline и передача AbortSignal.
- Удалить starter-only `apps/client/src/index.css` и неиспользуемые starter assets после замены UI.

### Documentation

- `README.md` — запуск, проверки, структура и фактический раздел об использовании AI.
- `docs/architecture.md` — только реализованные на FOUNDATION слои и поток API → UI.
- `docs/data-model.md` — только текущий `OrgNode`, плоская иерархия, валидация, индексы и expansion state.
- `docs/adr/001-api-boundary-validation.md` — решение о двухэтапной проверке API boundary.
- `docs/adr/002-server-state-cache.md` — решение о TanStack Query, `staleTime`, structural sharing и отсутствии ручной invalidation.

## Data Contracts and Algorithms

### API contract

```ts
export type OrgNode = {
    id: string
    name: string
    parentId: string | null
    headcount: number
    budget: number
    performance: number
    updatedAt: string
}
```

Семантика числовых полей на FOUNDATION: значения принадлежат самому узлу; суммирование с потомками относится только к `step/2`.

### Server package imports

`apps/server/package.json`:

```json
{
    "imports": {
        "#server/*": {
            "development": "./src/*.ts",
            "default": "./dist/*.js"
        }
    },
    "scripts": {
        "dev": "tsx --conditions=development watch src/index.ts",
        "build": "tsc -p tsconfig.json",
        "start": "node dist/index.js"
    }
}
```

В source-коде используются extensionless specifiers вида `#server/app`: pattern сам добавляет `.ts` в development и `.js` после build. `rootDir: "src"`, `outDir: "dist"`, `module: "NodeNext"` и `moduleResolution: "NodeNext"` сохраняются.

### Deterministic mock data

Порядок массива стабилен: Division, затем его Department, затем Team каждого Department.

- Division: `division-1` … `division-3`.
- Department: `division-{d}-department-{n}`, по 4 на Division.
- Team: `division-{d}-department-{n}-team-{t}`, по 3 на Department.
- Имена Division: `Engineering`, `Operations`, `Commercial`.
- Имена Department задаются фиксированными массивами; Team называются `${departmentName} Team 1..3`.
- `headcount = 4 + (ordinal % 17)`.
- `budget = 250000 + ordinal * 125000`.
- `performance = 45 + ((ordinal * 11) % 51)`, то есть 45–95.
- `updatedAt = "2026-09-01T00:00:00.000Z"` для начального snapshot.

`ordinal` — последовательный номер узла от 0 до 50. Формулы обеспечивают воспроизводимость и значения во всех трёх диапазонах performance indicator.

### Client validation flow

```text
GET /api/org-tree + AbortSignal
    ↓
HTTP status check
    ↓
response.json(): unknown
    ↓
orgTreeSchema.parse()
    ↓
OrgNode[]
    ↓
validateOrgTree()
    ↓
TanStack Query cache
    ↓
OrgExplorer
```

Zod проверяет непустые `id`/`name`, `parentId: string | null`, целый `headcount >= 0`, конечный `budget >= 0`, конечный `performance` в диапазоне 0–100 и ISO datetime `updatedAt`. Пустой массив является валидным ответом и обрабатывается UI как empty.

`validateOrgTree(nodes: readonly OrgNode[]): readonly OrgNode[]` выполняет:

1. Создание `Set<string>` и ошибку `OrgTreeValidationError` при повторном `id`.
2. Проверку существования каждого ненулевого родителя и `parentId !== id`.
3. DFS по parent-ссылкам с состояниями `unvisited`, `visiting`, `visited`; переход к `visiting`-узлу означает цикл.
4. Возврат исходного массива без копирования, если ошибок нет.

Сложность — `O(n)` по времени и `O(n)` по памяти.

### Tree indexes

```ts
export type OrgTreeIndex = {
    nodesById: ReadonlyMap<string, OrgNode>
    childrenByParentId: ReadonlyMap<string, readonly string[]>
    rootIds: readonly string[]
}

export function buildOrgTreeIndex(
    nodes: readonly OrgNode[],
): OrgTreeIndex
```

Один проход по уже валидным данным:

- каждый узел добавляется в `nodesById`;
- `parentId === null` добавляет `id` в `rootIds`;
- остальные `id` добавляются в массив `childrenByParentId.get(parentId)`;
- исходный порядок API сохраняется, отдельная сортировка на FOUNDATION не выполняется.

`Map` выбран как локальное обратимое решение: ключи динамические, lookup `O(1)`, порядок вставки стабилен. Индекс строится в `useMemo` только при изменении ссылки на query data.

### Initial expansion and ownership

```ts
export function getInitialExpandedNodeIds(
    index: OrgTreeIndex,
): ReadonlySet<string>
```

Функция возвращает `new Set(index.rootIds)`: Division раскрыты, Department видны, Team скрыты.

`OrgExplorer` хранит `expandedNodeIds: ReadonlySet<string> | null`. Значение `null` означает, что пользователь ещё не менял состояние; UI использует `getInitialExpandedNodeIds(index)`. При первом toggle создаётся копия initial set, затем выбранный `id` добавляется или удаляется. Это исключает синхронизирующий `useEffect`, сохраняет ownership на feature/page и не сбрасывает выбор при background refetch.

### UI states

- `loading`: до первого ответа показывается заголовок страницы и `role="status"` с текстом «Загружаем структуру…».
- `error`: network, non-2xx, JSON, Zod или domain error показывают единый `role="alert"`, безопасный пользовательский текст и кнопку `Повторить`, вызывающую `refetch()`.
- `empty`: валидный `[]` показывает «В структуре пока нет подразделений»; дерево не рендерится.
- `success`: отображается вложенный семантический список; background refetch не заменяет дерево loading-state.

У узла с детьми используется `button type="button"` с `aria-expanded`; leaf не получает ложный toggle. Узел показывает `name`, `headcount` и числовой performance рядом с цветным индикатором.

Пороги performance — локальное assumption:

- `>= 80`: высокий, зелёный;
- `>= 60` и `< 80`: средний, жёлтый;
- `< 60`: низкий, красный.

Цвет не является единственным сигналом: рядом отображаются процент и текстовая категория, доступная assistive technology. Height-transition не добавляется до `step/3`.

## Tasks

### Task 1: Configure dependencies, aliases, and test commands

**Files:**

- Modify: `apps/server/package.json`
- Create: `apps/server/tsconfig.test.json`
- Modify: `apps/client/package.json`
- Modify: `apps/client/vite.config.ts`
- Create: `apps/client/tsconfig.test.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `#server/*` resolution for dev/source and start/dist.
- Produces: client dependencies `@tanstack/react-query`, `zod`, `styled-components`.
- Produces: package-level `test` scripts using Node 24 built-in test runner.

- [ ] **Step 1: Install the approved client dependencies**

```bash
pnpm --filter @staff-pulse/client add @tanstack/react-query zod styled-components
```

- [ ] **Step 2: Add exact server imports and scripts**

```json
"imports": {
    "#server/*": {
        "development": "./src/*.ts",
        "default": "./dist/*.js"
    }
},
"scripts": {
    "dev": "tsx --conditions=development watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "tsc -p tsconfig.test.json --noEmit && node --conditions=development --test tests/*.test.ts"
}
```

- [ ] **Step 3: Add test type-check configs**

Server `tsconfig.test.json` extends production config, sets `noEmit: true`, `rootDir: "."`, `customConditions: ["development"]`, and includes `src` plus `tests`.

Client `tsconfig.test.json` extends `tsconfig.app.json`, sets `types: ["node"]`, `noEmit: true`, and includes pure model files plus `tests`. Add client script:

```json
"test": "tsc -p tsconfig.test.json --noEmit && node --test tests/*.test.ts"
```

В чистых client model/api-модулях, которые исполняет `node:test`, relative-imports содержат расширение `.ts`; это совместимо с уже включённым `allowImportingTsExtensions` и Vite. UI использует существующий client alias `@/*`.

- [ ] **Step 4: Configure Vite API proxy without changing the existing alias**

```ts
server: {
    proxy: {
        '/api': 'http://localhost:3001',
    },
},
```

- [ ] **Step 5: Verify configuration remains buildable before feature code**

```bash
pnpm build
```

Expected: existing client and server compile successfully; feature tests start in Tasks 2 and 3.

- [ ] **Step 6: Commit gate**

Do not commit. If separately authorized, stage only Task 1 files and use `chore: configure foundation dependencies`.

### Task 2: Implement and test the mock API

**Files:**

- Create: `apps/server/src/domain/orgNode.ts`
- Create: `apps/server/src/data/orgTree.ts`
- Create: `apps/server/src/app.ts`
- Modify: `apps/server/src/index.ts`
- Create: `apps/server/tests/app.test.ts`

**Interfaces:**

- Produces: exact `OrgNode` API type.
- Produces: `orgTree: readonly OrgNode[]` with 51 nodes.
- Produces: `app: Hono` usable by `serve()` and tests.
- Produces: `GET /health` and `GET /api/org-tree`.

- [ ] **Step 1: Write failing server contract tests**

Use `node:test`, `node:assert/strict`, and `app.request()` to assert:

```text
GET /health         → 200 and { status: "ok" }
GET /api/org-tree   → 200 and array length 51
root count          → 3
department count    → 12
team count          → 36
all ids             → unique
every parentId      → existing id
maximum depth       → 3
```

- [ ] **Step 2: Run tests and confirm the expected failure**

```bash
pnpm --filter @staff-pulse/server test
```

Expected: FAIL because `app.ts` and the fixture do not exist.

- [ ] **Step 3: Define the server contract and deterministic fixture**

Create the exact `OrgNode` type. Generate the hierarchy with the stable IDs, names, formulas, order and timestamp documented above. Export readonly flat data; do not compute aggregates.

- [ ] **Step 4: Extract the Hono app and add the endpoint**

`app.ts` owns route registration and exports `app`. `index.ts` imports it through `#server/app` and only calls:

```ts
serve({ fetch: app.fetch, port: 3001 })
```

`GET /api/org-tree` returns the flat array directly, not an envelope.

- [ ] **Step 5: Run server tests and build**

```bash
pnpm --filter @staff-pulse/server test
pnpm --filter @staff-pulse/server build
```

Expected: all tests PASS and `dist` retains supported `#server/...` specifiers.

- [ ] **Step 6: Verify compiled runtime resolution**

Terminal A:

```bash
pnpm --filter @staff-pulse/server start
```

Terminal B:

```bash
curl --fail http://localhost:3001/health
curl --fail http://localhost:3001/api/org-tree
```

Expected: both return JSON with HTTP 200 and no module-resolution error.

- [ ] **Step 7: Commit gate**

Do not commit. If separately authorized, stage only Task 2 files and use `feat(server): add organization tree API`.

### Task 3: Implement schema, domain validation, and tree indexes

**Files:**

- Create: `apps/client/src/features/org-tree/model/orgNode.ts`
- Create: `apps/client/src/features/org-tree/model/validateOrgTree.ts`
- Create: `apps/client/src/features/org-tree/model/buildOrgTreeIndex.ts`
- Create: `apps/client/src/features/org-tree/model/getInitialExpandedNodeIds.ts`
- Create: `apps/client/tests/validateOrgTree.test.ts`
- Create: `apps/client/tests/buildOrgTreeIndex.test.ts`

**Interfaces:**

- Produces: `orgNodeSchema`, `orgTreeSchema`, `OrgNode = z.infer<typeof orgNodeSchema>`.
- Produces: `validateOrgTree(nodes): readonly OrgNode[]`.
- Produces: `buildOrgTreeIndex(nodes): OrgTreeIndex`.
- Produces: `getInitialExpandedNodeIds(index): ReadonlySet<string>`.

- [ ] **Step 1: Write failing schema and domain-validation tests**

Cover a valid tree and independent failures for duplicate ID, missing parent, self-parent and a two-node cycle. Assert rejection of negative headcount/budget, performance outside 0–100 and invalid datetime. Assert that `[]` passes.

- [ ] **Step 2: Run validation tests and confirm failure**

```bash
pnpm --filter @staff-pulse/client test
```

Expected: FAIL because model modules do not exist.

- [ ] **Step 3: Implement schema and `validateOrgTree()`**

Keep Zod parsing and hierarchy validation separate. Throw `OrgTreeValidationError extends Error` with deterministic diagnostic messages for tests; UI never exposes raw diagnostics.

- [ ] **Step 4: Write index tests**

For an intentionally unsorted valid fixture, assert `nodesById`, child membership, stable sibling order, `rootIds`, and initial expansion containing only roots. Assert leaves have no children entry.

- [ ] **Step 5: Implement indexes and initial expansion**

Implement the exact types and algorithms from “Tree indexes”. Do not add UI state to `OrgNode` and do not mutate input nodes.

- [ ] **Step 6: Run client model tests**

```bash
pnpm --filter @staff-pulse/client test
```

Expected: all schema, validation, index and expansion tests PASS.

- [ ] **Step 7: Commit gate**

Do not commit. If separately authorized, stage only Task 3 files and use `feat(client): validate organization tree data`.

### Task 4: Implement fetch and TanStack Query data flow

**Files:**

- Create: `apps/client/src/features/org-tree/api/fetchOrgTree.ts`
- Create: `apps/client/src/features/org-tree/api/useOrgTreeQuery.ts`
- Create: `apps/client/src/app/queryClient.ts`
- Create: `apps/client/tests/fetchOrgTree.test.ts`
- Modify: `apps/client/src/App.tsx`

**Interfaces:**

- Consumes: schema, `validateOrgTree`, `OrgNode`.
- Produces: `fetchOrgTree(signal: AbortSignal): Promise<readonly OrgNode[]>`.
- Produces: `useOrgTreeQuery()` with key `['org-tree']` and `staleTime: 5_000`.
- Produces: one app-level `QueryClient` and provider.

- [ ] **Step 1: Write failing boundary tests**

Stub `globalThis.fetch` using built-in Node APIs and assert that `fetchOrgTree(signal)`:

- passes the same signal in `RequestInit`;
- returns a schema-valid, hierarchy-valid array;
- rejects a non-2xx response;
- rejects malformed JSON data through Zod;
- rejects a schema-valid cyclic hierarchy through `validateOrgTree()`.

- [ ] **Step 2: Run the boundary tests and confirm failure**

```bash
pnpm --filter @staff-pulse/client test
```

Expected: existing model tests PASS and boundary tests FAIL because `fetchOrgTree` does not exist.

- [ ] **Step 3: Implement the boundary pipeline once**

`fetchOrgTree` calls relative `/api/org-tree`, passes AbortSignal, rejects non-2xx, parses JSON as `unknown`, runs `orgTreeSchema.parse`, then `validateOrgTree`, and returns only validated nodes.

- [ ] **Step 4: Run boundary tests**

```bash
pnpm --filter @staff-pulse/client test
```

Expected: model and boundary tests PASS, including exact AbortSignal identity.

- [ ] **Step 5: Define the query hook**

```ts
useQuery({
    queryKey: ['org-tree'],
    queryFn: ({ signal }) => fetchOrgTree(signal),
    staleTime: 5_000,
})
```

На FOUNDATION `staleTime` остаётся равным `5_000` мс, ручная cache invalidation не выполняется, а для эквивалентных JSON-ответов используется default structural sharing TanStack Query. Не переопределять `structuralSharing` и не добавлять собственное сравнение ответов.

Не добавлять `useEffect + fetch`, manual cache, polling, realtime, custom invalidation или custom retry policy на FOUNDATION.

- [ ] **Step 6: Wire the provider**

Create one `QueryClient` outside React render. `App.tsx` wraps `OrgExplorer` with `QueryClientProvider`.

- [ ] **Step 7: Verify development data flow**

Run `pnpm dev`, open Vite, and confirm `/api/org-tree` goes through the proxy with HTTP 200. Application source must not contain hardcoded `localhost:3001`.

- [ ] **Step 8: Commit gate**

Do not commit. If separately authorized, stage only Task 4 files and use `feat(client): add cached organization query`.

### Task 5: Implement interactive tree and UI states

**Files:**

- Create: `apps/client/src/features/org-tree/ui/OrgExplorer.tsx`
- Create: `apps/client/src/features/org-tree/ui/OrgTree.tsx`
- Create: `apps/client/src/features/org-tree/ui/OrgTreeNode.tsx`
- Create: `apps/client/src/features/org-tree/ui/orgTree.styles.ts`
- Create: `apps/client/src/styles/GlobalStyle.ts`
- Modify: `apps/client/src/App.tsx`
- Modify: `apps/client/src/main.tsx`
- Delete: `apps/client/src/index.css`
- Delete: unused starter assets under `apps/client/src/assets/`

**Interfaces:**

- Consumes: query hook, indexes and initial expansion.
- Produces: `OrgExplorer` owning `expandedNodeIds`.
- Produces: `OrgTree({ index, expandedNodeIds, onToggle })`.
- Produces: recursive `OrgTreeNode({ nodeId, index, expandedNodeIds, onToggle })`.

- [ ] **Step 1: Implement four render branches**

Call `useOrgTreeQuery`, `useMemo` and `useState` unconditionally before all render branches. Then handle first-load loading, error with retry, valid empty array and success. During background refetch keep the success tree mounted.

- [ ] **Step 2: Build indexes once per data reference**

Use `useMemo(() => data ? buildOrgTreeIndex(data) : null, [data])` before conditional returns. Derive the initial root set with a second unconditional `useMemo` from the nullable index. Do not aggregate headcount, budget or performance.

- [ ] **Step 3: Implement feature-owned expansion**

Use the nullable state strategy from “Initial expansion and ownership”. Toggle only nodes with children and update via a new `Set`.

- [ ] **Step 4: Render recursive semantic lists**

Render `rootIds`; resolve each node through `nodesById`; render child IDs only when expanded. Branch buttons expose `aria-expanded`; leaves are not false toggles.

- [ ] **Step 5: Add accessible performance presentation**

Centralize thresholds, map them to high/medium/low labels and styled colors, and show both percentage and label. Do not put thresholds in the API schema.

- [ ] **Step 6: Replace starter styling**

Use styled-components for layout, tree rows, indentation, controls, states and indicators. Add responsive sizing without table/split-view. Remove starter CSS/assets only after imports are gone. Do not use React `style` props or HTML `style` attributes.

- [ ] **Step 7: Run static checks**

```bash
pnpm --filter @staff-pulse/client lint
pnpm --filter @staff-pulse/client test
pnpm build
```

Expected: lint has 0 errors, tests PASS and both apps build.

- [ ] **Step 8: Commit gate**

Do not commit. If separately authorized, stage only Task 5 files and use `feat(client): add interactive organization tree`.

### Task 6: Verify and document FOUNDATION

**Files:**

- Modify: `README.md`
- Create: `docs/architecture.md`
- Create: `docs/data-model.md`
- Create: `docs/adr/001-api-boundary-validation.md`
- Create: `docs/adr/002-server-state-cache.md`
- Review only: all Task 1–5 changes

**Interfaces:**

- Produces: run instructions, factual AI notes, FOUNDATION architecture/data-model documentation, two ADR and evidence for acceptance criteria.

- [ ] **Step 1: Run complete automated verification**

```bash
pnpm --filter @staff-pulse/server test
pnpm --filter @staff-pulse/client test
pnpm --filter @staff-pulse/client lint
pnpm build
```

Expected: every command exits 0; tests have no failures; lint has no errors.

- [ ] **Step 2: Verify compiled API**

Start `pnpm --filter @staff-pulse/server start`, request `/health` and `/api/org-tree`, and confirm HTTP 200, 51 nodes, 3 roots, depth 3, unique IDs and valid parents.

- [ ] **Step 3: Verify success and interaction manually**

Run `pnpm dev`. Confirm Division and Department are initially visible while Teams are hidden; expand/collapse Department and Division; verify every row shows name, headcount, numeric performance and non-color label.

- [ ] **Step 4: Verify loading, network error and retry**

Use browser throttling to observe loading. Stop server and reload for error-state; restart it and press `Повторить` to return to success without page reload.

- [ ] **Step 5: Verify empty and invalid responses**

Use browser DevTools Local Overrides for `/api/org-tree`, without changing API/application code:

1. Return `[]` and confirm empty-state.
2. Return two schema-valid nodes referencing each other and confirm domain error-state.
3. Return a node with `performance: 101` and confirm Zod error-state.
4. Disable overrides and confirm success.

- [ ] **Step 6: Check scope and styles**

```bash
rg -n 'style=|style:\s*\{' apps/client/src
rg -n 'localhost:3001' apps/client/src
```

Expected: no inline style and no hardcoded API origin. Confirm no table, search, realtime, Docker or later-step feature exists.

- [ ] **Step 7: Create FOUNDATION architecture and data-model documentation**

Create or update `docs/architecture.md` with only the implemented FOUNDATION layers:

- Hono server data, app and process-entry modules;
- HTTP boundary and `/api/org-tree`;
- client fetch/schema/domain/query/model/UI modules;
- data flow from request through validation and TanStack Query to `OrgExplorer`/`OrgTree`;
- ownership boundary between server state and `expandedNodeIds` UI state.

Create or update `docs/data-model.md` with:

- exact `OrgNode` fields and field constraints;
- flat parent-linked representation and three hierarchy levels;
- Zod validation followed by `validateOrgTree()`;
- `nodesById`, `childrenByParentId` and `rootIds`;
- initial expansion containing root IDs only.

Do not describe aggregation or realtime contracts as implemented. They remain future-stage requirements.

- [ ] **Step 8: Record the two FOUNDATION ADRs**

Create or update `docs/adr/001-api-boundary-validation.md` with Context, Decision, Alternatives and Consequences for Zod object validation plus separate hierarchy validation. Alternatives: trusting shared TypeScript types and using only per-object Zod validation.

Create or update `docs/adr/002-server-state-cache.md` with Context, Decision, Alternatives and Consequences for TanStack Query. Record `staleTime: 5_000`, AbortSignal forwarding, no manual cache invalidation on FOUNDATION, and reliance on default structural sharing for equivalent JSON responses. Alternatives: `useEffect + fetch`, a handwritten cache, and disabling structural sharing.

Both ADRs describe only implemented FOUNDATION behavior and use present tense only after the corresponding code exists.

- [ ] **Step 9: Replace starter README**

Document Node 24.19, pnpm 12.4.1, `pnpm install`, one-command `pnpm dev`, build, tests/lint, endpoints, workspace structure and FOUNDATION scope.

Add “AI в разработке” with factual statements:

- AI helped structure requirements, compare alias strategies, draft the plan and generate implementation/tests.
- The developer reviewed architectural choices before implementation.
- Manual decisions include client `@/*` vs server `#server/*`, feature-level expansion ownership and two-stage validation.
- List actual manual rewrites and their reasons; do not claim rewrites that did not occur.

- [ ] **Step 10: Report and stop for manual review**

Report files, assumptions, exact commands and outputs. Do not create a commit or `step/1` tag. Wait for manual review and a separate command before commit/tag or `step/2`.

## Review Checklist

- [ ] Every FOUNDATION requirement maps to a task and verification step.
- [ ] Server alias is exactly `#server/*` with the approved conditional mapping.
- [ ] Server dev/build/start scripts match the approved commands.
- [ ] API remains a flat direct array and `/health` remains available.
- [ ] Client rejects invalid shapes and graph topology.
- [ ] Query uses `staleTime: 5_000` and forwards AbortSignal.
- [ ] Query performs no manual invalidation and retains default structural sharing.
- [ ] `OrgExplorer` owns expansion and only roots start expanded.
- [ ] All four UI states and interactions have explicit checks.
- [ ] Architecture, data model and both ADR files describe only implemented FOUNDATION behavior.
- [ ] No later-stage functionality is included.
- [ ] Implementation starts only after a separate explicit command from the user.
