/* ===========================
   TaskFlow — Frontend JS
   =========================== */

const API = window.location.origin;

// -------- STATE --------
let currentUser = null;   // { id, userName }
let tasks = [];
let activeFilter = 'all';
let searchQuery = '';
let authMode = 'login'; // 'login' | 'register'

// -------- DOM REFS --------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const authScreen = $('#auth-screen');
const dashScreen = $('#dashboard-screen');
const authForm = $('#auth-form');
const authUsername = $('#auth-username');
const authPassword = $('#auth-password');
const authError = $('#auth-error');
const authBtnText = $('#auth-btn-text');
const authSubmitBtn = $('#auth-submit');
const loginTab = $('#login-tab');
const registerTab = $('#register-tab');
const tabIndicator = $('#tab-indicator');

const userAvatar = $('#user-avatar');
const userDisplayName = $('#user-display-name');
const logoutBtn = $('#logout-btn');

const taskListEl = $('#task-list');
const emptyState = $('#empty-state');
const loadingState = $('#loading-state');
const addTaskBtn = $('#add-task-btn');

const statTotal = $('#stat-total');
const statDone = $('#stat-done');
const statPending = $('#stat-pending');

const taskModal = $('#task-modal');
const taskForm = $('#task-form');
const modalTitle = $('#modal-title');
const taskTitleInput = $('#task-title');
const taskDescInput = $('#task-desc');
const taskPriorityInput = $('#task-priority');
const taskDateInput = $('#task-date');
const taskEditId = $('#task-edit-id');
const searchInput = $('#search-input');
const modalSaveText = $('#modal-save-text');
const modalSaveBtn = $('#modal-save-btn');
const modalCloseBtn = $('#modal-close-btn');
const modalCancelBtn = $('#modal-cancel-btn');

const filterBtns = $$('.pill[data-filter]');
const toastContainer = $('#toast-container');

// -------- PARTICLES --------
(function initParticles() {
  const container = $('#particles');
  const count = 35;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    const size = Math.random() * 4 + 2;
    const hue = Math.random() > 0.5 ? '250' : '340';
    dot.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      bottom:-${size}px;
      background:hsla(${hue},80%,65%,${Math.random() * 0.4 + 0.15});
      animation-duration:${Math.random() * 12 + 10}s;
      animation-delay:${Math.random() * 10}s;
    `;
    container.appendChild(dot);
  }
})();

// -------- AUTH TABS --------
loginTab.addEventListener('click', () => switchAuthTab('login'));
registerTab.addEventListener('click', () => switchAuthTab('register'));

function switchAuthTab(mode) {
  authMode = mode;
  loginTab.classList.toggle('active', mode === 'login');
  registerTab.classList.toggle('active', mode === 'register');
  tabIndicator.classList.toggle('right', mode === 'register');
  authBtnText.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  authError.textContent = '';
}

// -------- AUTH FORM --------
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userName = authUsername.value.trim();
  const password = authPassword.value.trim();
  if (!userName || !password) return;

  authError.textContent = '';
  authSubmitBtn.classList.add('loading');

  try {
    if (authMode === 'register') {
      await registerUser(userName, password);
      toast('Account created! Signing you in…', 'success');
    }
    // Login flow — call the backend login endpoint
    const loginRes = await fetch(`${API}/User/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, password })
    });

    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => ({}));
      authError.textContent = errorData.message || 'Invalid username or password.';
      authSubmitBtn.classList.remove('loading');
      return;
    }

    const user = await loginRes.json();
    // id is now a hex string thanks to @JsonSerialize(ToStringSerializer)
    currentUser = { id: user.id, userName: user.userName };
    enterDashboard();
  } catch (err) {
    authError.textContent = err.message || 'Something went wrong. Is the backend running?';
  } finally {
    authSubmitBtn.classList.remove('loading');
  }
});

async function registerUser(userName, password) {
  const res = await fetch(`${API}/User`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password })
  });
  if (res.status === 409) throw new Error('Username already taken.');
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Registration failed.');
  }
}

