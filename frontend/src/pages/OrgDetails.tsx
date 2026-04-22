import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrgDetails, inviteOrgMember, updateMemberRole, removeMember } from '../api/orgs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ADMIN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MEMBER: 'bg-green-500/10 text-green-400 border-green-500/20',
  VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const OrgDetails: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const { data, isLoading, error } = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => fetchOrgDetails(orgId!),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteOrgMember(orgId!, inviteUsername, inviteRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', orgId] });
      setInviteUsername('');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to invite member'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(orgId!, memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', orgId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(orgId!, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', orgId] }),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading organization...</div>;
  if (error || !data) return <div className="p-6 text-red-400">Failed to load organization.</div>;

  const { organization, currentRole } = data;
  const canManage = ['OWNER', 'ADMIN'].includes(currentRole);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/organizations')} className="mb-4">
        &larr; Back to Organizations
      </Button>

      <h1 className="text-3xl font-bold text-white">{organization.name}</h1>

      {/* Members Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Members ({organization.members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Form (OWNER/ADMIN only) */}
          {canManage && (
            <div className="flex gap-3 items-end p-4 bg-surface-color rounded-lg border border-border-color">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter GitHub username"
                  className="w-full px-3 py-2 rounded-lg bg-bg-color border border-border-color text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-bg-color border border-border-color text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  {ROLES.filter(r => r !== 'OWNER').map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={() => inviteMutation.mutate()}
                isLoading={inviteMutation.isPending}
                disabled={!inviteUsername.trim()}
                className="bg-primary-600 hover:bg-primary-500"
              >
                Invite
              </Button>
            </div>
          )}

          {/* Member List */}
          <div className="space-y-3">
            {organization.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-surface-color rounded-lg border border-border-color">
                <div className="flex items-center gap-3">
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-bold">
                      {m.user.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{m.user.displayName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && m.role !== 'OWNER' ? (
                    <select
                      value={m.role}
                      onChange={(e) => roleMutation.mutate({ memberId: m.id, role: e.target.value })}
                      className="px-2 py-1 rounded bg-bg-color border border-border-color text-white text-xs"
                    >
                      {ROLES.filter(r => r !== 'OWNER').map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded border ${roleColors[m.role]}`}>{m.role}</span>
                  )}
                  {canManage && m.role !== 'OWNER' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${m.user.displayName}?`)) removeMutation.mutate(m.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shared Repositories */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Shared Repositories ({organization.repositories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organization.repositories.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed border-border-color rounded-xl">
              No repositories shared with this organization yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organization.repositories.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 bg-surface-color rounded-lg border border-border-color hover:border-primary-500/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/repo/${r.repository.fullName}`)}
                >
                  <div className="font-medium text-white">{r.repository.fullName}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
