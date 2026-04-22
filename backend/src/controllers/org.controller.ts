import { Request, Response } from 'express';
import db from '../config/db.js';

/**
 * Create a new organization. The creator becomes OWNER.
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Organization name must be at least 2 characters.' });
    }

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
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An organization with that name already exists.' });
    }
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

/**
 * List all organizations the current user belongs to.
 */
export const listOrganizations = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const memberships = await db.orgMember.findMany({
      where: { userId: user.id },
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

    res.json({ organizations });
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
};

/**
 * Get a single organization's full details.
 */
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = String(req.params.orgId);

    // Verify membership
    const membership = await db.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this organization.' });

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

    res.json({ organization, currentRole: membership.role });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

/**
 * Invite a member to the organization by GitHub username.
 */
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = String(req.params.orgId);
    const { username, role = 'MEMBER' } = req.body;

    // Check caller has OWNER or ADMIN role
    const callerMembership = await db.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });
    if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can invite members.' });
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
      return res.status(404).json({ error: `User "${username}" not found. They must sign up first.` });
    }

    const member = await db.orgMember.create({
      data: {
        userId: targetUser.id,
        organizationId: orgId,
        role: role as any,
      },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    res.status(201).json({ member });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User is already a member of this organization.' });
    }
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
};

/**
 * Update a member's role.
 */
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = String(req.params.orgId);
    const memberId = String(req.params.memberId);
    const { role } = req.body;

    const callerMembership = await db.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });
    if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can change roles.' });
    }

    const updated = await db.orgMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    res.json({ member: updated });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

/**
 * Remove a member from the organization.
 */
export const removeMember = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = String(req.params.orgId);
    const memberId = String(req.params.memberId);

    const callerMembership = await db.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });
    if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
      return res.status(403).json({ error: 'Only OWNER or ADMIN can remove members.' });
    }

    await db.orgMember.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

/**
 * Add a repository to the organization.
 */
export const addRepoToOrg = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = String(req.params.orgId);
    const { repositoryId } = req.body;

    const callerMembership = await db.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
    });
    if (!callerMembership || !['OWNER', 'ADMIN', 'MEMBER'].includes(callerMembership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const link = await db.orgRepository.create({
      data: { organizationId: orgId, repositoryId },
      include: { repository: true }
    });

    res.status(201).json({ link });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Repository already added to this organization.' });
    }
    console.error('Error adding repo to org:', error);
    res.status(500).json({ error: 'Failed to add repository' });
  }
};
