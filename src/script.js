// ==============================
// 1. NAVIGACE — přepínání stránek
// ==============================

function setPageLoading(isLoading) {
  const content = document.querySelector('.content');
  if (!content) return;
  content.classList.toggle('is-loading', isLoading);
}

function showPage(pageId, btnId) {
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(pageId).classList.remove('hidden');
  if (btnId) document.getElementById(btnId).classList.add('active');
}

function showAuthPage(pageId) {
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-register').classList.add('hidden');
  document.getElementById('page-email-confirm').classList.add('hidden');
  document.getElementById('page-onboarding').classList.add('hidden');
  document.getElementById('page-reset-password').classList.add('hidden');
  document.getElementById(pageId).classList.remove('hidden');
}

function showMainApp() {
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-register').classList.add('hidden');
  document.getElementById('page-email-confirm').classList.add('hidden');
  document.getElementById('page-onboarding').classList.add('hidden');
}

document.getElementById('btn-dnes').addEventListener('click', async () => {
  closeTaskDetail();
  setPageLoading(true);
  showPage('page-dnes', 'btn-dnes');
  await loadTasks();
  document.querySelectorAll('#page-dnes .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-dnes .filter-btn').classList.add('active');
  await updateFilterCounts();
  setPageLoading(false);
});

document.getElementById('btn-vsechnyukoly').addEventListener('click', async () => {
  closeTaskDetail();
  currentCategoryId = null;
  currentCategoryName = null;
  currentCategoryEmoji = null;
  setPageLoading(true);
  showPage('page-vsechny-ukoly', 'btn-vsechnyukoly');
  document.querySelector('#page-vsechny-ukoly .page-title').textContent = 'Všechny úkoly';
  document.querySelectorAll('#page-vsechny-ukoly .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-vsechny-ukoly .filter-btn').classList.add('active');
  await showActiveTasks();
  await updateFilterCounts();
  setPageLoading(false);
});

document.getElementById('btn-vsechny-projekty').addEventListener('click', async () => {
  closeTaskDetail();
  setPageLoading(true);
  currentProjectCategoryId = null;
  currentProjectCategoryName = null;
  currentProjectCategoryEmoji = null;
  document.querySelectorAll('.sidebar-category-project').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-projekty .page-title').textContent = 'Všechny projekty';
  document.querySelector('#page-projekty .page-subtitle').textContent = 'Všechny projekty na jednom místě';
  await loadProjects();
  showPage('page-projekty', 'btn-vsechny-projekty');
  setPageLoading(false);
});

document.getElementById('backToProjects').addEventListener('click', async () => {
  setPageLoading(true);
  currentProjectCategoryId = null;
  currentProjectCategoryName = null;
  currentProjectCategoryEmoji = null;
  document.querySelectorAll('.sidebar-category-project').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-projekty .page-title').textContent = 'Všechny projekty';
  document.querySelector('#page-projekty .page-subtitle').textContent = 'Všechny projekty na jednom místě';
  await loadProjects();
  showPage('page-projekty', 'btn-vsechny-projekty');
  setPageLoading(false);
});

document.getElementById('resetBackToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('page-login');
});


// ==============================
// 2. AUTH — přihlášení a registrace
// ==============================

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordOk = updatePasswordRules(password);
  if (!passwordOk) {
    document.getElementById('passwordRules').classList.remove('hidden');
    showToast('Heslo nesplňuje požadavky', 'error');
    return;
  }
  const result = await window.api.register({ email, password });
  if (result.success) {
    document.getElementById('confirm-email').textContent = email;
    showAuthPage('page-email-confirm');
  } else {
    showToast('Chyba registrace: ' + result.error, 'error');
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value.trim();
  const password = document.getElementById('loginPassword').value;
  const result = await window.api.login({ email, password });
  if (!result.success) {
    showToast('Chyba přihlášení: ' + result.error, 'error');
    return;
  }
  const session = result.data.session;
  const profile = await window.api.getProfile(session.user.id);
  if (!profile || !profile.username || profile.username.trim() === '') {
    showToast('Dokončete nastavení profilu', 'info');
    showAuthPage('page-onboarding');
    return;
  }
  showMainApp();
  updateSidebarProfile(profile, session);
  showPage('page-dnes', 'btn-dnes');
  setPageLoading(true);
  await loadEverything();
  await updateFilterCounts();
  setPageLoading(false);
  showToast('Přihlášení proběhlo úspěšně');
});

document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    const eyeOpen = button.querySelector('.eye-open');
    const eyeClosed = button.querySelector('.eye-closed');
    if (input.type === 'password') {
      input.type = 'text';
      eyeOpen.classList.add('hidden');
      eyeClosed.classList.remove('hidden');
    } else {
      input.type = 'password';
      eyeOpen.classList.remove('hidden');
      eyeClosed.classList.add('hidden');
    }
  });
});

document.getElementById('link-to-reg').addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('page-register');
});

document.getElementById('link-to-login').addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('page-login');
});

document.getElementById('backToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showAuthPage('page-login');
});

document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#loginForm input[type="email"]').value.trim();
  if (!email) {
    showToast('Zadejte svůj email', 'error');
    return;
  }
  const result = await window.api.resetPassword({ email });
  if (result.success) {
    showToast('Odkaz pro reset hesla byl odeslán na Váš email');
  } else {
    showToast('Nepodařilo se odeslat odkaz: ' + result.error, 'error');
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('page-login').classList.add('hidden');
  try {
    window.electronAuth.onAuthCallback(async (url) => {
      try {
        const hash = url.split('#')[1];
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        if (!access_token || !refresh_token) {
          showToast('Chyba přihlášení — token nenalezen', 'error');
          return;
        }

        const result = await window.api.setSession({ access_token, refresh_token });

        if (!result.success) {
          showToast('Chyba: ' + result.error, 'error');
          return;
        }

        if (type === 'recovery') {
          document.getElementById('mainApp').classList.add('hidden');
          document.getElementById('page-login').classList.add('hidden');
          document.getElementById('page-register').classList.add('hidden');
          document.getElementById('page-email-confirm').classList.add('hidden');
          document.getElementById('page-onboarding').classList.add('hidden');
          document.getElementById('page-reset-password').classList.remove('hidden');
        } else {
          const newSession = await window.api.getSession();
          await finishAuth(newSession);
          showToast('Email potvrzen a přihlášení proběhlo úspěšně');
        }
      } catch (err) {
        console.error(err);
        showToast('Neočekávaná chyba při přihlášení', 'error');
      }
    });

    const session = await window.api.getSession();

    if (session) {
      if (!session.user.email_confirmed_at) {
        showAuthPage('page-email-confirm');
        return;
      }
      const profile = await window.api.getProfile(session.user.id);
      if (!profile || !profile.username || profile.username.trim() === '') {
        showAuthPage('page-onboarding');
        return;
      }
      await finishAuth(session);
    } else {
      showAuthPage('page-login');
    }
  } catch (err) {
    console.error(err);
    showAuthPage('page-login');
  }
});

function validatePassword(password) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password)
  };
}

function updatePasswordRules(password) {
  const rules = validatePassword(password);
  document.getElementById('rule-length').classList.toggle('valid', rules.length);
  document.getElementById('rule-length').classList.toggle('invalid', !rules.length);
  document.getElementById('rule-number').classList.toggle('valid', rules.number);
  document.getElementById('rule-number').classList.toggle('invalid', !rules.number);
  document.getElementById('rule-special').classList.toggle('valid', rules.special);
  document.getElementById('rule-special').classList.toggle('invalid', !rules.special);
  return rules.length && rules.number && rules.special;
}

const registerPasswordInput = document.getElementById('registerPassword');
if (registerPasswordInput) {
  registerPasswordInput.addEventListener('input', (e) => {
    const rulesBox = document.getElementById('passwordRules');
    if (e.target.value.length > 0) {
      rulesBox.classList.remove('hidden');
    } else {
      rulesBox.classList.add('hidden');
    }
    updatePasswordRules(e.target.value);
  });
}


// ==============================
// 3. SIDEBAR — dropdown a nastavení
// ==============================

const userDropdownWrapper = document.querySelector('.user-dropdown-wrapper');
const userSection = document.querySelector('.user-section');
const dropdownContent = document.querySelector('.dropdown-content');

userSection.addEventListener('click', (event) => {
  event.stopPropagation();
  dropdownContent.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
  if (!userDropdownWrapper.contains(event.target)) {
    dropdownContent.classList.add('hidden');
  }
});

document.querySelector('.account-settings').addEventListener('click', async () => {
  closeTaskDetail();
  dropdownContent.classList.add('hidden');
  showPage('page-accountsettings', null);
  await loadAccountSettings();
});

document.querySelector('.log-out').addEventListener('click', async () => {
  await window.api.logout();
  dropdownContent.classList.add('hidden');
  showAuthPage('page-login');
});


// ==============================
// 4. DATUM — zobrazení dnešního data
// ==============================

const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

const now = new Date();
const dayName = days[now.getDay()];
const date = now.getDate();
const month = months[now.getMonth()];

document.getElementById('date-subtitle').textContent = `${dayName}, ${date}. ${month}`;


// ==============================
// 5. POPUPY — otevírání a zavírání
// ==============================

const overlayTaskCategory = document.getElementById('overlay-taskcategory');

document.getElementById('btn-create-taskcategory').addEventListener('click', () => {
  overlayTaskCategory.classList.remove('hidden');
});

document.getElementById('cancelCreating').addEventListener('click', () => {
  overlayTaskCategory.classList.add('hidden');
});

overlayTaskCategory.addEventListener('click', (event) => {
  if (event.target === overlayTaskCategory) overlayTaskCategory.classList.add('hidden');
});

