import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('code_review_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Organization {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  repoCount: number;
  role: string;
  createdAt: string;
}

export interface OrgDetails {
  id: string;
  name: string;
  members: {
    id: string;
    role: string;
    user: { id: string; username: string; avatarUrl: string | null };
  }[];
  repositories: {
    id: string;
    repository: { id: string; name: string; fullName: string };
  }[];
}

export const fetchOrganizations = async (): Promise<Organization[]> => {
  const res = await api.get('/orgs');
  return res.data.organizations;
};

export const createOrganization = async (name: string) => {
  const res = await api.post('/orgs', { name });
  return res.data;
};

export const fetchOrgDetails = async (orgId: string) => {
  const res = await api.get(`/orgs/${orgId}`);
  return res.data;
};

export const inviteOrgMember = async (orgId: string, username: string, role: string = 'MEMBER') => {
  const res = await api.post(`/orgs/${orgId}/members`, { username, role });
  return res.data;
};

export const updateMemberRole = async (orgId: string, memberId: string, role: string) => {
  const res = await api.put(`/orgs/${orgId}/members/${memberId}`, { role });
  return res.data;
};

export const removeMember = async (orgId: string, memberId: string) => {
  const res = await api.delete(`/orgs/${orgId}/members/${memberId}`);
  return res.data;
};

export const addRepoToOrg = async (orgId: string, repositoryId: string) => {
  const res = await api.post(`/orgs/${orgId}/repos`, { repositoryId });
  return res.data;
};
