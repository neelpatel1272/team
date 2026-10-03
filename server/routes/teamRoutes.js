const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { listTeams, createTeam, getTeam, addTeamMembers, removeTeamMember, deleteTeam } = require('../controllers/teamController');

router.use(protect);

router.get('/', listTeams);
router.post('/', createTeam);
router.get('/:id', getTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', addTeamMembers);
router.delete('/:id/members/:userId', removeTeamMember);

module.exports = router;