// -------- DASHBOARD --------
function enterDashboard() {
  authScreen.classList.remove('active');
  dashScreen.classList.add('active');
  userAvatar.textContent = currentUser.userName.charAt(0).toUpperCase();
  userDisplayName.textContent = currentUser.userName;
  loadTasks();
}

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  tasks = [];
  dashScreen.classList.remove('active');
  authScreen.classList.add('active');
  authForm.reset();
  authError.textContent = '';
});

// =========================================================
//  TASKS — API calls matched to Spring Boot endpoints
// =========================================================

// GET /Task/user/{userId}  →  returns List<TaskEntry>
async function loadTasks() {
  taskListEl.innerHTML = '';
  emptyState.style.display = 'none';
  loadingState.style.display = 'flex';

  try {
    const res = await fetch(`${API}/Task/user/${currentUser.id}`);
    if (res.status === 404) {
      // No tasks yet — that's fine
      tasks = [];
    } else if (res.ok) {
      tasks = await res.json();
    } else {
      throw new Error('Failed to load tasks');
    }
  } catch (err) {
    if (err.message === 'Failed to load tasks') {
      toast('Could not load tasks', 'error');
    }
    tasks = [];
  } finally {
    loadingState.style.display = 'none';
    renderTasks();
    updateStats();
  }
}

// POST /Task/{userName}  →  body: TaskEntry JSON  →  returns saved TaskEntry (with id)
async function createTask(title, description, priority, dueDate) {
  const res = await fetch(`${API}/Task/${encodeURIComponent(currentUser.userName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, priority, dueDate, completed: false })
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

// PUT /Task/id/{userName}/{myId}  →  body: TaskEntry JSON  →  returns updated TaskEntry
async function updateTask(id, data) {
  const res = await fetch(`${API}/Task/id/${encodeURIComponent(currentUser.userName)}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

// DELETE /Task/id/{userName}/{myId}  →  204 No Content
async function deleteTask(id) {
  const res = await fetch(`${API}/Task/id/${encodeURIComponent(currentUser.userName)}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

// =========================================================
//  RENDER
// =========================================================

function getFilteredTasks() {
  let filtered = tasks;
  if (activeFilter === 'completed') filtered = filtered.filter(t => t.completed);
  if (activeFilter === 'pending') filtered = filtered.filter(t => !t.completed);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }
  return filtered;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return due < today;
}

function renderTasks() {
  const filtered = getFilteredTasks();
  taskListEl.innerHTML = '';
  emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';

  filtered.forEach((task, i) => {
    const taskId = getTaskId(task);
    const overdue = !task.completed && isOverdue(task.dueDate);
    const el = document.createElement('div');
    el.className = `task-item${task.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`;
    el.style.animationDelay = `${i * 0.05}s`;

    let metaHtml = '';
    if (task.priority) metaHtml += `<span class="priority-tag prio-${task.priority.toLowerCase()}">${task.priority}</span>`;
    if (task.dueDate) metaHtml += `<span class="date-tag">${overdue ? 'Overdue: ' : ''}${task.dueDate}</span>`;

    el.innerHTML = `
      <label class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${taskId}" />
        <div class="checkmark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </label>
      <div class="task-content">
        <div class="task-header-row">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">${metaHtml}</div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit" data-id="${taskId}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="task-action-btn delete" data-id="${taskId}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    taskListEl.appendChild(el);
  });

  // Attach event listeners
  taskListEl.querySelectorAll('.task-checkbox input').forEach(cb => {
    cb.addEventListener('change', handleToggle);
  });
  taskListEl.querySelectorAll('.task-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', handleEdit);
  });
  taskListEl.querySelectorAll('.task-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', handleDelete);
  });
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  animateCounter(statTotal, total);
  animateCounter(statDone, done);
  animateCounter(statPending, total - done);
}

function animateCounter(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const interval = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(interval);
  }, 50);
}

// =========================================================
//  HANDLERS
// =========================================================

