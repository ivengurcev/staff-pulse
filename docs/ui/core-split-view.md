# CORE UI refinement — split-view

Визуальный референс: `docs/ui/core-split-view.png`.

Цель: привести текущий `step/2 — CORE` к плотному B2B dashboard без hero-блока.

## Layout

Desktop:

- компактная шапка;
- слева `STAFF PULSE`;
- справа один общий search input;
- ниже split-view:
  - слева дерево;
  - справа аналитическая таблица.

## Дерево

- компактные строки;
- `name` + `headcount` + performance indicator;
- без отдельного поиска и больших заголовков;
- chevron только раскрывает/сворачивает;
- клик по содержимому строки устанавливает `selectedNodeId`;
- выбранный узел подсвечивается.

## Таблица

Плоская аналитическая таблица, не tree-table.

Сохранить 5 обязательных колонок:

- Подразделение;
- Уровень;
- Всего сотрудников;
- Бюджет суммарный;
- Средняя эффективность.

Требования:

- плотные строки;
- search внутри таблицы убрать;
- сортировка: click → ASC, double click → DESC;
- на обычном desktop не должно быть горизонтального скролла.

## Search

- единственный search input находится в header;
- использует существующий `filterText` и debounce 250 мс;
- фильтрует только таблицу;
- дерево не фильтруется.

## Selection

Table → tree:

- выбрать строку;
- установить `selectedNodeId`;
- раскрыть предков;
- подсветить узел в дереве.

Tree → table:

- клик по узлу устанавливает тот же `selectedNodeId`;
- соответствующая строка таблицы подсвечивается;
- если строка видима после текущего фильтра, допустим `scrollIntoView`;
- фильтр и сортировку автоматически не сбрасывать.

## Responsive

- desktop — split-view;
- существующее mobile-поведение не ломать;
- без JS viewport detection.

## Не менять без необходимости

- `buildOrgAggregates`;
- `OrgAggregate`;
- `OrgTableRow`;
- `getAncestorIds`;
- API/cache/validation architecture;
- model sort/filter logic;
- ownership state в `OrgExplorer`.

Разрешено менять UI/components/styles и переносить search в header.

## Проверки

После изменений выполнить:

```bash
pnpm --filter @staff-pulse/client test
pnpm --filter @staff-pulse/client lint
pnpm build
```

Commit и tag `step/2` не создавать.

Если потребуется изменить архитектурный контракт — остановиться и сначала сообщить.

В финальном отчёте указать:

- изменённые файлы;
- изменения layout;
- как работает tree ↔ table selection;
- результаты test/lint/build.