document.querySelectorAll('#overlay-taskcategory .emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#overlay-taskcategory .emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

const overlayProjectCategory = document.getElementById('overlay-projectcategory');

document.getElementById('btn-create-projectcategory').addEventListener('click', () => {
  overlayProjectCategory.classList.remove('hidden');
});

document.getElementById('cancelCreatingProject').addEventListener('click', () => {
  overlayProjectCategory.classList.add('hidden');
});

overlayProjectCategory.addEventListener('click', (e) => {
  if (e.target === overlayProjectCategory) overlayProjectCategory.classList.add('hidden');
});

overlayProjectCategory.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    overlayProjectCategory.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

document.getElementById('createProjectCategory').addEventListener('click', async () => {
  const nameInput = overlayProjectCategory.querySelector('input[type="text"]');
  const name = nameInput.value.trim();
  const selectedEmoji = overlayProjectCategory.querySelector('.emoji-btn.selected');

  nameInput.classList.remove('input-error');
  overlayProjectCategory.querySelectorAll('.error-message').forEach(e => e.remove());

  let hasError = false;

  if (!name) {
    nameInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název kategorie je povinný';
    nameInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (!selectedEmoji) {
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Vyber emoji pro kategorii';
    overlayProjectCategory.querySelector('.emoji-picker').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const emoji = selectedEmoji.textContent;
  await window.api.addProjectCategory({ name, emoji });
  overlayProjectCategory.classList.add('hidden');
  nameInput.value = '';
  overlayProjectCategory.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  await loadProjectCategories();
  showToast('Kategorie projektu byla vytvořena');
});

const overlayNewTask = document.getElementById('overlay-newukol');

document.querySelectorAll('.add-task-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const activePage = document.querySelector('.page:not(.hidden)');
    if (activePage.id === 'page-projekt-detail') {
      overlayNewTask.dataset.projectId = currentProjectId;
    } else {
      delete overlayNewTask.dataset.projectId;
    }
    const wrapper = document.getElementById('categoryTaskWrapper');
    if (activePage.id === 'page-projekt-detail') {
      wrapper.classList.add('hidden');
    } else {
      wrapper.classList.remove('hidden');
    }
    overlayNewTask.classList.remove('hidden');
    await loadCategoriesIntoDropdown();
    const select = document.getElementById('categoryTask');
    if (activePage.id !== 'page-projekt-detail' && currentCategoryId) {
      select.value = currentCategoryId;
    }
  });
});

document.getElementById('cancelNewTask').addEventListener('click', () => {
  overlayNewTask.classList.add('hidden');
});

overlayNewTask.addEventListener('click', (event) => {
  if (event.target === overlayNewTask) overlayNewTask.classList.add('hidden');
});

const overlayNewProject = document.getElementById('overlay-newproject');

document.getElementById('cancelNewProject').addEventListener('click', () => {
  overlayNewProject.classList.add('hidden');
  document.getElementById('newProjectTitle').value = '';
  document.getElementById('newProjectDescription').value = '';
  document.getElementById('newProjectDate').value = '';
});

overlayNewProject.addEventListener('click', (event) => {
  if (event.target === overlayNewProject) overlayNewProject.classList.add('hidden');
});


// ==============================
// 6. ÚKOLY — vytváření, načítání, mazání
// ==============================

let currentCategoryId = null;
let currentCategoryName = null;
let currentCategoryEmoji = null;

function sortTasksByImportance(tasks) {
  return [...tasks].sort((a, b) => (b.is_important || 0) - (a.is_important || 0));
}

async function updateFilterCounts() {
  const activePage = document.querySelector('.page:not(.hidden)');
  if (!activePage) return;
  const filterBtns = activePage.querySelectorAll('.filter-btn');
  if (filterBtns.length < 2) return;

  let tasks;
  if (activePage.id === 'page-dnes') {
    const today = new Date().toISOString().split('T')[0];
    tasks = await window.api.getTasksByDate(today);
  } else if (currentCategoryId) {
    tasks = await window.api.getTasksByCategory(currentCategoryId);
  } else {
    tasks = await window.api.getAllTasks();
  }

  const activeCount = tasks.filter(t => t.status === 0).length;
  const doneCount = tasks.filter(t => t.status === 1).length;
  filterBtns[0].textContent = `Aktivní (${activeCount})`;
  filterBtns[1].textContent = `Dokončené (${doneCount})`;
}

function formatDateTime(date, time) {
  if (!date) return 'Bez termínu';
  const [year, month, day] = date.split('-');
  const datePart = `${day}.${month}.`;
  if (!time) return datePart;
  const timePart = time.slice(0, 5);
  return `${datePart} ${timePart}`;
}

async function refreshCurrentView() {
  const activePage = document.querySelector('.page:not(.hidden)');
  if (!activePage) return;

  const activeFilter = activePage.querySelector('.filter-btn.active');
  const showingCompleted = activeFilter && activeFilter.textContent.includes('Dokončené');

  if (activePage.id === 'page-dnes') {
    if (activeFilter && activeFilter.textContent.includes('Dokončené')) {
      await showCompletedTasks();
    } else {
      await loadTasks();
    }
    await updateFilterCounts();
    return;
  }

  if (activePage.id === 'page-projekt-detail') {
    await loadProjectTasks(currentProjectId);
    const tasks = await window.api.getTasksByProject(currentProjectId);
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 1).length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    document.getElementById('projectProgressFill').style.width = `${progress}%`;
    document.getElementById('projectProgressLabel').textContent = `${progress}% dokončeno (${doneTasks}/${totalTasks} úkolů)`;
    return;
  }

  const taskList = activePage.querySelector('.task-list');
  if (!taskList) return;

  let tasks;
  if (currentCategoryId) {
    tasks = await window.api.getTasksByCategory(currentCategoryId);
    document.querySelector('#page-vsechny-ukoly .page-title').textContent = `${currentCategoryEmoji} ${currentCategoryName}`;
  } else {
    tasks = await window.api.getAllTasks();
  }

  const filtered = sortTasksByImportance(
    tasks.filter(task => showingCompleted ? task.status === 1 : task.status === 0)
  );

  if (filtered.length === 0) {
    taskList.innerHTML = `<div class="empty-state"><p>${showingCompleted ? 'Žádné dokončené úkoly.' : 'Žádné aktivní úkoly.'}</p></div>`;
  } else {
    const standaloneFiltered = filtered.filter(t => !t.project_id);
    const inProjectFiltered = filtered.filter(t => t.project_id);
    taskList.innerHTML = '';
    standaloneFiltered.forEach(task => taskList.appendChild(createTaskElement(task)));
    if (inProjectFiltered.length > 0) {
      const divider = document.createElement('div');
      divider.className = 'task-section-divider';
      divider.innerHTML = `<span class="task-section-divider-label"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Úkoly v rámci projektů</span>`;
      taskList.appendChild(divider);
      inProjectFiltered.forEach(task => taskList.appendChild(createTaskElement(task)));
    }
  }

  await updateFilterCounts();
}

