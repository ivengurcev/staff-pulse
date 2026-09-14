# Staff Pulse

Дашборд для просмотра оргструктуры компании. На этапе FOUNDATION реализованы mock API, runtime-валидация ответа, кэширование server state и интерактивное дерево подразделений.

## Требования

- Node.js 24.19.0;
- pnpm 12.4.1.

## Запуск

Установить зависимости:

```bash
pnpm install
```

Запустить client и server одной командой:

```bash
pnpm dev
```

- Client: `http://localhost:5173`;
- Server: `http://localhost:3001`.

## Команды

```bash
pnpm build
pnpm --filter @staff-pulse/client lint
pnpm --filter @staff-pulse/client test
pnpm --filter @staff-pulse/server test
```

## API

- `GET /health` — состояние server;
- `GET /api/org-tree` — плоский массив из 51 узла оргструктуры.

Client обращается к относительному `/api/org-tree`; Vite proxy перенаправляет запрос на Hono server.

## Структура

```text
apps/
    client/    React, Vite, TanStack Query, Zod, styled-components
    server/    Hono mock API
docs/
    adr/       архитектурные решения
    plans/     утверждённые планы реализации
    steps/     требования и границы этапов
```

Подробнее:

- [Архитектура](docs/architecture.md);
- [Модель данных](docs/data-model.md);
- [План FOUNDATION](docs/plans/01-foundation.md).

## Текущий scope

FOUNDATION включает API, валидацию, кэш и интерактивное дерево с loading/error/empty/success состояниями. Аналитическая таблица, агрегация, realtime и production-окружение относятся к следующим этапам и пока не реализованы.

## AI в разработке

AI помог структурировать требования, сравнить варианты server alias, подготовить и реализовать утверждённый план FOUNDATION, написать тесты и документацию.

Разработчик вручную определил и утвердил ключевые решения: разделение `@/*` на client и `#server/*` на server, двухэтапную валидацию API boundary, feature-level ownership состояния раскрытия и использование встроенного `node:test`.

На текущем этапе сгенерированный код ещё не переписывался вручную: он ожидает отдельного ручного ревью. После ревью этот раздел должен быть актуализирован фактическими изменениями и их причинами.
