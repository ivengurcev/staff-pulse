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