function createTaskElement(task) {
  const div = document.createElement('div');
  div.className = 'task-item';
  div.dataset.id = task.id;

  div.innerHTML = `
    <div class="task-checkbox ${task.status === 1 ? 'completed' : ''}"></div>
    <div class="task-body">
      <p class="task-title ${task.status === 1 ? 'completed' : ''}">${task.title}</p>
      <p class="task-description ${!task.description ? 'no-value' : ''}">${task.description || 'Bez popisku'}</p>
      <div class="task-meta">
        <span class="task-category">
          <span class="task-category-emoji">${task.category_emoji || ''}</span>
          ${task.category_name || 'Bez kategorie'}
        </span>
        <span class="task-date ${!task.due_date ? 'no-value' : ''} ${task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status === 0 ? 'overdue' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          ${task.due_date ? formatDateTime(task.due_date, task.due_time) : 'Bez termínu'}
        </span>
      </div>
      ${task.assignees && task.assignees.length > 0 ? `
        <div class="task-assignees-preview">
          ${task.assignees.map((assignee, index) => `
            <div class="task-assignee-chip">
              <div class="task-assignee-avatar" style="background:${getMemberColor(index)}">
                ${getInitials(assignee.username)}
              </div>
              <span class="task-assignee-name">${assignee.username}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="task-actions">
      <button class="task-btn star ${task.is_important ? 'active' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${task.is_important ? '#f0c040' : 'none'}" stroke="#f0c040" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
      <button class="task-btn delete" ${currentUserRole === 'member' ? 'style="display:none"' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `;

  div.querySelector('.task-checkbox').addEventListener('click', async (e) => {
    e.stopPropagation();
    const newStatus = task.status === 1 ? 0 : 1;
    await window.api.markComplete({ id: task.id, status: newStatus });
    await refreshCurrentView();
  });

  div.querySelector('.task-btn.star').addEventListener('click', async (e) => {
    e.stopPropagation();
    const newImportant = !task.is_important;
    await window.api.markImportant({ id: task.id, is_important: newImportant });
    task.is_important = newImportant;
    showToast(newImportant ? 'Úkol byl označen jako důležitý' : 'Úkol byl odebrán z důležitých', 'info');
    await refreshCurrentView();
  });

  div.querySelector('.task-btn.delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await showConfirm('Smazat úkol?', 'Tato akce je nevratná.');
    if (!ok) return;
    await window.api.deleteTask(task.id);
    showToast('Úkol byl smazán');
    closeTaskDetail();
    await refreshCurrentView();
  });

  div.addEventListener('click', (e) => {
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-btn')) return;
    openTaskDetail(task);
  });

  return div;
}

async function loadTasks() {
  const today = new Date().toISOString().split('T')[0];
  const tasks = await window.api.getTasksByDate(today);
  const taskList = document.getElementById('taskList');
  if (!taskList) return;

  const activeFilter = document.querySelector('#page-dnes .filter-btn.active');
  const showingCompleted = activeFilter && activeFilter.textContent.includes('Dokončené');

  const filtered = sortTasksByImportance(
    tasks.filter(task => showingCompleted ? task.status === 1 : task.status === 0)
  );

  if (filtered.length === 0) {
    taskList.innerHTML = `<div class="empty-state"><p>${showingCompleted ? 'Žádné dokončené úkoly pro dnešní den.' : 'Zatím žádné úkoly pro dnešní den. Vytvořte si je!'}</p></div>`;
  } else {
    taskList.innerHTML = '';
    filtered.forEach(task => taskList.appendChild(createTaskElement(task)));
  }

  await updateFilterCounts();
}

async function loadAllTasks() {
  const tasks = await window.api.getAllTasks();
  const taskList = document.querySelector('#page-vsechny-ukoly .task-list');
  if (!taskList) return;
  if (tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Zatím žádné úkoly. Vytvořte svůj první úkol!</p></div>';
  } else {
    taskList.innerHTML = '';
    sortTasksByImportance(tasks).forEach(task => taskList.appendChild(createTaskElement(task)));
  }
  await updateFilterCounts();
}

function showConfirm(title, subtitle) {
  return new Promise((resolve) => {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmSubtitle').textContent = subtitle;
    document.getElementById('overlay-confirm').classList.remove('hidden');

    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');

    const cleanup = () => {
      document.getElementById('overlay-confirm').classList.add('hidden');
      ok.replaceWith(ok.cloneNode(true));
      cancel.replaceWith(cancel.cloneNode(true));
    };

    document.getElementById('confirmOk').addEventListener('click', () => {
      cleanup();
      resolve(true);
    }, { once: true });

    document.getElementById('confirmCancel').addEventListener('click', () => {
      cleanup();
      resolve(false);
    }, { once: true });
  });
}

async function showActiveTasks() {
  const activePage = document.querySelector('.page:not(.hidden)');
  const taskList = activePage.querySelector('.task-list');
  if (!taskList) return;

  let tasks;
  if (activePage.id === 'page-dnes') {
    const today = new Date().toISOString().split('T')[0];
    tasks = await window.api.getTasksByDate(today);
  } else if (currentCategoryId) {
    tasks = await window.api.getTasksByCategory(currentCategoryId);
    document.querySelector('#page-vsechny-ukoly .page-title').textContent = `${currentCategoryEmoji} ${currentCategoryName}`;
  } else {
    tasks = await window.api.getAllTasks();
  }

  const activeTasks = sortTasksByImportance(tasks.filter(task => task.status === 0));

  if (activeTasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Žádné aktivní úkoly.</p></div>';
  } else {
    const standaloneActive = activeTasks.filter(t => !t.project_id);
    const inProjectActive = activeTasks.filter(t => t.project_id);
    taskList.innerHTML = '';
    standaloneActive.forEach(task => taskList.appendChild(createTaskElement(task)));
    if (inProjectActive.length > 0) {
      const divider = document.createElement('div');
      divider.className = 'task-section-divider';
      divider.innerHTML = `<span class="task-section-divider-label"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Úkoly v projektech</span>`;
      taskList.appendChild(divider);
      inProjectActive.forEach(task => taskList.appendChild(createTaskElement(task)));
    }
  }
}

async function showCompletedTasks() {
  const activePage = document.querySelector('.page:not(.hidden)');
  const taskList = activePage.querySelector('.task-list');
  if (!taskList) return;

  let tasks;
  if (activePage.id === 'page-dnes') {
    const today = new Date().toISOString().split('T')[0];
    tasks = await window.api.getTasksByDate(today);
  } else if (currentCategoryId) {
    tasks = await window.api.getTasksByCategory(currentCategoryId);
    document.querySelector('#page-vsechny-ukoly .page-title').textContent = `${currentCategoryEmoji} ${currentCategoryName}`;
  } else {
    tasks = await window.api.getAllTasks();
  }

  const completedTasks = sortTasksByImportance(tasks.filter(task => task.status === 1));

  if (completedTasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Žádné dokončené úkoly.</p></div>';
  } else {
    const standaloneCompleted = completedTasks.filter(t => !t.project_id);
    const inProjectCompleted = completedTasks.filter(t => t.project_id);
    taskList.innerHTML = '';
    standaloneCompleted.forEach(task => taskList.appendChild(createTaskElement(task)));
    if (inProjectCompleted.length > 0) {
      const divider = document.createElement('div');
      divider.className = 'task-section-divider';
      divider.innerHTML = `<span class="task-section-divider-label"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Úkoly v projektech</span>`;
      taskList.appendChild(divider);
      inProjectCompleted.forEach(task => taskList.appendChild(createTaskElement(task)));
    }
  }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const activePage = document.querySelector('.page:not(.hidden)');
    activePage.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.textContent.includes('Aktivní')) {
      showActiveTasks().then(() => updateFilterCounts());
    } else {
      showCompletedTasks().then(() => updateFilterCounts());
    }
  });
});

document.getElementById('createTask').addEventListener('click', async () => {
  const titleInput = document.querySelector('#overlay-newukol input[type="text"]');
  const dateInput = document.getElementById('date');
  const title = titleInput.value.trim();
  const due_date = dateInput.value;
  const due_time = document.getElementById('taskTime').value || null;

  titleInput.classList.remove('input-error');
  dateInput.classList.remove('input-error');
  document.querySelectorAll('#overlay-newukol .error-message').forEach(e => e.remove());

  let hasError = false;

  if (!title) {
    titleInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název úkolu je povinný';
    titleInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (!due_date) {
    dateInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Termín dokončení je povinný';
    document.querySelector('#overlay-newukol .date-time-row').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const description = document.querySelector('#overlay-newukol textarea').value.trim();
  const category_id = document.getElementById('categoryTask').value || null;
  const project_id = overlayNewTask.dataset.projectId || null;

  const createdTask = await window.api.addTask({ title, description, due_date, due_time, category_id, project_id });

  if (!createdTask) {
    showToast('Úkol se nepodařilo vytvořit', 'error');
    return;
  }

  overlayNewTask.classList.add('hidden');
  titleInput.value = '';
  document.querySelector('#overlay-newukol textarea').value = '';
  dateInput.value = '';
  document.getElementById('categoryTask').value = '';
  delete overlayNewTask.dataset.projectId;

  await refreshCurrentView();
  showToast('Úkol byl vytvořen');
});


// ==============================
// 7. KATEGORIE ÚKOLŮ — vytváření, načítání, zobrazení
// ==============================

async function loadTaskCategories() {
  const categories = await window.api.getAllTaskCategories();
  const createBtn = document.getElementById('btn-create-taskcategory');
  document.querySelectorAll('.sidebar-category-task').forEach(el => el.remove());

  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn sidebar-category-task';
    btn.innerHTML = `
      <span>${category.emoji}</span> ${category.name}
      <div class="category-actions">
        <button class="category-edit-btn" title="Upravit kategorii">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="category-delete-btn" title="Smazat kategorii">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      if (e.target.closest('.category-delete-btn') || e.target.closest('.category-edit-btn')) return;
      closeTaskDetail();
      document.querySelectorAll('.sidebar-category-task').forEach(b => b.classList.remove('active'));
      showPage('page-vsechny-ukoly', null);
      btn.classList.add('active');
      loadTasksByCategory(category.id, category.name, category.emoji);
    });

    btn.querySelector('.category-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditCategoryOverlay(category, 'task');
    });

    btn.querySelector('.category-delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await showConfirm('Smazat kategorii?', 'Úkoly v této kategorii zůstanou, ale ztratí kategorii.');
      if (!ok) return;
      await window.api.deleteTaskCategory(category.id);
      if (currentCategoryId === category.id) {
        currentCategoryId = null;
        currentCategoryName = null;
        currentCategoryEmoji = null;
        showPage('page-vsechny-ukoly', 'btn-vsechnyukoly');
        document.querySelector('#page-vsechny-ukoly .page-title').textContent = 'Všechny úkoly';
        await loadAllTasks();
      }
      await loadTaskCategories();
      showToast('Kategorie byla smazána');
    });

    createBtn.parentNode.insertBefore(btn, createBtn);
  });
}

async function loadProjectCategories() {
  const categories = await window.api.getAllProjectCategories();
  const createBtn = document.getElementById('btn-create-projectcategory');
  document.querySelectorAll('.sidebar-category-project').forEach(el => el.remove());

  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn sidebar-category-project';
    btn.innerHTML = `
      <span>${category.emoji}</span> ${category.name}
      <div class="category-actions">
        <button class="category-edit-btn" title="Upravit kategorii">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="category-delete-btn" title="Smazat kategorii">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `;

    btn.addEventListener('click', async (e) => {
      if (e.target.closest('.category-delete-btn') || e.target.closest('.category-edit-btn')) return;
      closeTaskDetail();
      document.querySelectorAll('.sidebar-category-project').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await loadProjectsByCategory(category.id, category.name, category.emoji);
    });

    btn.querySelector('.category-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditCategoryOverlay(category, 'project');
    });

    btn.querySelector('.category-delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await showConfirm('Smazat kategorii?', 'Projekty v této kategorii zůstanou, ale ztratí kategorii.');
      if (!ok) return;
      await window.api.deleteProjectCategory(category.id);
      await loadProjectCategories();
      showToast('Kategorie byla smazána');
    });

    createBtn.parentNode.insertBefore(btn, createBtn);
  });
}

function openEditCategoryOverlay(category, type) {
  const overlay = document.getElementById('overlay-editcategory');
  const nameInput = document.getElementById('editCategoryName');
  const title = document.getElementById('editCategoryTitle');
  title.textContent = type === 'task' ? 'Upravit kategorii úkolů' : 'Upravit kategorii projektů';
  nameInput.value = category.name;
  overlay.dataset.categoryId = category.id;
  overlay.dataset.categoryType = type;
  overlay.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent.trim() === category.emoji.trim());
  });
  overlay.classList.remove('hidden');
}

async function loadProjectsByCategory(category_id, name, emoji) {
  currentProjectCategoryId = category_id;
  currentProjectCategoryName = name;
  currentProjectCategoryEmoji = emoji;
  setPageLoading(true);

  const projects = await window.api.getProjectsByCategory(category_id);
  const projectList = document.getElementById('projectList');

  if (!projectList) {
    setPageLoading(false);
    return;
  }

  showPage('page-projekty', null);
  document.querySelector('#page-projekty .page-title').textContent = `${emoji} ${name}`;
  document.querySelector('#page-projekty .page-subtitle').textContent = 'Projekty v této kategorii';

  if (!projects || projects.length === 0) {
    projectList.innerHTML = '<div class="empty-state"><p>Žádné projekty v této kategorii.</p></div>';
    setPageLoading(false);
    return;
  }

  const cardsData = await Promise.all(
    projects.map(async (project) => {
      const [members, tasks] = await Promise.all([
        window.api.getProjectMembers(project.id),
        window.api.getTasksByProject(project.id)
      ]);
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter(t => t.status === 1).length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      return { project, members, progress, totalTasks };
    })
  );

  projectList.innerHTML = '';
  cardsData.forEach(({ project, members, progress, totalTasks }) => {
    projectList.appendChild(createProjectCard(project, members, progress, totalTasks));
  });

  setPageLoading(false);
}

async function loadTasksByCategory(category_id, name, emoji) {
  currentCategoryId = category_id;
  currentCategoryName = name;
  currentCategoryEmoji = emoji;

  const tasks = await window.api.getTasksByCategory(category_id);
  const taskList = document.querySelector('#page-vsechny-ukoly .task-list');

  document.querySelector('#page-vsechny-ukoly .page-title').textContent = `${emoji} ${name}`;
  document.querySelectorAll('#page-vsechny-ukoly .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-vsechny-ukoly .filter-btn').classList.add('active');

  const activeTasks = sortTasksByImportance(tasks.filter(task => task.status === 0));

  if (activeTasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Žádné úkoly v této kategorii.</p></div>';
  } else {
    taskList.innerHTML = '';
    activeTasks.forEach(task => taskList.appendChild(createTaskElement(task)));
  }

  await updateFilterCounts();
}

async function loadCategoriesIntoDropdown() {
  const categories = await window.api.getAllTaskCategories();
  const select = document.getElementById('categoryTask');
  select.innerHTML = '<option value="">Bez kategorie</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.emoji} ${category.name}`;
    select.appendChild(option);
  });
}

