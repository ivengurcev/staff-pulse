# ADR 002: Кэширование server state через TanStack Query

## Контекст

Client должен кэшировать ответ, избегать лишних запросов, поддерживать stale-while-revalidate-подобное поведение и корректно отменять запрос при исчезновении consumer.

## Решение

Для `/api/org-tree` используется TanStack Query:

- query key — `['org-tree']`;
- `staleTime` — 5000 мс;
- `AbortSignal` из query function передаётся в `fetch`;
- ручная cache invalidation на FOUNDATION не выполняется;
- `structuralSharing` не переопределяется: для эквивалентных JSON-ответов используется default structural sharing.

Один `QueryClient` создаётся вне React render и предоставляется через `QueryClientProvider`.

## Альтернативы

- `useEffect + fetch` — отклонено из-за ручного управления lifecycle, отменой, deduplication и cache.
- Самописный cache — отклонён как лишняя сложность для стандартной задачи server state.
- Отключение structural sharing или собственное сравнение — отклонено: на FOUNDATION нет требования, которое оправдывает дополнительную cache-логику.

## Последствия

- Повторные consumers используют общий cache и deduplication библиотеки.
- Данные считаются свежими 5 секунд, после чего библиотека может выполнить background revalidation по своим стандартным правилам.
- Эквивалентный JSON сохраняет стабильные ссылки там, где это обеспечивает default structural sharing.
- Realtime patching и точечная invalidation не реализуются на FOUNDATION.
