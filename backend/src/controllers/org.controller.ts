import { Request, Response } from 'express';
import db from '../config/db.js';
import { logger } from '../utils/logger.js';
import { MemberRole } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { UnauthorizedError, ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Create a new organization. The creator becomes OWNER.
 */
export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const { name } = req.body;

  try {
    const org = await db.organization.create({
      data: {
        name: name.trim(),
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          }
        }
      },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } }
      }
    });

    res.status(201).json({ organization: org });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('An organization with that name already exists.');
    }
    throw error;
  }
});

/**
 * List all organizations the current user belongs to.
 */
export const listOrganizations = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;

  const totalCount = await db.orgMember.count({
    where: { userId: user.id },
  });

  const memberships = await db.orgMember.findMany({
    where: { userId: user.id },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      organization: {
        include: {
          members: true,
          repositories: true,
        }
      }
    },
    orderBy: { joinedAt: 'desc' },
  });

  const organizations = memberships.map(m => ({
    ...m.organization,
    memberCount: m.organization.members.length,
    repoCount: m.organization.repositories.length,
    role: m.role,
  }));

  res.json({
    organizations,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
});

/**
 * Get a single organization's full details.
 */
export const getOrganization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const orgId = String(req.params.orgId);

  // Verify membership
  const membership = await db.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (!membership) throw new ForbiddenError('Not a member of this organization.');

  const organization = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        orderBy: { joinedAt: 'asc' }
      },
      repositories: {
        include: { repository: true }
      },
    },
  });

  if (!organization) throw new NotFoundError('Organization not found');

  res.json({ organization, currentRole: membership.role });
});

/**
 * Invite a member to the organization by GitHub username.
 */
export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const orgId = String(req.params.orgId);
  const { username, role = 'MEMBER' } = req.body;

  // Check caller has OWNER or ADMIN role
  const callerMembership = await db.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
    throw new ForbiddenError('Only OWNER or ADMIN can invite members.');
  }

  // Find user by email or by linked GitHub username
  let targetUser = await db.user.findFirst({ where: { email: username } });
  if (!targetUser) {
    // Try finding by GitHub username via linked accounts
    const ghAccount = await db.gitHubAccount.findFirst({ where: { username } });
    if (ghAccount) {
      targetUser = await db.user.findUnique({ where: { id: ghAccount.userId } });
    }
  }
  if (!targetUser) {
    throw new NotFoundError(`User "${username}" not found. They must sign up first.`);
  }

  try {
    const member = await db.orgMember.create({
      data: {
        userId: targetUser.id,
        organizationId: orgId,
        role: role as MemberRole,
      },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    res.status(201).json({ member });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('User is already a member of this organization.');
    }
    throw error;
  }
});

/**
 * Update a member's role.
 */
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const orgId = String(req.params.orgId);
  const memberId = String(req.params.memberId);
  const { role } = req.body;

  const callerMembership = await db.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
    throw new ForbiddenError('Only OWNER or ADMIN can change roles.');
  }

  const updated = await db.orgMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
  });

  res.json({ member: updated });
});

/**
 * Remove a member from the organization.
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const orgId = String(req.params.orgId);
  const memberId = String(req.params.memberId);

  const callerMembership = await db.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
    throw new ForbiddenError('Only OWNER or ADMIN can remove members.');
  }

  await db.orgMember.delete({ where: { id: memberId } });
  res.json({ message: 'Member removed successfully.' });
});

/**
 * Add a repository to the organization.
 */
export const addRepoToOrg = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const orgId = String(req.params.orgId);
  const { repositoryId } = req.body;

  const callerMembership = await db.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (!callerMembership || !['OWNER', 'ADMIN', 'MEMBER'].includes(callerMembership.role)) {
    throw new ForbiddenError('Insufficient permissions.');
  }

  try {
    const link = await db.orgRepository.create({
      data: { organizationId: orgId, repositoryId },
      include: { repository: true }
    });

    res.status(201).json({ link });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('Repository already added to this organization.');
    }
    throw error;
  }
});
