# lendtrack-js

A small, reusable JavaScript library for lending trackers. It adds one global object: `LendTrack`.

## Install

```html
<script src="https://cdn.jsdelivr.net/gh/Leandro-K/lendtrack-js@v1.0.0/lendtrack.js"></script>
```

Works best with [lt-css-library](https://github.com/Leandro-K/lt-css-library).

## API

### Lending

| Function | What it does |
|---|---|
| `LendTrack.create(data)` | Returns a new item with an `id` and `returned: false` |
| `LendTrack.status(item)` | `{ text, variant, overdue }` – On loan / Overdue / Returned |
| `LendTrack.summary(items)` | `{ total, overdue }` |
| `LendTrack.toggleReturned(items, id)` | Returns a new list with that item's `returned` flipped |
| `LendTrack.remove(items, id)` | Returns a new list without that item |
| `LendTrack.sortByDue(items)` | Returns a new list sorted by `dueDate` |

### Forms, tabs, tables

| Function | What it does |
|---|---|
| `LendTrack.form(form, { fields, onSubmit })` | Validates a form and shows each message beside its field (element with id `<input id>-msg`) |
| `LendTrack.rules.required / minLength / maxLength / pattern / date` | Validation rules, each with a custom message |
| `LendTrack.tabs(root)` | Turns `.lt-tab` buttons into tabs; returns `{ select }` |
| `LendTrack.table(tbody, rows, columns, emptyText)` | Renders table rows |

### Helpers

| Function | What it does |
|---|---|
| `LendTrack.store(key, fallback)` | `load()` / `save()` with localStorage |
| `LendTrack.dates.parse / today / isPast / format` | Date helpers |
| `LendTrack.el`, `LendTrack.button`, `LendTrack.badge`, `LendTrack.uid` | Small DOM helpers |

## Used by

- [book-lending-tracker](https://github.com/Leandro-K/book-lending-tracker)