document.getElementById('createCategory').addEventListener('click', async () => {
  const nameInput = document.querySelector('#overlay-taskcategory .popup input[type="text"]');
  const name = nameInput.value.trim();
  const selectedEmoji = document.querySelector('#overlay-taskcategory .emoji-btn.selected');

  nameInput.classList.remove('input-error');
  document.querySelectorAll('#overlay-taskcategory .popup .error-message').forEach(e => e.remove());

  let hasError = false;

  if (!name) {
    nameInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název kategorie je povinný';
    nameInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (!selectedEmoji) {
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Vyber emoji pro kategorii';
    document.querySelector('#overlay-taskcategory .emoji-picker').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const emoji = selectedEmoji.textContent;
  await window.api.addTaskCategory({ name, emoji });
  overlayTaskCategory.classList.add('hidden');
  nameInput.value = '';
  document.querySelectorAll('#overlay-taskcategory .emoji-btn').forEach(b => b.classList.remove('selected'));
  await loadTaskCategories();
  showToast('Kategorie byla vytvořena');
});


// ==============================
// 8. TOAST — notifikace
// ==============================

let toastTimeout;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  toastMsg.textContent = message;
  toast.classList.remove('toast-success', 'toast-error', 'toast-info');
  toast.classList.add(`toast-${type}`);

  if (type === 'error') {
    toastIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
  } else if (type === 'info') {
    toastIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `;
  } else {
    toastIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
  }

  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}


// ==============================
// 9. DETAIL PANEL — zobrazení a editace úkolu
// ==============================

let currentTaskId = null;
let currentTaskProjectMembers = [];

async function renderTaskAssignees(task) {
  const section = document.getElementById('taskAssigneesSection');
  const list = document.getElementById('detailAssigneesList');
  if (!section || !list) return;

  list.innerHTML = '';
  currentTaskProjectMembers = [];

  if (!task.project_id) {
    section.classList.add('hidden');
    return;
  }

  const members = await window.api.getProjectMembers(task.project_id);
  const assignees = await window.api.getTaskAssignees(task.id);

  currentTaskProjectMembers = members || [];
  const assignedUserIds = new Set((assignees || []).map(a => a.user_id));

  if (!members || members.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  members.forEach((member, index) => {
    const row = document.createElement('label');
    row.className = 'detail-assignee-item';
    row.innerHTML = `
      <input type="checkbox" value="${member.user_id}" ${assignedUserIds.has(member.user_id) ? 'checked' : ''} />
      <div class="detail-assignee-avatar ${member.avatar_url ? 'has-image' : ''}"
        style="${member.avatar_url
          ? `background-image:url('${member.avatar_url}');background-size:cover;background-position:center;`
          : `background:${getMemberColor(index)};`}">
        ${member.avatar_url ? '' : getInitials(member.username)}
      </div>
      <span class="detail-assignee-name">${member.username}</span>
    `;
    list.appendChild(row);
  });
}

async function openTaskDetail(task) {
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('active-detail'));
  document.querySelector(`.task-item[data-id="${task.id}"]`)?.classList.add('active-detail');

  currentTaskId = task.id;
  document.getElementById('detailTitle').textContent = task.title || '';
  document.getElementById('detailTitleInput').value = task.title || '';
  document.getElementById('detailDescription').value = task.description || '';
  document.getElementById('detailDueDate').value = task.due_date || '';
  document.getElementById('detailDueTime').value = task.due_time || '';

  const categories = await window.api.getAllTaskCategories();
  const select = document.getElementById('detailCategory');
  select.innerHTML = '<option value="">Bez kategorie</option>';

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.emoji} ${category.name}`;
    if (category.id === task.category_id) option.selected = true;
    select.appendChild(option);
  });

  await renderTaskAssignees(task);
  document.getElementById('taskDetailPanel').classList.add('panel-open');
  document.querySelector('.content').classList.add('panel-active');
}

function closeTaskDetail() {
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('active-detail'));
  document.getElementById('taskDetailPanel').classList.remove('panel-open');
  document.querySelector('.content').classList.remove('panel-active');
  currentTaskId = null;
}

document.getElementById('closeDetailPanel').addEventListener('click', () => closeTaskDetail());

