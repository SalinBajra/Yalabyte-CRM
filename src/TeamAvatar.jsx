function initials(name) {
  return String(name || 'Unassigned')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function findTeamMember(teamMembers, name) {
  const normalized = String(name || '').trim().toLowerCase();
  return teamMembers.find((member) => String(member.name || '').trim().toLowerCase() === normalized);
}

export default function TeamAvatar({ name, teamMembers = [], size = 'md', className = '' }) {
  const member = findTeamMember(teamMembers, name);
  const sizes = {
    sm: 'h-5 w-5 text-[8px]',
    md: 'h-8 w-8 text-[10px]',
    lg: 'h-10 w-10 text-xs'
  };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-extrabold text-slate-600 ring-1 ring-slate-200 ${sizes[size] || sizes.md} ${className}`} title={name || 'Unassigned'}>
      {member?.avatar_url ? <img className="h-full w-full object-cover" src={member.avatar_url} alt={member.name || ''} /> : initials(name) || '?'}
    </span>
  );
}
