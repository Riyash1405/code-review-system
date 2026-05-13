import { Router } from 'express';
import {
  createOrganization,
  listOrganizations,
  getOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
  addRepoToOrg,
} from '../controllers/org.controller.js';
import { validate } from '../middleware/validate.js';
import { createOrgSchema, inviteMemberSchema, updateMemberRoleSchema, addRepoToOrgSchema } from '../schemas/org.schema.js';

const router = Router();

router.post('/', validate(createOrgSchema), createOrganization);
router.get('/', listOrganizations);
router.get('/:orgId', getOrganization);
router.post('/:orgId/members', validate(inviteMemberSchema), inviteMember);
router.put('/:orgId/members/:memberId', validate(updateMemberRoleSchema), updateMemberRole);
router.delete('/:orgId/members/:memberId', removeMember);
router.post('/:orgId/repos', validate(addRepoToOrgSchema), addRepoToOrg);

export default router;
