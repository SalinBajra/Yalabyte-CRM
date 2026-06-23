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
