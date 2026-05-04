const STORAGE_KEY = "dailyops-chores-v2";

const choreForm = document.querySelector("#chore-form");
const choreInput = document.querySelector("#chore-name");
const choreCategory = document.querySelector("#chore-category");
const chorePriority = document.querySelector("#chore-priority");
const choreReminder = document.querySelector("#chore-reminder");
const choreList = document.querySelector("#chore-list");
const emptyState = document.querySelector("#empty-state");
const stats = document.querySelector("#stats");
const statusButtons = document.querySelectorAll(".filter-btn[data-filter]");
const timeButtons = document.querySelectorAll(".filter-btn[data-time]");

let chores = loadChores();
let activeStatus = "all";
let activeTime = "all";

render();
setInterval(render, 30000);

choreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = choreInput.value.trim();
  if (!name) return;

  const now = Date.now();
  const reminderMinutes = Number(choreReminder.value);

  chores.unshift({
    id: crypto.randomUUID(),
    name,
    done: false,
    category: choreCategory.value,
    priority: chorePriority.value,
    shift: inferShift(now),
    createdAt: now,
    reminderAt: reminderMinutes > 0 ? now + reminderMinutes * 60000 : null,
  });

  choreInput.value = "";
  choreReminder.value = "0";
  saveChores();
  render();
});

choreList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const item = button.closest(".chore-item");
  if (!item) return;

  const { id } = item.dataset;
  if (!id) return;

  if (button.dataset.action === "toggle") {
    chores = chores.map((chore) => (chore.id === id ? { ...chore, done: !chore.done } : chore));
  }

  if (button.dataset.action === "delete") {
    chores = chores.filter((chore) => chore.id !== id);
  }

  saveChores();
  render();
});

statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.filter;
    statusButtons.forEach((entry) => entry.classList.toggle("active", entry === button));
    render();
  });
});

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTime = button.dataset.time;
    timeButtons.forEach((entry) => entry.classList.toggle("active", entry === button));
    render();
  });
});

function loadChores() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter((item) => typeof item.id === "string" && typeof item.name === "string")
      .map((item) => ({
        id: item.id,
        name: item.name,
        done: Boolean(item.done),
        category: item.category || "General",
        priority: item.priority || "medium",
        shift: item.shift || inferShift(item.createdAt || Date.now()),
        createdAt: Number(item.createdAt) || Date.now(),
        reminderAt: item.reminderAt ? Number(item.reminderAt) : null,
      }));
  } catch {
    return [];
  }
}

function saveChores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chores));
}

function inferShift(timestamp) {
  const h = new Date(timestamp).getHours();
  if (h >= 6 && h < 14) return "1st Shift";
  if (h >= 14 && h < 22) return "2nd Shift";
  return "3rd Shift";
}

function isInTimeRange(chore) {
  const now = new Date();
  const created = new Date(chore.createdAt);
  if (activeTime === "all") return true;
  if (activeTime === "today") {
    return created.toDateString() === now.toDateString();
  }
  if (activeTime === "week") {
    const diff = now - created;
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }
  if (activeTime === "month") {
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }
  return true;
}

function isAlert(chore) {
  return !chore.done && Number.isFinite(chore.reminderAt) && Date.now() >= chore.reminderAt;
}

function getVisibleChores() {
  let filtered = chores.filter(isInTimeRange);
  if (activeStatus === "open") filtered = filtered.filter((chore) => !chore.done);
  if (activeStatus === "done") filtered = filtered.filter((chore) => chore.done);
  if (activeStatus === "alert") filtered = filtered.filter(isAlert);
  return filtered;
}

function render() {
  const openCount = chores.filter((chore) => !chore.done).length;
  const doneCount = chores.length - openCount;
  const alertCount = chores.filter(isAlert).length;
  stats.textContent = `${openCount} open • ${doneCount} done • ${alertCount} alerts • ${chores.length} total`;

  const visibleChores = getVisibleChores();
  choreList.innerHTML = "";

  visibleChores.forEach((chore) => {
    const li = document.createElement("li");
    li.className = `chore-item${chore.done ? " done" : ""}`;
    li.dataset.id = chore.id;

    const main = document.createElement("div");
    main.className = "chore-main";

    const text = document.createElement("p");
    text.className = "chore-text";
    text.textContent = chore.name;

    const meta = document.createElement("p");
    meta.className = "chore-meta";
    meta.append(
      makeChip(chore.category),
      makeChip(chore.priority, chore.priority),
      makeChip(chore.shift),
      makeChip(new Date(chore.createdAt).toLocaleString())
    );

    if (isAlert(chore)) {
      meta.append(makeChip("Reminder due", "alert"));
    }

    main.append(text, meta);

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "toggle-btn";
    toggleBtn.dataset.action = "toggle";
    toggleBtn.textContent = chore.done ? "Re-open" : "Resolve";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.action = "delete";
    deleteBtn.textContent = "Delete";

    li.append(main, toggleBtn, deleteBtn);
    choreList.append(li);
  });

  emptyState.hidden = visibleChores.length > 0;
}

function makeChip(label, variant) {
  const span = document.createElement("span");
  span.className = `chip${variant ? ` ${variant}` : ""}`;
  span.textContent = label;
  return span;
}