document.getElementById('saveDetailChanges').addEventListener('click', async () => {
  if (!currentTaskId) return;

  const titleInput = document.getElementById('detailTitleInput');
  const dateInput = document.getElementById('detailDueDate');
  const title = titleInput.value.trim();
  const due_date = dateInput.value;
  const due_time = document.getElementById('detailDueTime').value || null;

  titleInput.classList.remove('input-error');
  dateInput.classList.remove('input-error');
  document.querySelectorAll('.task-detail-body .error-message').forEach(e => e.remove());

  let hasError = false;

  if (!title) {
    titleInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název úkolu je povinný';
    titleInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (!due_date) {
    dateInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Termín dokončení je povinný';
    dateInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const description = document.getElementById('detailDescription').value.trim();
  const category_id = document.getElementById('detailCategory').value || null;

  await window.api.updateTask({ id: currentTaskId, title, description, due_date, due_time, category_id });

  const assigneeCheckboxes = document.querySelectorAll('#detailAssigneesList input[type="checkbox"]:checked');
  const selectedUserIds = Array.from(assigneeCheckboxes).map(cb => cb.value);

  const assigneeResult = await window.api.updateTaskAssignees({
    taskId: currentTaskId,
    userIds: selectedUserIds
  });

  if (!assigneeResult?.success) {
    closeTaskDetail();
    await refreshCurrentView();
    showToast('Úkol byl upraven, ale nepodařilo se uložit přiřazení členů', 'error');
    return;
  }

  closeTaskDetail();
  await refreshCurrentView();
  showToast('Úkol byl upraven');
});


// ==============================
// NASTAVENÍ ÚČTU — profil a heslo
// ==============================

document.getElementById('saveProfileChanges').addEventListener('click', async () => {
  const session = await window.api.getSession();
  if (!session) return;

  const username = document.getElementById('settingsUsername').value.trim();
  if (!username) {
    showToast('Uživatelské jméno je povinné', 'error');
    return;
  }

  const currentProfile = await window.api.getProfile(session.user.id);

  const result = await window.api.updateProfile({
    userId: session.user.id,
    username,
    avatarUrl: currentProfile?.avatar_url || null
  });

  if (!result.success) {
    showToast('Nepodařilo se uložit změny', 'error');
    return;
  }

  document.getElementById('userName').textContent = username;
  document.getElementById('profileIcon').textContent = username[0].toUpperCase();
  await loadAccountSettings();
  showToast('Profil byl upraven');
});

document.getElementById('savePasswordChanges')?.addEventListener('click', async () => {
  const newPassword = document.getElementById('settingsNewPassword').value;
  const confirmPassword = document.getElementById('settingsConfirmPassword').value;

  if (!newPassword || !confirmPassword) {
    showToast('Vyplňte obě pole hesla', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Hesla se neshodují', 'error');
    return;
  }

  const passwordOk = validatePassword(newPassword);
  if (!(passwordOk.length && passwordOk.special && passwordOk.number)) {
    showToast('Nové heslo nesplňuje požadavky', 'error');
    return;
  }

  const result = await window.api.updatePassword({ password: newPassword });

  if (!result.success) {
    showToast('Nepodařilo se změnit heslo', 'error');
    return;
  }

  document.getElementById('settingsNewPassword').value = '';
  document.getElementById('settingsConfirmPassword').value = '';
  document.getElementById('settingsPasswordRules').classList.add('hidden');
  showToast('Heslo bylo změněno');
});

document.getElementById('settingsNewPassword')?.addEventListener('input', (e) => {
  const rules = validatePassword(e.target.value);
  const box = document.getElementById('settingsPasswordRules');
  if (e.target.value.length > 0) box.classList.remove('hidden');
  else box.classList.add('hidden');
  document.getElementById('settings-rule-length').className = `password-rule ${rules.length ? 'valid' : 'invalid'}`;
  document.getElementById('settings-rule-number').className = `password-rule ${rules.number ? 'valid' : 'invalid'}`;
  document.getElementById('settings-rule-special').className = `password-rule ${rules.special ? 'valid' : 'invalid'}`;
});

document.getElementById('submitResetPassword').addEventListener('click', async () => {
  const newPassword = document.getElementById('resetNewPassword').value;
  const confirmPassword = document.getElementById('resetConfirmPassword').value;

  if (!newPassword || !confirmPassword) {
    showToast('Vyplň obě pole', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Hesla se neshodují', 'error');
    return;
  }

  const passwordOk = validatePassword(newPassword);
  if (!(passwordOk.length && passwordOk.special && passwordOk.number)) {
    showToast('Heslo nesplňuje požadavky', 'error');
    return;
  }

  const result = await window.api.updatePassword({ password: newPassword });

  if (!result.success) {
    showToast('Nepodařilo se změnit heslo: ' + result.error, 'error');
    return;
  }

  const session = await window.api.getSession();
  await finishAuth(session);
  document.getElementById('page-reset-password').classList.add('hidden');
  showToast('Heslo bylo úspěšně změněno');
  });

document.getElementById('resetNewPassword').addEventListener('input', (e) => {
  const rules = validatePassword(e.target.value);
  const box = document.getElementById('resetPasswordRules');
  if (e.target.value.length > 0) {
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
  document.getElementById('reset-rule-length').className = `password-rule ${rules.length ? 'valid' : 'invalid'}`;
  document.getElementById('reset-rule-number').className = `password-rule ${rules.number ? 'valid' : 'invalid'}`;
  document.getElementById('reset-rule-special').className = `password-rule ${rules.special ? 'valid' : 'invalid'}`;
});

function updateSidebarProfile(profile, session) {
  const userNameEl = document.getElementById('userName');
  const profileIconEl = document.getElementById('profileIcon');
  userNameEl.textContent = profile?.username || session.user.email;
  if (profile?.avatar_url) {
    profileIconEl.textContent = '';
    profileIconEl.style.backgroundImage = `url("${profile.avatar_url}")`;
    profileIconEl.style.backgroundColor = 'transparent';
    profileIconEl.classList.add('has-avatar');
  } else {
    profileIconEl.style.backgroundImage = 'none';
    profileIconEl.style.backgroundColor = '#0064B3';
    profileIconEl.classList.remove('has-avatar');
    profileIconEl.textContent = (profile?.username?.[0] || session.user.email?.[0] || 'U').toUpperCase();
  }
}


// ==============================
// 10. PROJEKTY — vytváření, načítání, detail
// ==============================

let currentProjectId = null;
let currentProjectRequestToken = 0;
let currentProjectCategoryId = null;
let currentProjectCategoryName = null;
let currentProjectCategoryEmoji = null;
let currentUserRole = null;

const memberColors = ['#0064B3', '#E74C3C', '#27AE60', '#8E44AD', '#F39C12', '#16A085', '#D35400', '#2C3E50'];

function getMemberColor(index) {
  return memberColors[index % memberColors.length];
}

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

async function loadProjects() {
  const projects = await window.api.getAllProjects();
  const projectList = document.getElementById('projectList');
  if (!projectList) return;

  if (projects.length === 0) {
    projectList.innerHTML = '<div class="empty-state"><p>Zatím žádné projekty. Vytvořte svůj první projekt!</p></div>';
    return;
  }

  const cardsData = await Promise.all(
    projects.map(async (project) => {
      const [members, tasks] = await Promise.all([
        window.api.getProjectMembers(project.id),
        window.api.getTasksByProject(project.id)
      ]);
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter(t => t.status === 1).length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      return { project, members, progress, totalTasks };
    })
  );

  projectList.innerHTML = '';
  cardsData.forEach(({ project, members, progress, totalTasks }) => {
    projectList.appendChild(createProjectCard(project, members, progress, totalTasks));
  });
}

function createProjectCard(project, members, progress, totalTasks) {
  const div = document.createElement('div');
  div.className = 'project-card';
  div.dataset.id = project.id;

  const membersHtml = members.slice(0, 4).map((m, i) =>
    m.avatar_url
      ? `<div class="member-avatar-small" style="background-image:url('${m.avatar_url}');background-size:cover;background-position:center;" title="${m.username}"></div>`
      : `<div class="member-avatar-small" style="background:${getMemberColor(i)}" title="${m.username}">${getInitials(m.username)}</div>`
  ).join('');
  const extraMembers = members.length > 4 ? `<div class="member-avatar-small extra">+${members.length - 4}</div>` : '';

  div.innerHTML = `
    <div class="project-card-top">
      <div class="project-card-info">
        <span class="project-card-category ${!project.category_emoji ? 'no-category' : ''}">
          ${project.category_emoji ? `${project.category_emoji} ${project.category_name}` : 'Bez kategorie'}
        </span>
        <h3 class="project-card-title">${project.title}</h3>
        <p class="project-card-description ${!project.description ? 'no-value' : ''}">
          ${project.description || 'Bez popisku'}
        </p>
      </div>
      <div class="project-card-actions">
        <button class="project-card-btn delete-project-card" title="Smazat">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="project-card-meta">
      <div class="project-card-members">
        ${membersHtml}${extraMembers}
        ${members.length > 0
          ? `<span class="project-members-count">${members.length} člen${members.length > 1 ? (members.length < 5 ? 'i' : 'ů') : ''}</span>`
          : '<span class="project-members-count">Žádní členové</span>'}
      </div>
      ${project.due_date ? `
        <div class="project-card-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${formatDateTime(project.due_date, project.due_time)}</span>
        </div>`
      : `<span class="project-card-no-date">Bez termínu</span>`}
    </div>
    <div class="project-card-progress">
      <div class="project-progress-bar">
        <div class="project-progress-fill" style="width:${progress}%"></div>
      </div>
      <span class="project-progress-label">
        ${totalTasks === 0 ? 'Žádné úkoly' : `${progress}% dokončeno`}
      </span>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (e.target.closest('.project-card-btn')) return;
    openProjectDetail(project.id);
  });

  div.querySelector('.delete-project-card').addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await showConfirm('Smazat projekt?', 'Smažou se i všechny úkoly a přílohy projektu.');
    if (!ok) return;
    await window.api.deleteProject(project.id);
    showToast('Projekt byl smazán');
    await loadProjects();
  });

  return div;
}

function clearProjectDetail() {
  document.getElementById('projectJoinCode').textContent = '';
  document.getElementById('projectDetailTitle').textContent = '';
  document.getElementById('projectDetailDescription').textContent = '';
  document.getElementById('projectDetailCategory').textContent = '';
  document.getElementById('projectDetailDate').innerHTML = '';
  document.getElementById('projectDetailMembers').innerHTML = '';
  document.getElementById('projectTaskList').innerHTML = '<div class="empty-state"><p>Načítání projektu...</p></div>';
  document.getElementById('projectProgressFill').style.width = '0%';
  document.getElementById('projectProgressLabel').textContent = 'Načítání...';
}

function setProjectDetailLoading(isLoading) {
  const page = document.getElementById('page-projekt-detail');
  if (!page) return;
  page.style.visibility = isLoading ? 'hidden' : 'visible';
}

async function openProjectDetail(projectId) {
  currentProjectId = projectId;
  const requestToken = ++currentProjectRequestToken;

  setProjectDetailLoading(true);
  clearProjectDetail();
  showPage('page-projekt-detail', null);

  const [project, members, tasks, role] = await Promise.all([
    window.api.getProjectById(projectId),
    window.api.getProjectMembers(projectId),
    window.api.getTasksByProject(projectId),
    window.api.getCurrentUserRole(projectId)
  ]);

  currentUserRole = role;
  const isOwner = currentUserRole === 'owner';

  document.getElementById('editProjectBtn').style.display = isOwner ? '' : 'none';
  document.getElementById('deleteProjectBtn').style.display = isOwner ? '' : 'none';
  document.getElementById('addAttachmentBtn').style.display = '';

  const leaveBtn = document.getElementById('leaveProjectBtn');
  if (leaveBtn) leaveBtn.style.display = isOwner ? 'none' : '';

  if (requestToken !== currentProjectRequestToken) return;

  if (!project) {
    showToast('Projekt se nepodařilo načíst', 'error');
    showPage('page-projekty', 'btn-vsechny-projekty');
    setProjectDetailLoading(false);
    return;
  }

  document.getElementById('projectJoinCode').textContent = project.join_code || '';

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 1).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  document.getElementById('projectDetailTitle').textContent = project.title;
  document.getElementById('projectDetailDescription').textContent = project.description || '';

  const categoryEl = document.getElementById('projectDetailCategory');
  categoryEl.textContent = project.category_emoji
    ? `${project.category_emoji} ${project.category_name}`
    : '';

  const dateEl = document.getElementById('projectDetailDate');
  dateEl.innerHTML = project.due_date ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
    <span style="color:#C0392B;font-family:'InterSemiBold';font-size:13px">${formatDateTime(project.due_date, project.due_time)}</span>
  ` : '';

  document.getElementById('projectProgressFill').style.width = `${progress}%`;
  document.getElementById('projectProgressLabel').textContent =
    `${progress}% dokončeno (${doneTasks}/${totalTasks} úkolů)`;

  const membersEl = document.getElementById('projectDetailMembers');
  if (members.length === 0) {
    membersEl.innerHTML = '<span style="font-family:\'InterRegular\';font-size:13px;color:#aaa;">Žádní členové týmu</span>';
  } else {
    membersEl.innerHTML = members.map((m, i) => `
      <div class="project-member-chip">
        <div class="project-member-chip-avatar ${m.avatar_url ? 'has-image' : ''}"
          style="${m.avatar_url
            ? `background-image:url('${m.avatar_url}');background-size:cover;background-position:center;`
            : `background:${getMemberColor(i)};`}">
          ${m.avatar_url ? '' : getInitials(m.username)}
        </div>
        <span class="project-member-chip-name">${m.username}</span>
        <span class="project-member-role-badge ${m.role === 'owner' ? 'badge-owner' : 'badge-member'}">
          ${m.role === 'owner' ? 'Vlastník' : 'Člen'}
        </span>
        ${isOwner && m.role !== 'owner' ? `
          <button class="remove-member-btn" data-member-id="${m.id}" title="Odebrat člena">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `).join('');

    membersEl.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const memberId = btn.dataset.memberId;
        const ok = await showConfirm('Odebrat člena?', 'Člen ztratí přístup k projektu.');
        if (!ok) return;
        const result = await window.api.deleteProjectMember(memberId);
        if (result) {
          showToast('Člen byl odebrán');
          await openProjectDetail(currentProjectId);
        } else {
          showToast('Nepodařilo se odebrat člena', 'error');
        }
      });
    });
  }

  const taskList = document.getElementById('projectTaskList');
  if (tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Zatím žádné úkoly v tomto projektu.</p></div>';
  } else {
    taskList.innerHTML = '';
    sortTasksByImportance(tasks).forEach(task => taskList.appendChild(createTaskElement(task)));
  }

  const bannerColors = [
    'linear-gradient(135deg, #0064B3 0%, #00a8e8 100%)',
    'linear-gradient(135deg, #27AE60 0%, #2ecc71 100%)',
    'linear-gradient(135deg, #8E44AD 0%, #c39bd3 100%)',
    'linear-gradient(135deg, #E74C3C 0%, #f1948a 100%)',
    'linear-gradient(135deg, #F39C12 0%, #f8c471 100%)',
    'linear-gradient(135deg, #16A085 0%, #48c9b0 100%)',
  ];

  const bannerEl = document.getElementById('projectHeroBanner');
  const hashCode = [...projectId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  bannerEl.style.background = bannerColors[hashCode % bannerColors.length];

  await loadProjectAttachments(projectId);
  setProjectDetailLoading(false);
}

async function loadProjectTasks(projectId) {
  const tasks = await window.api.getTasksByProject(projectId);
  const taskList = document.getElementById('projectTaskList');
  if (!taskList) return;
  if (tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state"><p>Zatím žádné úkoly v tomto projektu.</p></div>';
    return;
  }
  taskList.innerHTML = '';
  sortTasksByImportance(tasks).forEach(task => taskList.appendChild(createTaskElement(task)));
}

document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
  if (!currentProjectId) return;
  const ok = await showConfirm('Smazat projekt?', 'Smažou se i všechny úkoly a přílohy projektu.');
  if (!ok) return;
  await window.api.deleteProject(currentProjectId);
  showToast('Projekt byl smazán');
  currentProjectId = null;
  showPage('page-projekty', 'btn-vsechny-projekty');
  await loadProjects();
});

document.getElementById('createProject').addEventListener('click', async () => {
  const titleInput = document.getElementById('newProjectTitle');
  const title = titleInput.value.trim();

  titleInput.classList.remove('input-error');
  document.getElementById('newProjectDate').classList.remove('input-error');
  document.querySelectorAll('#overlay-newproject .error-message').forEach(e => e.remove());

  let hasError = false;

  if (!title) {
    titleInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název projektu je povinný';
    titleInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  const dateInput = document.getElementById('newProjectDate');
  const due_date = dateInput.value;

  if (!due_date) {
    dateInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Termín dokončení je povinný';
    dateInput.closest('.date-time-row').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const description = document.getElementById('newProjectDescription').value.trim();
  const due_time = document.getElementById('newProjectTime').value || null;
  const category_id = document.getElementById('newProjectCategory').value || null;

  const project = await window.api.addProject({ title, description, due_date, due_time, category_id });

  if (!project) {
    showToast('Projekt se nepodařilo vytvořit', 'error');
    return;
  }

  overlayNewProject.classList.add('hidden');
  titleInput.value = '';
  document.getElementById('newProjectDescription').value = '';
  document.getElementById('newProjectDate').value = '';
  document.getElementById('newProjectCategory').value = '';
  document.getElementById('newProjectTime').value = '';
  showToast('Projekt byl vytvořen.');

  if (currentProjectCategoryId) {
    await loadProjectsByCategory(currentProjectCategoryId, currentProjectCategoryName, currentProjectCategoryEmoji);
  } else {
    await loadProjects();
  }
});


// ==============================
// 11. EDITACE PROJEKTU
// ==============================

document.getElementById('editProjectBtn').addEventListener('click', async () => {
  if (!currentProjectId) return;
  const project = await window.api.getProjectById(currentProjectId);
  document.getElementById('editProjectTitle').value = project.title || '';
  document.getElementById('editProjectDescription').value = project.description || '';
  document.getElementById('editProjectDate').value = project.due_date || '';
  document.getElementById('editProjectTime').value = project.due_time || '';
  await loadProjectCategoriesIntoDropdown('editProjectCategory', project.category_id || '');
  document.getElementById('overlay-editproject').classList.remove('hidden');
});

document.getElementById('cancelEditProject').addEventListener('click', () => {
  document.getElementById('overlay-editproject').classList.add('hidden');
});

document.getElementById('overlay-editproject').addEventListener('click', (e) => {
  if (e.target === document.getElementById('overlay-editproject')) {
    document.getElementById('overlay-editproject').classList.add('hidden');
  }
});

document.getElementById('saveEditProject').addEventListener('click', async () => {
  const titleInput = document.getElementById('editProjectTitle');
  const title = titleInput.value.trim();
  const due_time = document.getElementById('editProjectTime').value || null;

  titleInput.classList.remove('input-error');
  document.getElementById('newProjectDate').classList.remove('input-error');
  document.querySelectorAll('#overlay-newproject .error-message').forEach(e => e.remove());

  let hasError = false;

  if (!title) {
    titleInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název projektu je povinný';
    titleInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  const dateInput = document.getElementById('newProjectDate');
  const due_date = dateInput.value;

  if (!due_date) {
    dateInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Termín dokončení je povinný';
    dateInput.closest('.date-time-row').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const description = document.getElementById('editProjectDescription').value.trim();
  const category_id = document.getElementById('editProjectCategory').value || null;

  await window.api.updateProject({ id: currentProjectId, title, description, due_date, due_time, category_id });
  document.getElementById('overlay-editproject').classList.add('hidden');
  showToast('Projekt byl upraven');
  await openProjectDetail(currentProjectId);
});

async function loadProjectCategoriesIntoDropdown(selectId, selectedValue = '') {
  const categories = await window.api.getAllProjectCategories();
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Bez kategorie</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.emoji} ${category.name}`;
    if (selectedValue && selectedValue === category.id) option.selected = true;
    select.appendChild(option);
  });
}

document.getElementById('addProjectBtn').addEventListener('click', async () => {
  overlayNewProject.classList.remove('hidden');
  await loadProjectCategoriesIntoDropdown('newProjectCategory', currentProjectCategoryId || '');
});

document.getElementById('leaveProjectBtn').addEventListener('click', async () => {
  const ok = await showConfirm('Opustit projekt?', 'Přijdeš o přístup k tomuto projektu.');
  if (!ok) return;
  const result = await window.api.leaveProject(currentProjectId);
  if (result) {
    showToast('Opustil/a jsi projekt');
    currentProjectId = null;
    showPage('page-projekty', 'btn-vsechny-projekty');
    await loadProjects();
  } else {
    showToast('Nepodařilo se opustit projekt', 'error');
  }
});


// ==============================
// 12. PŘÍLOHY — nahrávání souborů
// ==============================

document.getElementById('addAttachmentBtn').addEventListener('click', async () => {
  if (!currentProjectId) return;
  const picked = await window.api.pickAttachments();
  if (!picked?.success) {
    showToast('Nepodařilo se vybrat soubory', 'error');
    console.error(picked?.error);
    return;
  }
  if (!picked.files || picked.files.length === 0) return;

  let uploadedCount = 0;
  for (const file of picked.files) {
    const result = await window.api.uploadAttachment({ projectId: currentProjectId, filePath: file.path });
    if (!result?.success) {
      console.error(result?.error);
      showToast(`Soubor ${file.name} se nepodařilo nahrát`, 'error');
      continue;
    }
    uploadedCount++;
  }

  if (uploadedCount > 0) {
    showToast(`Nahráno souborů: ${uploadedCount}`);
    await loadProjectAttachments(currentProjectId);
  }
});

function getFileIconClass(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'other';
}

function getFileEmoji(cls) {
  const map = { pdf: '📄', word: '📝', excel: '📊', ppt: '📑', image: '🖼️', other: '📎' };
  return map[cls] || '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderAttachments(attachments) {
  const list = document.getElementById('attachmentsList');
  if (!list) return;

  if (!attachments || attachments.length === 0) {
    list.innerHTML = `
      <div class="attachments-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
        <p>Žádné přílohy. Přidejte soubory kliknutím na tlačítko.</p>
      </div>`;
    return;
  }

  list.innerHTML = `<div class="attachments-grid">${
    attachments.map((f) => {
      const cls = getFileIconClass(f.file_name);
      return `
        <div class="attachment-card" data-id="${f.id}">
          <div class="attachment-icon ${cls}">${getFileEmoji(cls)}</div>
          <div class="attachment-info">
            <p class="attachment-name">${f.file_name}</p>
            <p class="attachment-size">${formatFileSize(f.file_size || 0)}</p>
          </div>
          ${currentUserRole === 'owner' ? `
            <button class="attachment-delete" data-id="${f.id}" title="Odstranit">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>` : ''}
        </div>`;
    }).join('')
  }</div>`;

  list.querySelectorAll('.attachment-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const attachmentId = btn.dataset.id;
      if (!attachmentId) return;
      const ok = await showConfirm('Smazat přílohu?', 'Soubor bude trvale odstraněn.');
      if (!ok) return;
      const result = await window.api.deleteAttachment(attachmentId);
      if (!result?.success) {
        showToast('Přílohu se nepodařilo smazat', 'error');
        return;
      }
      showToast('Příloha byla smazána');
      await loadProjectAttachments(currentProjectId);
    });
  });

  list.querySelectorAll('.attachment-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.attachment-delete')) return;
      const attachmentId = card.dataset.id;
      if (!attachmentId) return;
      const result = await window.api.openAttachment(attachmentId);
      if (!result?.success) {
        console.error(result?.error);
        showToast('Soubor se nepodařilo otevřít', 'error');
      }
    });
  });
}

