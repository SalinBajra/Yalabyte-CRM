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
  return (data || []).map((row) => ({
    ...row.data,
    source: row.data?.source === 'Manual entry' ? 'Team added' : row.data?.source
  }));
}

export async function saveLeads(leads) {
  if (!leads.length) return;
  const uniqueLeads = Array.from(new Map(leads.filter((lead) => lead?.id).map((lead) => [lead.id, lead])).values());
  const rows = uniqueLeads.map((lead) => ({
    id: lead.id,
    data: lead,
    updated_at: lead.updatedAt || new Date().toISOString()
  }));
  const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function registerTeamMember(user) {
  const changes = {
    name: user.name,
    email: user.email.toLowerCase(),
    last_seen_at: new Date().toISOString()
  };
  const { data: existing, error: lookupError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = existing
    ? await supabase.from('team_members').update(changes).eq('user_id', user.id)
    : await supabase.from('team_members').insert({ user_id: user.id, ...changes });
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

export async function fetchReadNotificationIds() {
  const { data, error } = await supabase
    .from('notification_reads')
    .select('notification_id');
  if (error) throw error;
  return (data || []).map((row) => row.notification_id);
}

export async function markDeletionNotificationsRead(notificationIds, userId) {
  const uniqueIds = Array.from(new Set(notificationIds.filter((notificationId) => notificationId !== null && notificationId !== undefined)));
  if (!uniqueIds.length) return;
  const { error } = await supabase.from('notification_reads').upsert(
    uniqueIds.map((notificationId) => ({ user_id: userId, notification_id: notificationId })),
    { onConflict: 'user_id,notification_id', ignoreDuplicates: true }
  );
  if (error) throw error;
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
  return (data || []).map((contact) => ({
    ...contact,
    source: contact.source === 'Manual entry' ? 'Team added' : contact.source
  }));
}

export async function createContact(contact, user) {
  const payload = {
    ...contact,
    created_by: user.id,
    created_by_name: user.name,
    created_by_email: user.email
  };
  let { data, error } = await supabase.from('contacts').insert(payload).select().single();
  if (error && Object.hasOwn(payload, 'lead_id') && /lead_id/i.test(error.message || '')) {
    delete payload.lead_id;
    ({ data, error } = await supabase.from('contacts').insert(payload).select().single());
  }
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

export async function deleteContact(contactId) {
  const { error } = await supabase.from('contacts').delete().eq('id', contactId);
  if (error) throw error;
}

export async function convertLeadToContact(lead, user) {
  let supportsLeadLink = true;
  const { data: linkedContact, error: linkedError } = await supabase
    .from('contacts')
    .select('*')
    .eq('lead_id', lead.id)
    .maybeSingle();
  if (linkedError && /lead_id/i.test(linkedError.message || '')) supportsLeadLink = false;
  else if (linkedError) throw linkedError;
  if (linkedContact) return { contact: linkedContact, created: false };

  const { data: contacts, error: contactsError } = await supabase.from('contacts').select('*');
  if (contactsError) throw contactsError;
  const email = lead.email?.trim().toLowerCase() || '';
  const phone = lead.phone?.replace(/\D/g, '') || '';
  let existingContact = (contacts || []).find((contact) => (
    (email && contact.email?.trim().toLowerCase() === email)
    || (phone.length >= 7 && contact.phone?.replace(/\D/g, '') === phone)
  ));
  if (existingContact) {
    if (supportsLeadLink && !existingContact.lead_id) {
      existingContact = await updateContact(existingContact.id, { lead_id: lead.id });
    }
    return { contact: existingContact, created: false };
  }

  const contact = await createContact({
    name: lead.name || 'Unnamed contact',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    role: '',
    source: lead.source || 'Lead conversion',
    notes: [lead.message, lead.notes].filter(Boolean).join('\n\n'),
    ...(supportsLeadLink ? { lead_id: lead.id } : {})
  }, user);
  return { contact, created: true };
}

export async function fetchLeadTasks(leadId) {
  const { data, error } = await supabase
    .from('lead_tasks')
    .select('*')
    .eq('lead_id', leadId)
    .order('status')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function fetchAllLeadTasks() {
  const { data, error } = await supabase
    .from('lead_tasks')
    .select('*')
    .order('status')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function createLeadTask(task, leadId, assignee, user) {
  const { data, error } = await supabase
    .from('lead_tasks')
    .insert({
      lead_id: leadId,
      title: task.title.trim(),
      description: task.description.trim(),
      due_date: task.dueDate || null,
      priority: task.priority || 'medium',
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

export async function setLeadTaskStatus(taskId, status) {
  const { error } = await supabase
    .from('lead_tasks')
    .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', taskId);
  if (error) throw error;
}

export async function setTeamMemberRole(userId, role) {
  const { error } = await supabase.rpc('set_team_member_role', {
    p_user_id: userId,
    p_role: role
  });
  if (error) throw error;
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
