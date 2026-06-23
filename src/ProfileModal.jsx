import { useEffect, useState } from 'react';
import { updateTeamProfile } from './supabase';

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100';

export default function ProfileModal({ currentUser, profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name || currentUser.name,
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    status: profile?.status || 'available',
    avatar_url: profile?.avatar_url || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(profile?.avatar_url || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Use a JPG, PNG, or WebP image smaller than 5 MB.');
      return;
    }
    setError('');
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Your display name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await updateTeamProfile(currentUser, form, avatarFile);
      onSaved(updated);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/65 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit team profile">
      <form className="max-h-full w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft sm:p-8" onSubmit={save}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">Team identity</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Update your profile</h2><p className="mt-2 text-sm text-slate-500">This information is visible to your YalaByte team.</p></div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200" onClick={onClose} type="button" aria-label="Close">×</button>
        </div>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-navy-950 text-2xl font-extrabold text-cyanbrand-400 shadow-sm">
            {preview ? <img className="h-full w-full object-cover" src={preview} alt="Profile preview" /> : form.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div><label className="inline-flex cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">Choose photo<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} /></label><p className="mt-2 text-xs leading-5 text-slate-400">JPG, PNG, or WebP. Maximum 5 MB.</p></div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Display name<input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="text-sm font-semibold">Contact number<input className={inputClass} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+977 98XXXXXXXX" /></label>
          <label className="text-sm font-semibold sm:col-span-2">Availability<select className={inputClass} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="available">Available</option><option value="busy">Busy</option><option value="away">Away</option><option value="offline">Offline</option></select></label>
          <label className="text-sm font-semibold sm:col-span-2">Short bio<textarea className={`${inputClass} min-h-24`} maxLength="300" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Your role, expertise, or working hours…" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.bio.length}/300</span></label>
        </div>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-500">Account email</p><p className="mt-1 text-sm font-semibold text-slate-800">{currentUser.email}</p></div>
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2"><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600" onClick={onClose} type="button">Cancel</button><button className="rounded-lg bg-cyanbrand-500 px-5 py-2.5 text-sm font-extrabold text-navy-950 disabled:opacity-60" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </div>
  );
}
