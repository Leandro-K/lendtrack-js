const LendTrack = (function () {
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    children.flat().forEach((child) => {
      if (child === undefined || child === null || child === false) return;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function button(text, variant, onClick, small) {
    return el("button", {
      type: "button",
      class: "lt-btn lt-btn--" + (variant || "secondary") + (small ? " lt-btn--sm" : ""),
      text,
      onClick
    });
  }

  function badge(text, variant) {
    return el("span", { class: "lt-badge" + (variant ? " lt-badge--" + variant : ""), text });
  }

  function store(key, fallback) {
    return {
      load() {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
        } catch (e) {
          return JSON.parse(JSON.stringify(fallback));
        }
      },
      save(value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
      }
    };
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const dates = {
    parse(value) {
      const [y, m, d] = String(value).split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    },
    today() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },
    isPast(value) {
      return dates.parse(value) < dates.today();
    },
    format(value) {
      return dates.parse(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
  };

  const rules = {
    required: (message) => (v) => (v.length > 0 ? "" : message || "This field is required."),
    minLength: (n, message) => (v) => (v.length >= n ? "" : message || "Use at least " + n + " characters."),
    maxLength: (n, message) => (v) => (v.length <= n ? "" : message || "Use at most " + n + " characters."),
    pattern: (re, message) => (v) => (v === "" || re.test(v) ? "" : message || "This value is not valid."),
    date: (message) => (v) => (v === "" || !Number.isNaN(dates.parse(v).getTime()) ? "" : message || "This date is not valid.")
  };

  function form(formEl, options) {
    const fields = options.fields;
    const names = Object.keys(fields);
    const touched = new Set();
    const value = (name) => formEl.elements[name].value.trim();

    function errorFor(name) {
      for (const rule of fields[name]) {
        const message = rule(value(name));
        if (message) return message;
      }
      return "";
    }

    function show(name, message) {
      const input = formEl.elements[name];
      const slot = document.getElementById(input.id + "-msg");
      if (slot) slot.textContent = message;
      input.classList.toggle("lt-input--invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function check(name) {
      const message = errorFor(name);
      show(name, message);
      return !message;
    }

    function validate() {
      names.forEach((name) => touched.add(name));
      const invalid = names.filter((name) => !check(name));
      if (invalid.length) formEl.elements[invalid[0]].focus();
      return invalid.length === 0;
    }

    function clear() {
      touched.clear();
      names.forEach((name) => show(name, ""));
    }

    names.forEach((name) => {
      const input = formEl.elements[name];
      const recheck = () => touched.has(name) && check(name);
      input.addEventListener("blur", () => {
        touched.add(name);
        check(name);
      });
      input.addEventListener("input", recheck);
      input.addEventListener("change", recheck);
    });

    formEl.setAttribute("novalidate", "");
    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) return;
      options.onSubmit(Object.fromEntries(names.map((name) => [name, value(name)])));
      formEl.reset();
    });
    formEl.addEventListener("reset", clear);

    return { validate, clear };
  }

  function tabs(root) {
    const list = Array.from(root.querySelectorAll(".lt-tab"));
    const panelOf = (tab) => tab.getAttribute("aria-controls");

    function select(panelId, focus) {
      list.forEach((tab) => {
        const active = panelOf(tab) === panelId;
        tab.classList.toggle("lt-tab--active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        document.getElementById(panelOf(tab)).hidden = !active;
        if (active && focus) tab.focus();
      });
    }

    root.setAttribute("role", "tablist");
    list.forEach((tab, i) => {
      tab.setAttribute("role", "tab");
      tab.addEventListener("click", () => select(panelOf(tab)));
      tab.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        select(panelOf(list[(i + step + list.length) % list.length]), true);
      });
    });

    select(panelOf(list.find((t) => t.classList.contains("lt-tab--active")) || list[0]));
    return { select };
  }

  function table(tbody, rows, columns, empty) {
    tbody.replaceChildren();
    if (rows.length === 0) {
      tbody.append(el("tr", {}, el("td", { colspan: columns.length, class: "lt-text-center lt-muted", text: empty || "No data." })));
      return;
    }
    rows.forEach((row) => tbody.append(el("tr", {}, columns.map((render) => el("td", {}, render(row))))));
  }

  function create(data) {
    return { id: uid(), ...data, returned: false };
  }

  function status(item) {
    if (item.returned) return { text: "Returned", variant: "success", overdue: false };
    if (dates.isPast(item.dueDate)) return { text: "Overdue", variant: "danger", overdue: true };
    return { text: "On loan", variant: "warning", overdue: false };
  }

  function summary(items) {
    return { total: items.length, overdue: items.filter((i) => status(i).overdue).length };
  }

  function toggleReturned(items, id) {
    return items.map((i) => (i.id === id ? { ...i, returned: !i.returned } : i));
  }

  function remove(items, id) {
    return items.filter((i) => i.id !== id);
  }

  function sortByDue(items) {
    return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  return {
    version: "1.0.0",
    el, button, badge, store, uid, dates, rules, form, tabs, table,
    create, status, summary, toggleReturned, remove, sortByDue
  };
})();
