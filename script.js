const STORAGE_KEY = "dailyops-chores-v1";

const choreForm = document.querySelector("#chore-form");
const choreInput = document.querySelector("#chore-name");
const choreList = document.querySelector("#chore-list");
const emptyState = document.querySelector("#empty-state");
const stats = document.querySelector("#stats");
const filterButtons = document.querySelectorAll(".filter-btn");

let chores = loadChores();
let activeFilter = "all";

render();

choreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = choreInput.value.trim();
  if (!name) return;

  chores.unshift({
    id: crypto.randomUUID(),
    name,
    done: false,
    createdAt: Date.now(),
  });

  choreInput.value = "";
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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((entry) => entry.classList.toggle("active", entry === button));
    render();
  });
});

function loadChores() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((item) => typeof item.id === "string" && typeof item.name === "string");
  } catch {
    return [];
  }
}

function saveChores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chores));
}

function getVisibleChores() {
  if (activeFilter === "open") return chores.filter((chore) => !chore.done);
  if (activeFilter === "done") return chores.filter((chore) => chore.done);
  return chores;
}

function render() {
  const openCount = chores.filter((chore) => !chore.done).length;
  const doneCount = chores.length - openCount;
  stats.textContent = `${openCount} open • ${doneCount} done • ${chores.length} total`;

  const visibleChores = getVisibleChores();
  choreList.innerHTML = "";

  visibleChores.forEach((chore) => {
    const li = document.createElement("li");
    li.className = `chore-item${chore.done ? " done" : ""}`;
    li.dataset.id = chore.id;

    const text = document.createElement("p");
    text.className = "chore-text";
    text.textContent = chore.name;

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "toggle-btn";
    toggleBtn.dataset.action = "toggle";
    toggleBtn.textContent = chore.done ? "Mark open" : "Mark done";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.action = "delete";
    deleteBtn.textContent = "Delete";

    li.append(text, toggleBtn, deleteBtn);
    choreList.append(li);
  });

  emptyState.hidden = visibleChores.length > 0;
}