async function loadProjectAttachments(projectId) {
  const attachments = await window.api.getProjectAttachments(projectId);
  renderAttachments(attachments || []);
}


// ==============================
// 13. ÚPRAVA KATEGORIE
// ==============================

document.getElementById('cancelEditCategory').addEventListener('click', () => {
  document.getElementById('overlay-editcategory').classList.add('hidden');
});

document.getElementById('overlay-editcategory').addEventListener('click', (e) => {
  if (e.target === document.getElementById('overlay-editcategory')) {
    document.getElementById('overlay-editcategory').classList.add('hidden');
  }
});

document.querySelectorAll('#overlay-editcategory .emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#overlay-editcategory .emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

document.getElementById('saveEditCategory').addEventListener('click', async () => {
  const overlay = document.getElementById('overlay-editcategory');
  const nameInput = document.getElementById('editCategoryName');
  const name = nameInput.value.trim();
  const selectedEmoji = overlay.querySelector('.emoji-btn.selected');
  const categoryId = overlay.dataset.categoryId;
  const categoryType = overlay.dataset.categoryType;

  nameInput.classList.remove('input-error');
  overlay.querySelectorAll('.error-message').forEach(e => e.remove());

  let hasError = false;

  if (!name) {
    nameInput.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Název kategorie je povinný';
    nameInput.insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (!selectedEmoji) {
    const err = document.createElement('p');
    err.className = 'error-message';
    err.textContent = 'Vyber emoji pro kategorii';
    overlay.querySelector('.emoji-picker').insertAdjacentElement('afterend', err);
    hasError = true;
  }

  if (hasError) return;

  const emoji = selectedEmoji.textContent;
  if (categoryType === 'task') {
    await window.api.updateTaskCategory({ id: categoryId, name, emoji });
    await loadTaskCategories();
  } else {
    await window.api.updateProjectCategory({ id: categoryId, name, emoji });
    await loadProjectCategories();
  }
  overlay.classList.add('hidden');
  showToast('Kategorie byla upravena');
});


// ==============================
// 14. AVATAR A NASTAVENÍ ÚČTU
// ==============================

document.getElementById('removeAvatarBtn')?.addEventListener('click', async () => {
  const session = await window.api.getSession();
  if (!session) return;
  const ok = await showConfirm('Odebrat profilový obrázek?', 'Obrázek bude trvale odstraněn.');
  if (!ok) return;
  const result = await window.api.removeAvatar({ userId: session.user.id });
  if (!result?.success) {
    showToast('Nepodařilo se odebrat profilový obrázek', 'error');
    return;
  }
  const profile = await window.api.getProfile(session.user.id);
  updateSidebarProfile(profile, session);
  await loadAccountSettings();
  showToast('Profilový obrázek byl odebrán');
});

document.getElementById('settingsAvatarInput')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const session = await window.api.getSession();
  if (!session) {
    showToast('Nejste přihlášena');
    return;
  }
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));
  const result = await window.api.uploadAvatar({
    userId: session.user.id,
    fileName: file.name,
    mimeType: file.type,
    fileBytes: bytes
  });
  if (!result.success) {
    showToast('Nepodařilo se nahrát profilový obrázek', 'error');
    console.error(result.error);
    return;
  }
  const profile = await window.api.getProfile(session.user.id);
  updateSidebarProfile(profile, session);
  await loadAccountSettings();
  const freshProfile = await window.api.getProfile(session.user.id);
  if (freshProfile?.avatar_url) {
    const profileIconEl = document.getElementById('profileIcon');
    profileIconEl.style.backgroundImage = `url("${freshProfile.avatar_url}?t=${Date.now()}")`;
    profileIconEl.classList.add('has-avatar');
    profileIconEl.textContent = '';
  }
  showToast('Profilový obrázek byl změněn');
});

