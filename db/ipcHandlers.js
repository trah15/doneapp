import { ipcMain, shell, dialog } from 'electron';
import { supabase } from './supabaseClient.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

export default function setUpHandlers() {
  const flattenCategory = (item) => {
    if (!item) return null;
    return {
      ...item,
      category_name: item.TaskCategory?.name || item.ProjectCategory?.name || null,
      category_emoji: item.TaskCategory?.emoji || item.ProjectCategory?.emoji || null,
      TaskCategory: undefined,
      ProjectCategory: undefined
    };
  };

  // ==============================
  // AUTH
  // ==============================

  ipcMain.handle('auth:register', async (_, { email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'doneapp://auth/callback'
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  });

  ipcMain.handle('auth:login', async (_, { email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  });

  ipcMain.handle('auth:setSession', async (_, { access_token, refresh_token }) => {
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  });

  ipcMain.handle('auth:getSession', async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  });

  ipcMain.handle('auth:logout', async () => {
    await supabase.auth.signOut();
    return { success: true };
  });

  ipcMain.handle('auth:updatePassword', async (_, { password }) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  });

  ipcMain.handle('auth:resetPassword', async (_, { email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'doneapp://auth/callback'
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });


  // ==============================
  // PROFILY
  // ==============================

  ipcMain.handle('profile:get', async (_, userId) => {
    const { data, error } = await supabase
      .from('Profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('profile:get data:', data);
    console.log('profile:get error:', error);

    return error ? null : data;
  });

  ipcMain.handle('profile:update', async (_, { userId, username, avatarUrl }) => {
  const { error } = await supabase
    .from('Profiles')
    .update({
      username,
      avatar_url: avatarUrl
    })
    .eq('id', userId);

  return { success: !error, error: error?.message };
});

  // ==============================
  // ÚKOLY
  // ==============================

  ipcMain.handle('tasks:add', async (_, task) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('tasks:add -> není session');
      return null;
    }

    const { data, error } = await supabase
      .from('Task')
      .insert({
        title: task.title,
        description: task.description || null,
        due_date: task.due_date,
        due_time: task.due_time || null,
        category_id: task.category_id || null,
        project_id: task.project_id || null,
        user_id: session.user.id,
        status: 0,
        is_important: false
      })
      .select('*, TaskCategory(name, emoji)')
      .single();

    if (error) {
      console.error('tasks:add error:', error);
      return null;
    }

    return flattenCategory(data);
  });

  ipcMain.handle('tasks:getAll', async () => {
    const { data, error } = await supabase
      .from('Task')
      .select('*, TaskCategory(name, emoji)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('tasks:getAll error:', error);
      return [];
    }

    return data.map(flattenCategory);
  });

  ipcMain.handle('tasks:getByDate', async (_, date) => {
    const { data, error } = await supabase
      .from('Task')
      .select('*, TaskCategory(name, emoji)')
      .eq('due_date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('tasks:getByDate error:', error);
      return [];
    }

    return data.map(flattenCategory);
  });

  ipcMain.handle('tasks:getByCategory', async (_, categoryId) => {
    const { data, error } = await supabase
      .from('Task')
      .select('*, TaskCategory(name, emoji)')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('tasks:getByCategory error:', error);
      return [];
    }

    return data.map(flattenCategory);
  });

  ipcMain.handle('tasks:getByProject', async (_, projectId) => {
  const { data, error } = await supabase
    .from('Task')
    .select('*, TaskCategory(name, emoji)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('tasks:getByProject error:', error);
    return [];
  }

  const tasks = data.map(flattenCategory);

  for (const task of tasks) {
    const { data: assignees, error: assigneesError } = await supabase
      .from('TaskAssignee')
      .select('*')
      .eq('task_id', task.id);

    if (assigneesError || !assignees || assignees.length === 0) {
      task.assignees = [];
      continue;
    }

    const userIds = assignees.map(a => a.user_id).filter(Boolean);

    const { data: profiles, error: profilesError } = await supabase
      .from('Profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError || !profiles) {
      task.assignees = [];
      continue;
    }

    task.assignees = assignees.map(assignee => {
      const profile = profiles.find(p => p.id === assignee.user_id);
      return {
        id: assignee.id,
        user_id: assignee.user_id,
        username: profile?.username || 'Uživatel',
        avatar_url: profile?.avatar_url || null
      };
    });
  }

  return tasks;
});

  ipcMain.handle('tasks:update', async (_, task) => {
    const { id, ...updates } = task;

    const { data, error } = await supabase
      .from('Task')
      .update(updates)
      .eq('id', id)
      .select('*, TaskCategory(name, emoji)')
      .single();

    if (error) {
      console.error('tasks:update error:', error);
      return null;
    }

    return flattenCategory(data);
  });

  ipcMain.handle('tasks:delete', async (_, id) => {
    const { error } = await supabase.from('Task').delete().eq('id', id);
    return !error;
  });

  ipcMain.handle('tasks:markComplete', async (_, { id, status }) => {
    const { error } = await supabase.from('Task').update({ status }).eq('id', id);
    return !error;
  });

  ipcMain.handle('tasks:markImportant', async (_, { id, is_important }) => {
    const { error } = await supabase
      .from('Task')
      .update({ is_important })
      .eq('id', id);

    if (error) {
      console.error('tasks:markImportant error:', error);
      return false;
    }

    return true;
  });

  // ==============================
  // KATEGORIE ÚKOLŮ
  // ==============================

  ipcMain.handle('categories:getAll', async () => {
    const { data, error } = await supabase
      .from('TaskCategory')
      .select('id, name, emoji')
      .order('name');

    return error ? [] : data;
  });

  ipcMain.handle('categories:add', async (_, { name, emoji }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('TaskCategory')
      .insert({ name, emoji, user_id: session.user.id })
      .select()
      .single();

    return error ? null : data;
  });

  ipcMain.handle('categories:delete', async (_, id) => {
    const { error } = await supabase.from('TaskCategory').delete().eq('id', id);
    return !error;
  });

  ipcMain.handle('categories:update', async (_, { id, name, emoji }) => {
    const { error } = await supabase
      .from('TaskCategory')
      .update({ name, emoji })
      .eq('id', id);
    return { success: !error, error: error?.message };
  });

    // ==============================
  // PŘIŘAZENÍ ÚKOLŮ ČLENŮM
  // ==============================

  ipcMain.handle('taskAssignees:getByTask', async (_, taskId) => {
    const { data: assignees, error } = await supabase
      .from('TaskAssignee')
      .select('*')
      .eq('task_id', taskId);

    if (error || !assignees) {
      console.error('taskAssignees:getByTask error:', error);
      return [];
    }

    const userIds = assignees.map(a => a.user_id).filter(Boolean);

    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from('Profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError || !profiles) {
      console.error('taskAssignees:getByTask profiles error:', profilesError);
      return [];
    }

    return assignees.map(assignee => {
      const profile = profiles.find(p => p.id === assignee.user_id);

      return {
        id: assignee.id,
        task_id: assignee.task_id,
        user_id: assignee.user_id,
        username: profile?.username || 'Uživatel',
        avatar_url: profile?.avatar_url || null
      };
    });
  });

  ipcMain.handle('taskAssignees:update', async (_, { taskId, userIds }) => {
    try {
      const safeUserIds = Array.isArray(userIds) ? userIds : [];

      const { error: deleteError } = await supabase
        .from('TaskAssignee')
        .delete()
        .eq('task_id', taskId);

      if (deleteError) {
        console.error('taskAssignees:update delete error:', deleteError);
        return { success: false, error: deleteError.message };
      }

      if (safeUserIds.length === 0) {
        return { success: true };
      }

      const rows = safeUserIds.map(userId => ({
        task_id: taskId,
        user_id: userId
      }));

      const { error: insertError } = await supabase
        .from('TaskAssignee')
        .insert(rows);

      if (insertError) {
        console.error('taskAssignees:update insert error:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('taskAssignees:update catch error:', err);
      return { success: false, error: err.message };
    }
  });



  // ==============================
  // PROJEKTY
  // ==============================

  function generateJoinCode(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  ipcMain.handle('projects:add', async (_, project) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('projects:add -> není session');
      return null;
    }

    let join_code = generateJoinCode();
    let existingProject = null;

    do {
      const { data } = await supabase
        .from('Project')
        .select('id')
        .eq('join_code', join_code)
        .maybeSingle();

      existingProject = data;

      if (existingProject) {
        join_code = generateJoinCode();
      }
    } while (existingProject);

    const { data, error } = await supabase
      .from('Project')
      .insert({
        title: project.title,
        description: project.description || null,
        due_date: project.due_date || null,
        due_time: project.due_time || null,
        category_id: project.category_id || null,
        owner_id: session.user.id,
        join_code
      })
      .select('*, ProjectCategory(name, emoji)')
      .single();

    if (error) {
      console.error('projects:add error:', error);
      return null;
    }

    const { error: memberError } = await supabase
      .from('ProjectMember')
      .insert({
        project_id: data.id,
        user_id: session.user.id,
        role: 'owner'
      });

    if (memberError) {
      console.error('projects:add owner member insert error:', memberError);
    }

    return flattenCategory(data);
  });

  ipcMain.handle('projects:getAll', async () => {
    const { data, error } = await supabase
      .from('Project')
      .select('*, ProjectCategory(name, emoji)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('projects:getAll error:', error);
      return [];
    }

    return data.map(flattenCategory);
  });

  ipcMain.handle('projects:getById', async (_, id) => {
    const { data, error } = await supabase
      .from('Project')
      .select('*, ProjectCategory(name, emoji)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('projects:getById error:', error);
      return null;
    }

    return flattenCategory(data);
  });

  ipcMain.handle('projects:update', async (_, project) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('projects:update incoming:', project);
  console.log('projects:update session user:', session?.user?.id);

  const { id, ...updates } = project;

  const { data, error } = await supabase
    .from('Project')
    .update(updates)
    .eq('id', id)
    .select('*, ProjectCategory(name, emoji)');

  console.log('projects:update result data:', data);
  console.log('projects:update result error:', error);

  if (error || !data || data.length === 0) {
    return null;
  }

  return flattenCategory(data[0]);
});


  ipcMain.handle('projects:delete', async (_, id) => {
    const { error } = await supabase.from('Project').delete().eq('id', id);
    return !error;
  });

  ipcMain.handle('projects:joinByCode', async (_, code) => {
    const { data, error } = await supabase.rpc('join_project_by_code', {
      input_code: code
    });

    if (error) {
      console.error('projects:joinByCode rpc error:', error);
      return { success: false, error: 'Nepodařilo se připojit k projektu' };
    }

    return data;
  });

