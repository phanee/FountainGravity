(() => {
  "use strict";

  const STORAGE_KEY = "daylist.tasks.v1";
  const $ = (selector) => document.querySelector(selector);
  const today = () => {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };
  const dateLabel = (value) => {
    if (!value) return "No due date";
    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  let tasks = loadTasks();
  let filter = "all";
  let query = "";
  let sort = "date";

  function loadTasks() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored.filter((task) =>
        task && typeof task.id === "string" && typeof task.title === "string"
      ) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Could not save tasks to local storage:", error);
    }
  }

  function visibleTasks() {
    const currentDay = today();
    let result = tasks.filter((task) => {
      if (filter === "today") return !task.completed && task.dueDate === currentDay;
      if (filter === "upcoming") return !task.completed && task.dueDate && task.dueDate > currentDay;
      if (filter === "completed") return task.completed;
      return true;
    });
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((task) => task.title.toLowerCase().includes(needle));
    }
    return result.sort((a, b) => {
      if (sort === "priority") {
        const weight = { high: 0, medium: 1, low: 2 };
        return (weight[a.priority] ?? 1) - (weight[b.priority] ?? 1);
      }
      if (sort === "created") return b.createdAt - a.createdAt;
      return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
    });
  }

  function render() {
    const all = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const todayCount = tasks.filter((task) => !task.completed && task.dueDate === today()).length;
    const upcomingCount = tasks.filter((task) => !task.completed && task.dueDate && task.dueDate > today()).length;
    $("#all-count").textContent = all;
    $("#today-count").textContent = todayCount;
    $("#upcoming-count").textContent = upcomingCount;
    $("#completed-count").textContent = completed;

    const labels = { all: "All tasks", today: "Today", upcoming: "Upcoming", completed: "Completed" };
    $("#breadcrumb-current").textContent = labels[filter];
    $("#list-heading").textContent = filter === "all" ? "Your tasks" : labels[filter];
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === filter);
      button.setAttribute("aria-current", button.dataset.filter === filter ? "page" : "false");
    });

    const open = tasks.filter((task) => !task.completed).length;
    const percent = all ? Math.round((completed / all) * 100) : 0;
    $("#progress-label").textContent = percent + "%";
    $("#progress-fill").style.width = percent + "%";
    $("#progress-copy").textContent = all === 0 ? "A fresh start. You've got this." : percent === 100 ? "Everything is done. Amazing work!" : open + " task" + (open === 1 ? "" : "s") + " left to go.";

    const result = visibleTasks();
    $("#task-total").textContent = result.length + (result.length === 1 ? " task" : " tasks");
    $("#task-list").innerHTML = result.map((task) => {
      const overdue = task.dueDate && task.dueDate < today() && !task.completed;
      return `<article class="task-row ${task.completed ? "done" : ""}" data-id="${escapeHtml(task.id)}">
        <button class="task-check ${task.completed ? "checked" : ""}" data-action="toggle" aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}" aria-pressed="${task.completed}">${task.completed ? "✓" : ""}</button>
        <div class="task-main"><div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta"><span class="priority ${escapeHtml(task.priority || "medium")}">${escapeHtml((task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1))} priority</span><span class="task-date ${overdue ? "overdue" : ""}">${overdue ? "Overdue · " : ""}${escapeHtml(dateLabel(task.dueDate))}</span></div>
        </div>
        <div class="task-actions"><button class="task-action" data-action="edit" aria-label="Edit task" title="Edit">✎</button><button class="task-action" data-action="delete" aria-label="Delete task" title="Delete">×</button></div>
      </article>`;
    }).join("");

    const empty = result.length === 0;
    $("#empty-state").hidden = !empty;
    $("#task-list").hidden = empty;
    $("#footer-count").textContent = open + " task" + (open === 1 ? "" : "s") + " remaining";
    $("#clear-completed").hidden = completed === 0;
  }

  $("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = $("#task-input").value.trim();
    if (!title) return;
    tasks.push({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      title,
      dueDate: $("#due-input").value,
      priority: $("#priority-input").value,
      completed: false,
      createdAt: Date.now()
    });
    saveTasks();
    $("#task-input").value = "";
    $("#due-input").value = "";
    filter = "all";
    render();
    $("#task-input").focus();
  });

  $("#task-list").addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    const row = event.target.closest("[data-id]");
    if (!action || !row) return;
    const task = tasks.find((item) => item.id === row.dataset.id);
    if (!task) return;
    if (action.dataset.action === "toggle") task.completed = !task.completed;
    if (action.dataset.action === "delete") tasks = tasks.filter((item) => item.id !== task.id);
    if (action.dataset.action === "edit") {
      const title = window.prompt("Update task", task.title);
      if (title === null) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      task.title = trimmed.slice(0, 120);
    }
    saveTasks();
    render();
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => { filter = button.dataset.filter; render(); });
  });
  $("#search-input").addEventListener("input", (event) => { query = event.target.value; render(); });
  $("#sort-select").addEventListener("change", (event) => { sort = event.target.value; render(); });
  $("#clear-completed").addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
  });
  $("#theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("daylist.dark", document.body.classList.contains("dark") ? "1" : "0");
  });
  try {
    if (localStorage.getItem("daylist.dark") === "1") document.body.classList.add("dark");
  } catch { /* Theme preference is optional. */ }

  $("#header-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  render();
})();
