# Staff Pulse — этапы реализации

Этот файл разбивает исходное тестовое задание по этапам.

## step/1 — FOUNDATION

Цель: получить рабочий клиент, mock API и интерактивное дерево.

Обязательный результат:

- Vite + React + TypeScript;
- абсолютные импорты;
- собственный сервер;
- `GET /api/org-tree`;
- минимум 40 узлов и минимум 3 уровня;
- runtime-валидация ответа на клиенте;
- error-state для невалидного ответа;
- кэширование;
- stale time 5 секунд;
- отмена запроса при размонтировании;
- интерактивное дерево;
- раскрытие/сворачивание ветвей;
- второй уровень открыт по умолчанию;
- `name`, `headcount`, performance indicator;
- loading/error/empty;
- отсутствие inline CSS.

После проверки:

```bash
git commit -m "feat: complete foundation"
git tag step/1
```

Тег ставится только после полного завершения этапа.

## step/2 — CORE

Цель: добавить аналитическую таблицу и агрегированные показатели.

Обязательный результат:

- таблица;
- агрегированные headcount и budget;
- взвешенный performance;
- уровень узла;
- сортировка;
- обратная сортировка;
- realtime-фильтр;
- debounce 250 мс;
- выбор строки синхронизирован с деревом;
- форматирование бюджета;
- агрегация вычисляется один раз после загрузки и мемоизируется;
- unit-тест функции агрегации.

После проверки:

```bash
git commit -m "feat: complete core analytics"
git tag step/2
```

## step/3 — POLISH

Цель: realtime и UX.

Обязательный результат:

- realtime transport;
- patch без полного refetch;
- подсветка обновившихся ячеек;
- частичный пересчёт агрегатов;
- connection indicator;
- exponential backoff;
- keyboard navigation таблицы;
- анимация дерева;
- `prefers-reduced-motion`.

После проверки:

```bash
git commit -m "feat: complete realtime polish"
git tag step/3
```

## step/4 — BONUS

Цель: production-окружение и бонусная AI-функция.

Результат:

- Docker;
- docker-compose;
- `.env`;
- Nginx;
- gzip;
- production bundle ≤200 КБ gzip;
- AI-поиск;
- fallback на текстовый поиск.

После проверки:

```bash
git commit -m "feat: complete production bonus"
git tag step/4
```
