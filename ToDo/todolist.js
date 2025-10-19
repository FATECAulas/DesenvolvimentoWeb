// todolist.js (módulo) - versão sem banco (localStorage)
// Coloque este arquivo como "todolist.js" (mesma pasta do HTML).

const STORAGE_PREFIX = 'cafe_raccoon_todos_';

const taskListEl = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const userIdDisplay = document.getElementById('user-id-display');
const messageArea = document.getElementById('message-area');
const backButton = document.getElementById('backButton');

let tasks = [];
let userId = null;

function generateId(){
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.floor(Math.random()*100000);
}

function showMessage(msg, isError = false){
  messageArea.textContent = msg;
  messageArea.style.display = 'block';
  messageArea.setAttribute('aria-hidden', 'false');
  if (isError) messageArea.style.background = '#FFE9E6';
  else messageArea.style.background = '';
  setTimeout(()=> {
    messageArea.style.display = 'none';
    messageArea.setAttribute('aria-hidden', 'true');
  }, 3000);
}

function storageKeyForUser(){ return STORAGE_PREFIX + userId; }

function saveTasksToStorage(){
  try { localStorage.setItem(storageKeyForUser(), JSON.stringify(tasks)); }
  catch (e){ console.error('localStorage save error', e); showMessage('Não foi possível salvar localmente', true); }
}

function loadTasksFromStorage(){
  try {
    const raw = localStorage.getItem(storageKeyForUser());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e){
    console.error('localStorage load error', e);
    return [];
  }
}

function renderTasks(){
  taskListEl.innerHTML = '';
  if (!tasks || tasks.length === 0){
    const li = document.createElement('li');
    li.className = 'placeholder';
    li.textContent = 'Não há tarefas. Hora de preparar o menu de Halloween! 🎃';
    taskListEl.appendChild(li);
    return;
  }

  // ordena: pendentes antes de concluídas
  tasks.sort((a,b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.createdAt - b.createdAt;
  });

  tasks.forEach(t => {
    const li = document.createElement('li');

    // checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = !!t.completed;
    checkbox.addEventListener('change', () => toggleTask(t.id, checkbox.checked));

    // texto
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = t.text;
    if (t.completed) span.classList.add('completed');

    // delete
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '🪦';
    del.title = 'Excluir tarefa';
    del.addEventListener('click', () => {
      if (!confirm('Deseja realmente excluir esta tarefa?')) return;
      deleteTask(t.id);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);

    taskListEl.appendChild(li);
  });
}

function addTask(text){
  const val = String(text || '').trim();
  if (!val) {
    showMessage('Digite uma tarefa válida', true);
    return;
  }
  const newTask = { id: generateId(), text: val, completed:false, createdAt: Date.now() };
  tasks.push(newTask);
  saveTasksToStorage();
  renderTasks();
  taskInput.value = '';
  showMessage('Tarefa adicionada!');
}

function toggleTask(id, newState){
  const item = tasks.find(x => x.id === id);
  if (!item) return showMessage('Tarefa não encontrada', true);
  item.completed = !!newState;
  saveTasksToStorage();
  renderTasks();
}

function deleteTask(id){
  tasks = tasks.filter(x => x.id !== id);
  saveTasksToStorage();
  renderTasks();
  showMessage('Tarefa excluída.');
}

function ensureUserId(){
  const UID_KEY = 'cafe_raccoon_user_id';
  let stored = localStorage.getItem(UID_KEY);
  if (!stored) { stored = generateId(); try { localStorage.setItem(UID_KEY, stored); } catch(e){} }
  userId = stored;
  userIdDisplay.textContent = userId;
}

function init(){
  ensureUserId();
  tasks = loadTasksFromStorage();
  renderTasks();

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
  });

  // botão voltar: history.back() se houver histórico, senão fecha janela (mobile)
  backButton.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else window.location.href = '/';
  });

  // Atalho teclado: Enter no input adiciona (já acontece), Esc limpa
  taskInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') taskInput.value = '';
  });
}

window.addEventListener('load', init);
