import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function toCRMUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Team member',
    email: user.email || ''
  };
}

export async function fetchLeads() {
  const { data, error } = await supabase.from('leads').select('data').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => row.data);
}

export async function saveLeads(leads) {
  if (!leads.length) return;
  const rows = leads.map((lead) => ({
    id: lead.id,
    data: lead,
    updated_at: lead.updatedAt || new Date().toISOString()
  }));
  const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function registerTeamMember(user) {
  const { error } = await supabase.from('team_members').upsert(
    {
      user_id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      last_seen_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export async function fetchTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function updateTeamProfile(user, profile, avatarFile) {
  let avatarUrl = profile.avatar_url || '';
  if (avatarFile) {
    const extension = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const objectPath = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('team-avatars')
      .upload(objectPath, avatarFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('team-avatars').getPublicUrl(objectPath);
    avatarUrl = data.publicUrl;
  }

  const changes = {
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    bio: profile.bio.trim(),
    status: profile.status,
    avatar_url: avatarUrl,
    last_seen_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('team_members')
    .update(changes)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;

  const { error: authError } = await supabase.auth.updateUser({ data: { name: changes.name } });
  if (authError) throw authError;
  return data;
}

export async function fetchDeletionNotifications() {
  const { data, error } = await supabase
    .from('lead_deletion_notifications')
    .select('id,lead_id,lead_name,deleted_by_name,deleted_by_email,deleted_at')
    .order('deleted_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function deleteLeadWithAudit(leadId, actorName) {
  const { error } = await supabase.rpc('delete_crm_lead', {
    p_lead_id: leadId,
    p_actor_name: actorName
  });
  if (error) throw error;
}

export async function fetchContacts() {
  const { data, error } = await supabase.from('contacts').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContact(contact, user) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...contact,
      created_by: user.id,
      created_by_name: user.name,
      created_by_email: user.email
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(contactId, changes) {
  const { data, error } = await supabase
    .from('contacts')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchContactTasks(contactId) {
  const { data, error } = await supabase
    .from('contact_tasks')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContactTask(task, contactId, assignee, user) {
  const { data, error } = await supabase
    .from('contact_tasks')
    .insert({
      contact_id: contactId,
      title: task.title,
      description: task.description,
      due_date: task.dueDate || null,
      assigned_to: assignee.user_id,
      assigned_to_name: assignee.name,
      assigned_to_email: assignee.email,
      assigned_by: user.id,
      assigned_by_name: user.name,
      assigned_by_email: user.email
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setContactTaskStatus(taskId, status) {
  const { error } = await supabase
    .from('contact_tasks')
    .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', taskId);
  if (error) throw error;
}

export async function notifyCliqNewLead(lead, createdBy) {
  const { data } = await supabase.auth.getSession();
  const creatorName = createdBy?.name?.trim() || 'A team member';
  const ownerName = lead.owner?.trim() || '';
  const hasDifferentOwner = ownerName
    && ownerName.localeCompare(creatorName, undefined, { sensitivity: 'base' }) !== 0;
  const assignmentText = hasDifferentOwner ? ` It has been assigned to ${ownerName}.` : '';
  const cliqMessage = `Hi Team! 🚀 ${creatorName} has added a new lead, ${lead.name}.${assignmentText} Please take a look and let's rock and roll! 🤘`;

  const response = await fetch('https://www.yalabyte.com/api/crm-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token || ''}`
    },
    body: JSON.stringify({
      type: 'new_lead',
      message: cliqMessage,
      createdBy: {
        id: createdBy?.id || '',
        name: creatorName,
        email: createdBy?.email || ''
      },
      assignedTo: hasDifferentOwner ? ownerName : '',
      lead: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        service: lead.service,
        source: lead.source,
        owner: lead.owner
      }
    })
  });
  if (!response.ok) throw new Error('Cliq notification could not be delivered.');
}
