import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchOrganizations, createOrganization } from '../api/orgs';
import type { Organization } from '../api/orgs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Organizations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const { data: orgs, isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  });

  const createMutation = useMutation({
    mutationFn: () => createOrganization(newOrgName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setNewOrgName('');
      setShowCreate(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to create organization');
    }
  });

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ADMIN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEMBER: 'bg-green-500/10 text-green-400 border-green-500/20',
    VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Organizations</h1>
        <Button 
          className="bg-primary-600 hover:bg-primary-500"
          onClick={() => setShowCreate(true)}
        >
          + Create Organization
        </Button>
      </div>

      {/* Create Organization Modal */}
      {showCreate && (
        <Card className="glass border-primary-500/30">
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-300 block mb-2">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g., My Team"
                  className="w-full px-4 py-3 rounded-lg bg-bg-color border border-border-color text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  onKeyDown={(e) => e.key === 'Enter' && newOrgName.trim() && createMutation.mutate()}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
                disabled={!newOrgName.trim()}
                className="bg-primary-600 hover:bg-primary-500"
              >
                Create
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="text-gray-400">Loading organizations...</div>
      ) : !orgs || orgs.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-400">You're not part of any organization yet.</p>
            <p className="text-gray-500 text-sm mt-1">Create one to start collaborating with your team!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map(org => (
            <Card 
              key={org.id} 
              className="glass hover:border-primary-500/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/org/${org.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded border ${roleColors[org.role] || roleColors.MEMBER}`}>
                    {org.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>👥 {org.memberCount} members</span>
                  <span>📦 {org.repoCount} repos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
