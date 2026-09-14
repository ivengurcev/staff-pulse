# Staff Pulse — step/1 FOUNDATION

## Задача

Реализовать только `01 FOUNDATION`.

Не переходить к требованиям CORE, POLISH и BONUS.

## Текущее состояние репозитория

Репозиторий организован как pnpm workspace:

```text
staff-pulse/
    apps/
        client/
        server/
    package.json
    pnpm-workspace.yaml
```

### Client

`apps/client`

Использует:

- React;
- Vite;
- TypeScript;
- ESLint.

### Server

`apps/server`

Использует:

- Hono;
- `@hono/node-server`;
- TypeScript;
- `tsx`.

Существующий endpoint:

```text
GET /health
```

Его сохранить.

Корневая сборка:

```bash
pnpm build
```

уже собирает client и server.

## Принятые дополнения к FOUNDATION

### Package manager

Использовать pnpm.

Не создавать npm/yarn lock-файлы.

### TypeScript

Сохранить согласованную ветку TypeScript 6.x.

Не обновлять проект на TypeScript 7 без отдельного решения.

### API

Добавить:

```text
GET /api/org-tree
```

Mock-данные должны быть детерминированными.

Предлагаемая структура:

```text
3 Division
    × 4 Department
        × 3 Team
```

Итого:

```text
3 + 12 + 36 = 51 узел
```

API остаётся плоским.

Контракт узла:

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

Условия:

- `headcount` — целое неотрицательное число;
- `budget` — неотрицательное число;
- `performance` — 0–100;
- `updatedAt` — ISO date-time;
- все `id` уникальны;
- каждый ненулевой `parentId` существует;
- циклов нет.

Агрегированные показатели на сервере не считать.

### Runtime-валидация

На клиенте использовать Zod.

Поток данных:

```text
HTTP response
    ↓
unknown
    ↓
Zod
    ↓
OrgNode[]
```

Клиентский тип выводить из схемы:

```ts
type OrgNode = z.infer<typeof orgNodeSchema>
```

Невалидный ответ должен попадать в обычный error-state.

### Кэш и запросы

Использовать TanStack Query.

Настроить:

```ts
staleTime: 5000
```

`AbortSignal`, полученный от TanStack Query, передавать в `fetch`.

Не писать загрузку данных через `useEffect + fetch`.

### Dev proxy

Клиент обращается к:

```text
/api/org-tree
```

без hardcoded `http://localhost:3001`.

В Vite настроить proxy `/api` на Hono server.

### Представление дерева

API остаётся плоским.

Для UI можно построить индекс:

```text
nodesById
childrenByParent
rootIds
```

UI-состояние `expanded` не хранить внутри объектов API.

### Начальное раскрытие дерева

Интерпретация требования «второй уровень открыт по умолчанию»:

```text
Division          раскрыт
    Department    виден, но сам ещё не раскрыт
        Team      скрыт
```

При первом отображении видны Division и их Department.

### UI узла

Показывать:

- name;
- headcount;
- performance indicator.

Performance indicator должен быть цветным, но не зависеть только от цвета.

Добавить доступное текстовое/ARIA-представление числового performance.

### Стили

Использовать styled-components.

Inline CSS не использовать.

Не подключать MUI, Ant Design и другие UI-библиотеки.

### Состояния

Нужно различать:

- loading;
- error;
- empty;
- success.

Пустой массив — это empty, а не error.

Network error, HTTP error и Zod validation error — это error.

## Что не делать на step/1

Не реализовывать:

- таблицу;
- агрегаты;
- сортировку;
- поиск;
- debounce;
- выбор table → tree;
- SSE;
- WebSocket;
- polling;
- realtime patch;
- incremental aggregation;
- connection indicator;
- keyboard navigation таблицы;
- Docker;
- Nginx;
- AI search.

## Проверка

После реализации проверить:

```bash
pnpm build
```

Также проверить lint.

Проверить:

```text
GET /health
GET /api/org-tree
```

Для `/api/org-tree`:

- HTTP 200;
- 51 узел;
- 3 уровня;
- корректные parentId.

UI:

- loading;
- error;
- empty;
- success;
- раскрытие/сворачивание;
- второй уровень виден по умолчанию;
- performance indicator отображается;
- невалидный ответ API приводит к error-state.

Git commit и tag `step/1` не создавать до ручного ревью.