ipcMain.handle('projects:getByCategory', async (_, categoryId) => {
  const { data, error } = await supabase
    .from('Project')
    .select('*, ProjectCategory(name, emoji)')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('projects:getByCategory error:', error);
    return [];
  }

  return data.map(flattenCategory);
});


  // ==============================
  // ČLENOVÉ PROJEKTU
  // ==============================

  ipcMain.handle('projectMembers:get', async (_, project_id) => {
    const { data: members, error } = await supabase
      .from('ProjectMember')
      .select('*')
      .eq('project_id', project_id)
      .eq('is_removed', false)
      .order('created_at', { ascending: true });

    if (error || !members) {
      console.error('projectMembers:get error:', error);
      return [];
    }

    const userIds = members.map(m => m.user_id).filter(Boolean);

    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from('Profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError || !profiles) {
      console.error('projectMembers:get profiles error:', profilesError);
      return [];
    }

    return members.map(member => {
      const profile = profiles.find(p => p.id === member.user_id);

    return {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        username: profile?.username || profile?.email || 'Uživatel',
        avatar_url: profile?.avatar_url || null
      };
    });
  });

  ipcMain.handle('projectMembers:getCurrentRole', async (_, projectId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('ProjectMember')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', session.user.id)
    .eq('is_removed', false)
    .single();

  if (error || !data) return null;
  return data.role; // 'owner' nebo 'member'
});



  ipcMain.handle('projectMembers:delete', async (_, id) => {
    const { data: member, error: fetchError } = await supabase
      .from('ProjectMember')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !member) {
      console.error('projectMembers:delete fetch error:', fetchError);
      return false;
    }

    if (member.role === 'owner') {
      console.error('projectMembers:delete -> nelze smazat ownera');
      return false;
    }

    const { error } = await supabase
      .from('ProjectMember')
      .update({ is_removed: true })
      .eq('id', id);

    if (error) {
      console.error('projectMembers:delete error:', error);
      return false;
    }

    return true;
  });

  ipcMain.handle('projectMembers:leave', async (_, projectId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { error } = await supabase
    .from('ProjectMember')
    .update({ is_removed: true })
    .eq('project_id', projectId)
    .eq('user_id', session.user.id)
    .neq('role', 'owner');

  return !error;
});

  // ==============================
  // KATEGORIE PROJEKTŮ
  // ==============================

  ipcMain.handle('projectCategories:getAll', async () => {
    const { data, error } = await supabase
      .from('ProjectCategory')
      .select('id, name, emoji')
      .order('name');

    return error ? [] : data;
  });

  ipcMain.handle('projectCategories:add', async (_, { name, emoji }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('ProjectCategory')
      .insert({
        name,
        emoji,
        user_id: session.user.id
      })
      .select()
      .single();

    return error ? null : data;
  });

  ipcMain.handle('projectCategories:delete', async (_, id) => {
    const { error } = await supabase
      .from('ProjectCategory')
      .delete()
      .eq('id', id);

    return !error;
  });

  ipcMain.handle('projectCategories:update', async (_, { id, name, emoji }) => {
    const { error } = await supabase
      .from('ProjectCategory')
      .update({ name, emoji })
      .eq('id', id);
    return { success: !error, error: error?.message };
  });

  // ==============================
  // AVATAR
  // ==============================

  ipcMain.handle('profile:uploadAvatar', async (_, { userId, fileName, mimeType, fileBytes }) => {
    try {
      const fileBuffer = Buffer.from(fileBytes);
      const fileExt = path.extname(fileName) || '.png';
      const storagePath = `${userId}/avatar${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      const avatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('Profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, avatarUrl };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('profile:removeAvatar', async (_, { userId }) => {
  // smaž ze storage
  const { error: storageError } = await supabase.storage
    .from('avatars')
    .remove([`${userId}/avatar`]);
  
  // nulluj avatar_url v profilu
  const { error } = await supabase
    .from('Profiles')
    .update({ avatar_url: null })
    .eq('id', userId);
  
  return { success: !error };
});

  // ==============================
  // PŘÍLOHY
  // ==============================

  ipcMain.handle('attachments:getByProject', async (_, projectId) => {
    try {
      const { data, error } = await supabase
        .from('ProjectAttachment')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('attachments:getByProject error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('attachments:getByProject catch error:', err);
      return [];
    }
  });

  ipcMain.handle('attachments:pick', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled) {
        return { success: true, files: [] };
      }

      const files = result.filePaths.map(filePath => {
        const stats = fs.statSync(filePath);
        return {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size
        };
      });

      return { success: true, files };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('attachments:upload', async (_, { projectId, filePath }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'Nejste přihlášena' };
      }

      if (!projectId || !filePath) {
        return { success: false, error: 'Chybí projectId nebo filePath' };
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath);
      const storagePath = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, fileBuffer, {
          upsert: false
        });

      if (uploadError) {
        console.error('attachments:upload storage error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      const stats = fs.statSync(filePath);

      const { data, error } = await supabase
        .from('ProjectAttachment')
        .insert({
          project_id: projectId,
          uploaded_by: session.user.id,
          file_name: fileName,
          file_path: storagePath,
          file_size: stats.size,
          mime_type: null
        })
        .select('*')
        .single();

      if (error) {
        console.error('attachments:upload db error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, attachment: data };
    } catch (err) {
      console.error('attachments:upload catch error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('attachments:delete', async (_, attachmentId) => {
    try {
      const { data: attachment, error: fetchError } = await supabase
        .from('ProjectAttachment')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (fetchError || !attachment) {
        console.error('attachments:delete fetch error:', fetchError);
        return { success: false, error: 'Příloha nebyla nalezena' };
      }

      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('attachments:delete storage error:', storageError);
      }

      const { error: deleteError } = await supabase
        .from('ProjectAttachment')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        console.error('attachments:delete db error:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('attachments:delete catch error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('attachments:open', async (_, attachmentId) => {
    try {
      const { data: attachment, error } = await supabase
        .from('ProjectAttachment')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (error || !attachment) {
        console.error('attachments:open fetch error:', error);
        return { success: false, error: 'Příloha nebyla nalezena' };
      }

      const { data, error: downloadError } = await supabase.storage
        .from('project-files')
        .download(attachment.file_path);

      if (downloadError || !data) {
        console.error('attachments:open download error:', downloadError);
        return { success: false, error: 'Soubor se nepodařilo stáhnout' };
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const tempPath = path.join(os.tmpdir(), attachment.file_name);
      fs.writeFileSync(tempPath, buffer);

      const openError = await shell.openPath(tempPath);

      if (openError) {
        return { success: false, error: openError };
      }

      return { success: true };
    } catch (err) {
      console.error('attachments:open catch error:', err);
      return { success: false, error: err.message };
    }
  });

}