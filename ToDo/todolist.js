// script.js - versão sem banco, usando localStorage
// rodar como módulo para permitir later extensões; não usa imports externos.

// --- Configuração / chaves de localStorage ---
const STORAGE_PREFIX = 'cafe_raccoon_todos_'; // prefixo + userId

// --- Elementos UI ---
const taskListEl = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const userIdDisplay = document.getElementById('user-id-display');
const messageArea = document.getElementById('message-area');

let tasks = []; // array local de tarefas
let userId = null;

// --- Utilitários ---
function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  // fallback simples
  return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function showMessage(msg, isError = false) {
  messageArea.textContent = msg;
  messageArea.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-cafe-accent/20', 'text-cafe-dark');
  if (isError) {
    messageArea.classList.add('bg-red-100', 'text-red-700');
  } else {
    messageArea.classList.add('bg-cafe-accent/20', 'text-cafe-dark');
  }
  setTimeout(() => {
    messageArea.classList.add('hidden');
  }, 3500);
}

// --- Persistência local ---
function storageKeyForUser() {
  return STORAGE_PREFIX + userId;
}

function saveTasksToStorage() {
  try {
    localStorage.setItem(storageKeyForUser(), JSON.stringify(tasks));
  } catch (err) {
    console.error('Erro ao salvar localStorage', err);
    showMessage('Erro ao salvar localmente.', true);
  }
}

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(storageKeyForUser());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Erro ao carregar localStorage', err);
    return [];
  }
}

// --- Renderização ---
function renderTasks() {
  taskListEl.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'text-center text-gray-500 p-4 bg-cafe-bg rounded-lg italic';
    emptyMessage.textContent = 'Não há tarefas. Hora de servir o primeiro café! ☕';
    taskListEl.appendChild(emptyMessage);
    return;
  }

  // ordenar: pendentes primeiro por createdAt, depois concluídas por createdAt
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.createdAt - b.createdAt;
  });

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between p-3 bg-cafe-light border-b border-cafe-main/10 rounded-lg shadow-sm hover:shadow-md transition duration-150';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex items-center flex-grow min-w-0';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.className = 'task-checkbox w-5 h-5 mr-3 appearance-none border-2 border-cafe-main rounded-full cursor-pointer transition duration-150 flex-shrink-0';
    checkbox.addEventListener('click', () => toggleTask(task.id, !task.completed));

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text text-lg text-cafe-dark truncate';
    textSpan.textContent = task.text;
    if (task.completed) {
      textSpan.classList.add('line-through', 'text-gray-400');
    }

    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(textSpan);

    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2';

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Excluir tarefa';
    deleteBtn.className = 'p-2 rounded-full text-lg hover:bg-red-100 text-red-500 transition duration-150 flex-shrink-0';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    controls.appendChild(deleteBtn);

    li.appendChild(contentDiv);
    li.appendChild(controls);
    taskListEl.appendChild(li);
  });
}

// --- Operações ---
function addTask(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    showMessage('Digite uma tarefa válida.', true);
    return;
  }
  const newTask = {
    id: generateId(),
    text: trimmed,
    completed: false,
    createdAt: Date.now()
  };
  tasks.push(newTask);
  saveTasksToStorage();
  renderTasks();
  taskInput.value = '';
  showMessage('Tarefa adicionada!');
}

function toggleTask(id, newState) {
  const t = tasks.find(x => x.id === id);
  if (!t) return showMessage('Tarefa não encontrada', true);
  t.completed = !!newState;
  saveTasksToStorage();
  renderTasks();
}

function deleteTask(id) {
  // confirmação simples (não usa alert blocking; usa confirm)
  const ok = confirm('Deseja realmente excluir esta tarefa?');
  if (!ok) return;
  tasks = tasks.filter(x => x.id !== id);
  saveTasksToStorage();
  renderTasks();
  showMessage('Tarefa excluída.');
}

// --- Inicialização ---
function ensureUserId() {
  // tenta manter userId persistido em localStorage (diferente da lista de tarefas)
  const UID_KEY = 'cafe_raccoon_user_id';
  let stored = localStorage.getItem(UID_KEY);
  if (!stored) {
    stored = generateId();
    try { localStorage.setItem(UID_KEY, stored); } catch (e) { /* ignore */ }
  }
  userId = stored;
  userIdDisplay.textContent = userId;
}

function init() {
  ensureUserId();
  tasks = loadTasksFromStorage();
  renderTasks();

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
  });
}

// start
window.addEventListener('load', init);