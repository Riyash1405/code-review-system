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

const router = Router();

router.post('/', createOrganization);
router.get('/', listOrganizations);
router.get('/:orgId', getOrganization);
router.post('/:orgId/members', inviteMember);
router.put('/:orgId/members/:memberId', updateMemberRole);
router.delete('/:orgId/members/:memberId', removeMember);
router.post('/:orgId/repos', addRepoToOrg);

export default router;
