const { contextBridge, ipcRenderer } = require('electron');

const api = {

  // ==============================
  // ÚKOLY
  // ==============================

  addTask: (task) => ipcRenderer.invoke('tasks:add', task),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  markComplete: (params) => ipcRenderer.invoke('tasks:markComplete', params),
  markImportant: (params) => ipcRenderer.invoke('tasks:markImportant', params),
  getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
  getTasksByDate: (date) => ipcRenderer.invoke('tasks:getByDate', date),
  getTasksByCategory: (category_id) => ipcRenderer.invoke('tasks:getByCategory', category_id),
  getTasksByProject: (project_id) => ipcRenderer.invoke('tasks:getByProject', project_id),
  updateTask: (task) => ipcRenderer.invoke('tasks:update', task),

  // ==============================
  // KATEGORIE ÚKOLŮ
  // ==============================

  addTaskCategory: (category) => ipcRenderer.invoke('categories:add', category),
  getAllTaskCategories: () => ipcRenderer.invoke('categories:getAll'),
  deleteTaskCategory: (id) => ipcRenderer.invoke('categories:delete', id),
  updateTaskCategory: (params) => ipcRenderer.invoke('categories:update', params),
  getTaskAssignees: (taskId) => ipcRenderer.invoke('taskAssignees:getByTask', taskId),
  updateTaskAssignees: (params) => ipcRenderer.invoke('taskAssignees:update', params),

  // ==============================
  // PROJEKTY
  // ==============================

  addProject: (project) => ipcRenderer.invoke('projects:add', project),
  getAllProjects: () => ipcRenderer.invoke('projects:getAll'),
  getProjectById: (id) => ipcRenderer.invoke('projects:getById', id),
  updateProject: (project) => ipcRenderer.invoke('projects:update', project),
  deleteProject: (id) => ipcRenderer.invoke('projects:delete', id),
  joinProjectByCode: (code) => ipcRenderer.invoke('projects:joinByCode', code),
  

  // ==============================
  // ČLENOVÉ PROJEKTU
  // ==============================

  getProjectMembers: (project_id) => ipcRenderer.invoke('projectMembers:get', project_id),
  addProjectMember: (params) => ipcRenderer.invoke('projectMembers:add', params),
  deleteProjectMember: (id) => ipcRenderer.invoke('projectMembers:delete', id),
  getCurrentUserRole: (projectId) => ipcRenderer.invoke('projectMembers:getCurrentRole', projectId),


  // ==============================
  // KATEGORIE PROJEKTŮ
  // ==============================

  addProjectCategory: (category) => ipcRenderer.invoke('projectCategories:add', category),
  getAllProjectCategories: () => ipcRenderer.invoke('projectCategories:getAll'),
  deleteProjectCategory: (id) => ipcRenderer.invoke('projectCategories:delete', id),
  updateProjectCategory: (params) => ipcRenderer.invoke('projectCategories:update', params),
  getProjectsByCategory: (category_id) => ipcRenderer.invoke('projects:getByCategory', category_id),
  leaveProject: (projectId) => ipcRenderer.invoke('projectMembers:leave', projectId),
    // ==============================
  // PŘÍLOHY
  // ==============================
  pickAttachments: () => ipcRenderer.invoke('attachments:pick'),
  uploadAttachment: (params) => ipcRenderer.invoke('attachments:upload', params),
  getProjectAttachments: (projectId) => ipcRenderer.invoke('attachments:getByProject', projectId),
  deleteAttachment: (id) => ipcRenderer.invoke('attachments:delete', id),
  openAttachment: (attachmentId) => ipcRenderer.invoke('attachments:open', attachmentId),
  


// Auth
register: (params) => ipcRenderer.invoke('auth:register', params),
login: (params) => ipcRenderer.invoke('auth:login', params),
logout: () => ipcRenderer.invoke('auth:logout'),
getSession: () => ipcRenderer.invoke('auth:getSession'),
setSession: (params) => ipcRenderer.invoke('auth:setSession', params),
resetPassword: (params) => ipcRenderer.invoke('auth:resetPassword', params),

// Profil
updateProfile: (params) => ipcRenderer.invoke('profile:update', params),
getProfile: (userId) => ipcRenderer.invoke('profile:get', userId),
updatePassword: (params) => ipcRenderer.invoke('auth:updatePassword', params),
uploadAvatar: (params) => ipcRenderer.invoke('profile:uploadAvatar', params),
removeAvatar: (params) => ipcRenderer.invoke('profile:removeAvatar', params), 

}

contextBridge.exposeInMainWorld('api', api);

contextBridge.exposeInMainWorld('electronAuth', {
onAuthCallback: (callback) => ipcRenderer.on('auth:callback', (_, url) => callback(url)),
})