async function handleToggle(e) {
  const id = e.target.dataset.id;
  const task = findTaskById(id);
  if (!task) return;
  try {
    const updated = await updateTask(id, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      completed: !task.completed
    });
    // Merge update into local state
    const idx = tasks.findIndex(t => getTaskId(t) === id);
    if (idx !== -1) tasks[idx] = updated;
    renderTasks();
    updateStats();
    toast(updated.completed ? 'Task completed! 🎉' : 'Task reopened', 'success');
  } catch {
    toast('Failed to update task', 'error');
    e.target.checked = task.completed; // revert checkbox
  }
}

function handleEdit(e) {
  const id = e.currentTarget.dataset.id;
  const task = findTaskById(id);
  if (!task) return;
  openModal('edit', task);
}

function handleDelete(e) {
  const id = e.currentTarget.dataset.id;
  const task = findTaskById(id);
  if (!task) return;
  showConfirm(`Delete "${task.title}"?`, 'This action cannot be undone.', async () => {
    try {
      await deleteTask(id);
      tasks = tasks.filter(t => getTaskId(t) !== id);
      renderTasks();
      updateStats();
      toast('Task deleted', 'info');
    } catch {
      toast('Failed to delete task', 'error');
    }
  });
}

// -------- FILTERS --------
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderTasks();
});

// =========================================================
//  MODAL
// =========================================================

addTaskBtn.addEventListener('click', () => openModal('create'));
modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
taskModal.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(); });

function openModal(mode, task = null) {
  taskForm.reset();
  taskEditId.value = '';
  if (mode === 'edit' && task) {
    modalTitle.textContent = 'Edit Task';
    modalSaveText.textContent = 'Save Changes';
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskPriorityInput.value = task.priority || 'Low';
    taskDateInput.value = task.dueDate || '';
    taskEditId.value = getTaskId(task);
  } else {
    modalTitle.textContent = 'New Task';
    modalSaveText.textContent = 'Create Task';
  }
  taskModal.classList.add('open');
  setTimeout(() => taskTitleInput.focus(), 150);
}

function closeModal() {
  taskModal.classList.remove('open');
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const priority = taskPriorityInput.value;
  const dueDate = taskDateInput.value;
  if (!title) return;

  modalSaveBtn.classList.add('loading');

  try {
    if (taskEditId.value) {
      // EDIT existing task
      const existing = findTaskById(taskEditId.value);
      const updated = await updateTask(taskEditId.value, {
        title,
        description,
        priority,
        dueDate,
        completed: existing ? existing.completed : false
      });
      const idx = tasks.findIndex(t => getTaskId(t) === taskEditId.value);
      if (idx !== -1) tasks[idx] = updated;
      toast('Task updated', 'success');
      closeModal();
      renderTasks();
      updateStats();
    } else {
      // CREATE new task
      await createTask(title, description, priority, dueDate);
      closeModal();
      // Reload from server to get the full list with proper IDs
      await loadTasks();
      toast('Task created! ✨', 'success');
    }
  } catch {
    toast('Something went wrong', 'error');
  } finally {
    modalSaveBtn.classList.remove('loading');
  }
});

// =========================================================
//  CONFIRM DIALOG
// =========================================================
function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h4>${title}</h4>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// =========================================================
//  TOAST
// =========================================================
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  el.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    el.addEventListener('animationend', () => el.remove());
  }, 3500);
}

// =========================================================
//  UTILITY HELPERS
// =========================================================

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Safely extract the task ID as a string.
 * With @JsonSerialize(ToStringSerializer) on the backend,
 * task.id comes as a plain hex string like "507f1f77bcf86cd799439011".
 */
function getTaskId(task) {
  if (!task || !task.id) return '';
  // If it's already a string, return as-is
  if (typeof task.id === 'string') return task.id;
  // Fallback: if somehow it's still an ObjectId object with $oid
  if (task.id.$oid) return task.id.$oid;
  // Last resort: convert to string
  return String(task.id);
}

/**
 * Find a task in the local array by its ID string.
 */
function findTaskById(id) {
  return tasks.find(t => getTaskId(t) === id) || null;
}

// =========================================================
//  KEYBOARD SHORTCUTS
// =========================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
  // Ctrl+N to add task when on dashboard
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && dashScreen.classList.contains('active')) {
    e.preventDefault();
    openModal('create');
  }
});