async function loadAccountSettings() {
  const session = await window.api.getSession();
  if (!session) return;
  const profile = await window.api.getProfile(session.user.id);
  if (!profile) return;

  const usernameInput = document.getElementById('settingsUsername');
  const emailInput = document.getElementById('settingsEmail');
  const avatarPreview = document.getElementById('settingsAvatarPreview');

  if (usernameInput) usernameInput.value = profile.username || '';
  if (emailInput) emailInput.value = session.user.email || '';

  if (avatarPreview) {
    if (profile.avatar_url) {
      avatarPreview.textContent = '';
      avatarPreview.style.backgroundImage = `url("${profile.avatar_url}")`;
      avatarPreview.style.backgroundColor = 'transparent';
      avatarPreview.classList.add('has-avatar');
    } else {
      avatarPreview.style.backgroundImage = 'none';
      avatarPreview.style.backgroundColor = '#0064B3';
      avatarPreview.classList.remove('has-avatar');
      avatarPreview.textContent = (profile.username?.[0] || session.user.email?.[0] || 'U').toUpperCase();
    }
  }

  updateSidebarProfile(profile, session);
}


// ==============================
// 15. ONBOARDING
// ==============================

document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const session = await window.api.getSession();
  if (!session) {
    showToast('Nejste přihlášena', 'error');
    return;
  }

  const username = document.getElementById('onboardingUsername').value.trim();
  if (!username) {
    showToast('Zadejte uživatelské jméno', 'error');
    return;
  }

  const result = await window.api.updateProfile({ userId: session.user.id, username });
  if (!result.success) {
    showToast('Nepodařilo se uložit profil', 'error');
    return;
  }

  const avatarFile = document.getElementById('onboardingAvatar').files?.[0];
  if (avatarFile) {
    if (!avatarFile.type.startsWith('image/')) {
      showToast('Prosím vyberte pouze obrázek', 'error');
      return;
    }
    const arrayBuffer = await avatarFile.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    const avatarResult = await window.api.uploadAvatar({
      userId: session.user.id,
      fileName: avatarFile.name,
      mimeType: avatarFile.type,
      fileBytes: bytes
    });
    if (!avatarResult.success) {
      showToast('Profil uložen, ale profilovku se nepodařilo nahrát', 'error');
    } else {
      showToast('Profilový obrázek byl úspěšně nahrán', 'success');
    }
  }

  const profile = await window.api.getProfile(session.user.id);
  showMainApp();
  updateSidebarProfile(profile || { username, avatar_url: null }, session);
  showPage('page-dnes', 'btn-dnes');
  setPageLoading(true);
  await loadEverything();
  await updateFilterCounts();
  setPageLoading(false);
  showToast('Profil byl dokončen.');
});

document.getElementById('onboardingAvatar').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    document.getElementById('onboardingAvatarLabel').textContent = file.name;
  }
});


// ==============================
// 16. PŘIPOJENÍ K PROJEKTU
// ==============================

const overlayJoin = document.getElementById('overlay-joinproject');

document.getElementById('joinProjectBtn').addEventListener('click', () => {
  overlayJoin.classList.remove('hidden');
});

document.getElementById('confirmJoinProject').addEventListener('click', async () => {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (!code) {
    showToast('Zadej kód', 'error');
    return;
  }
  const result = await window.api.joinProjectByCode(code);
  if (!result.success) {
    showToast(result.error, 'error');
    return;
  }
  overlayJoin.classList.add('hidden');
  document.getElementById('joinCodeInput').value = '';
  showToast('Úspěšně připojeno k projektu');
  await openProjectDetail(result.project.id);
});

document.getElementById('cancelJoinProject').addEventListener('click', () => {
  overlayJoin.classList.add('hidden');
  document.getElementById('joinCodeInput').value = '';
});

overlayJoin.addEventListener('click', (e) => {
  if (e.target === overlayJoin) {
    overlayJoin.classList.add('hidden');
    document.getElementById('joinCodeInput').value = '';
  }
});

