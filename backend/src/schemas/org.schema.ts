import { z } from 'zod';
import { MemberRole } from '../generated/prisma/index.js';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters.'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username or email is required'),
    role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER),
  }),
  params: z.object({
    orgId: z.string().min(1, 'Organization ID is required'),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(MemberRole),
  }),
  params: z.object({
    orgId: z.string().min(1, 'Organization ID is required'),
    memberId: z.string().min(1, 'Member ID is required'),
  }),
});

export const addRepoToOrgSchema = z.object({
  body: z.object({
    repositoryId: z.string().min(1, 'Repository ID is required'),
  }),
  params: z.object({
    orgId: z.string().min(1, 'Organization ID is required'),
  }),
});