document.getElementById('copyProjectCodeBtn')?.addEventListener('click', async () => {
  const code = document.getElementById('projectJoinCode')?.textContent?.trim();
  if (!code) {
    showToast('Kód projektu není k dispozici', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    showToast('Kód projektu byl zkopírován', 'info');
  } catch (err) {
    console.error(err);
    showToast('Nepodařilo se zkopírovat kód', 'error');
  }
});


// ==============================
// 17. NAVIGACE — DŮLEŽITÉ
// ==============================

document.getElementById('btn-dulezite').addEventListener('click', async () => {
  closeTaskDetail();
  setPageLoading(true);
  showPage('page-dulezite', 'btn-dulezite');
  document.querySelectorAll('#page-dulezite .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#page-dulezite .filter-btn').classList.add('active');
  await loadImportantTasks();
  setPageLoading(false);
});

async function loadImportantTasks(showCompleted = false) {
  const tasks = await window.api.getAllTasks();
  const taskList = document.getElementById('importantTaskList');
  if (!taskList) return;

  const importantTasks = sortTasksByImportance(
    tasks.filter(t => t.is_important && (showCompleted ? t.status === 1 : t.status === 0))
  );

  if (importantTasks.length === 0) {
    taskList.innerHTML = `<div class="empty-state"><p>${showCompleted ? 'Žádné dokončené důležité úkoly.' : 'Žádné důležité úkoly.'}</p></div>`;
  } else {
    taskList.innerHTML = '';
    importantTasks.forEach(task => taskList.appendChild(createTaskElement(task)));
  }

  const filterBtns = document.querySelectorAll('#page-dulezite .filter-btn');
  if (filterBtns.length >= 2) {
    const activeCount = tasks.filter(t => t.is_important && t.status === 0).length;
    const doneCount = tasks.filter(t => t.is_important && t.status === 1).length;
    filterBtns[0].textContent = `Aktivní (${activeCount})`;
    filterBtns[1].textContent = `Dokončené (${doneCount})`;
  }
}


// ==============================
// 18. HELPERS — loadEverything, finishAuth
// ==============================

async function loadEverything() {
  await Promise.all([
    loadTasks(),
    loadTaskCategories(),
    loadProjectCategories()
  ]);
}

async function finishAuth(session) {
  const profile = await window.api.getProfile(session.user.id);
  if (!profile || !profile.username || profile.username.trim() === '') {
    showAuthPage('page-onboarding');
    return;
  }
  showMainApp();
  updateSidebarProfile(profile, session);
  showPage('page-dnes', 'btn-dnes');
  setPageLoading(true);
  await loadEverything();
  await updateFilterCounts();
  setPageLoading(false);
}


// ==============================
// 19. VYHLEDÁVÁNÍ
// ==============================

async function performSearch(query) {
  const q = query.trim().toLowerCase();
  const resultsContainer = document.getElementById('searchResults');
  if (!q) {
    resultsContainer.classList.add('hidden');
    return;
  }

  const [allTasks, allProjects] = await Promise.all([
    window.api.getAllTasks(),
    window.api.getAllProjects()
  ]);

  const matchedTasks = allTasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.description && t.description.toLowerCase().includes(q)) ||
    (t.category_name && t.category_name.toLowerCase().includes(q))
  );

  const matchedProjects = allProjects.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.category_name && p.category_name.toLowerCase().includes(q))
  );

  renderSearchResults(matchedTasks, matchedProjects, q);
}

function highlight(text, query) {
  if (!text) return '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function renderSearchResults(tasks, projects, query) {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  if (tasks.length === 0 && projects.length === 0) {
    container.innerHTML = `<div class="search-empty">Žádné výsledky pro „${query}"</div>`;
    container.classList.remove('hidden');
    return;
  }

  if (tasks.length > 0) {
    const section = document.createElement('div');
    section.className = 'search-section';
    section.innerHTML = `<p class="search-section-label">Úkoly</p>`;
    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-icon task-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="search-result-body">
          <p class="search-result-title">${highlight(task.title, query)}</p>
          ${task.category_name ? `<p class="search-result-sub">${task.category_emoji || ''} ${highlight(task.category_name, query)}</p>` : ''}
        </div>
        ${task.status === 1 ? '<span class="search-result-badge done">Hotovo</span>' : ''}
      `;
      item.addEventListener('click', () => {
        closeSearch();
        if (task.project_id) {
          openProjectDetail(task.project_id).then(() => openTaskDetail(task));
        } else {
          showPage('page-vsechny-ukoly', 'btn-vsechnyukoly');
          document.querySelector('#page-vsechny-ukoly .page-title').textContent = 'Všechny úkoly';
          window.api.getAllTasks().then(tasks => {
            const taskList = document.querySelector('#page-vsechny-ukoly .task-list');
            taskList.innerHTML = '';
            tasks.forEach(t => taskList.appendChild(createTaskElement(t)));
            setTimeout(() => openTaskDetail(task), 50);
          });
        }
      });
      section.appendChild(item);
    });
    container.appendChild(section);
  }

  if (projects.length > 0) {
    const section = document.createElement('div');
    section.className = 'search-section';
    section.innerHTML = `<p class="search-section-label">Projekty</p>`;
    projects.forEach(project => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-icon project-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="search-result-body">
          <p class="search-result-title">${highlight(project.title, query)}</p>
          ${project.category_name ? `<p class="search-result-sub">${project.category_emoji || ''} ${highlight(project.category_name, query)}</p>` : ''}
        </div>
      `;
      item.addEventListener('click', () => {
        closeSearch();
        openProjectDetail(project.id);
      });
      section.appendChild(item);
    });
    container.appendChild(section);
  }

  container.classList.remove('hidden');
}

function closeSearch() {
  document.getElementById('searchResults').classList.add('hidden');
  document.querySelector('.search-wrapper input').value = '';
}

let searchDebounce = null;

document.querySelector('.search-wrapper input').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => performSearch(e.target.value), 200);
});

document.querySelector('.search-wrapper input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper') && !e.target.closest('#searchResults')) {
    closeSearch();
  }
});


// ==============================
// 20. KALENDÁŘ
// ==============================

let calendarDate = new Date();

document.getElementById('btn-kalendar').addEventListener('click', async () => {
  closeTaskDetail();
  setPageLoading(true);
  showPage('page-kalendar', 'btn-kalendar');
  await renderCalendar();
  setPageLoading(false);
});

document.getElementById('calPrev').addEventListener('click', async () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  await renderCalendar();
});

document.getElementById('calNext').addEventListener('click', async () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  await renderCalendar();
});

async function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

  document.getElementById('calMonthLabel').textContent = `${monthNames[month]} ${year}`;

  const [allTasks, allProjects] = await Promise.all([
    window.api.getAllTasks(),
    window.api.getAllProjects()
  ]);

  const eventMap = {};

  allTasks.forEach(task => {
    if (!task.due_date) return;
    if (!eventMap[task.due_date]) eventMap[task.due_date] = [];
    eventMap[task.due_date].push({ type: 'task', item: task });
  });

  allProjects.forEach(project => {
    if (!project.due_date) return;
    if (!eventMap[project.due_date]) eventMap[project.due_date] = [];
    eventMap[project.due_date].push({ type: 'project', item: project });
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date().toISOString().split('T')[0];

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const grid = document.getElementById('calendarGrid');
  const dayNames = grid.querySelectorAll('.calendar-day-name');
  grid.innerHTML = '';
  dayNames.forEach(d => grid.appendChild(d));

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const events = eventMap[dateStr] || [];

    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (dateStr === today) dayEl.classList.add('today');
    if (events.length > 0) dayEl.classList.add('has-events');

    dayEl.innerHTML = `
      <span class="calendar-day-number">${d}</span>
      ${events.length > 0 ? `
        <div class="calendar-day-dots">
          ${events.slice(0, 3).map(e =>
            `<span class="calendar-dot ${e.type === 'task' ? 'dot-task' : 'dot-project'}"></span>`
          ).join('')}
        </div>
      ` : ''}
    `;

    grid.appendChild(dayEl);
  }

  renderUpcomingEvents(eventMap, today);
}

function renderUpcomingEvents(eventMap, today) {
  const list = document.getElementById('calendarEventsList');

  const upcoming = Object.entries(eventMap)
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 20);

  if (upcoming.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Žádné nadcházející události.</p></div>';
    return;
  }

  list.innerHTML = '';

  upcoming.forEach(([date, events]) => {
    const [year, month, day] = date.split('-');
    const dateLabel = `${day}.${month}.${year}`;

    const group = document.createElement('div');
    group.className = 'calendar-event-group';
    group.innerHTML = `<p class="calendar-event-date">${dateLabel}</p>`;

    events.forEach(({ type, item }) => {
      const eventEl = document.createElement('div');
      eventEl.className = `calendar-event-item ${type === 'task' ? 'event-task' : 'event-project'}`;
      eventEl.innerHTML = `
        <div class="calendar-event-icon">
          ${type === 'task'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
          }
        </div>
        <div class="calendar-event-body">
          <p class="calendar-event-title ${type === 'task' && item.status === 1 ? 'completed' : ''}">${item.title}</p>
          <p class="calendar-event-sub">${type === 'task' ? (item.category_name || 'Bez kategorie') : 'Projekt'}</p>
        </div>
        ${type === 'task' && item.status === 1 ? '<span class="calendar-event-badge">Hotovo</span>' : ''}
      `;

      if (type === 'project') {
        eventEl.style.cursor = 'pointer';
        eventEl.addEventListener('click', () => openProjectDetail(item.id));
      }

      group.appendChild(eventEl);
    });

    list.appendChild(group);
  });
}