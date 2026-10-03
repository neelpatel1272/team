// Populates the database with demo users, a couple of conversations, a
// team, and some messages so the UI isn't empty on first launch.
//
// Usage:
//   cd server
//   npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ConversationMember = require('../models/ConversationMember');
const Message = require('../models/Message');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const { CONVERSATION_TYPE, MEMBER_ROLE, PRESENCE_STATUS } = require('../config/constants');

const DEMO_USERS = [
  { firstName: 'John', lastName: 'Smith', email: 'john@workwave.demo', department: 'Engineering', jobTitle: 'Senior Engineer', employeeId: 'EMP-001' },
  { firstName: 'Sarah', lastName: 'Patel', email: 'sarah@workwave.demo', department: 'Marketing', jobTitle: 'Marketing Manager', employeeId: 'EMP-002' },
  { firstName: 'Michael', lastName: 'Brown', email: 'michael@workwave.demo', department: 'Sales', jobTitle: 'Sales Lead', employeeId: 'EMP-003' },
  { firstName: 'Emily', lastName: 'Wilson', email: 'emily@workwave.demo', department: 'HR', jobTitle: 'HR Specialist', employeeId: 'EMP-004' },
  { firstName: 'David', lastName: 'Miller', email: 'david@workwave.demo', department: 'Design', jobTitle: 'Product Designer', employeeId: 'EMP-005' },
  { firstName: 'Jessica', lastName: 'Taylor', email: 'jessica@workwave.demo', department: 'Management', jobTitle: 'Operations Director', employeeId: 'EMP-006' },
];

const DEMO_PASSWORD = 'Password123!';

async function seed(options = {}) {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  console.log('[seed] Connected. Clearing existing demo collections...');

  await Promise.all([
    User.deleteMany({ email: { $regex: '@workwave.demo$' } }),
    Conversation.deleteMany({}),
    ConversationMember.deleteMany({}),
    Message.deleteMany({}),
    Team.deleteMany({}),
    TeamMember.deleteMany({}),
  ]);

  console.log('[seed] Creating demo users...');
  const users = [];
  for (const u of DEMO_USERS) {
    const user = await User.create({ ...u, password: DEMO_PASSWORD, status: PRESENCE_STATUS.OFFLINE });
    users.push(user);
  }
  const [john, sarah, michael, emily, david, jessica] = users;

  console.log('[seed] Creating a direct conversation (John <-> Sarah) with messages...');
  const directConvo = await Conversation.create({ type: CONVERSATION_TYPE.DIRECT, createdBy: john._id });
  await ConversationMember.create([
    { conversation: directConvo._id, user: john._id, role: MEMBER_ROLE.MEMBER },
    { conversation: directConvo._id, user: sarah._id, role: MEMBER_ROLE.MEMBER },
  ]);

  const directMessages = [
    { sender: sarah._id, content: 'Hey John! Did you get a chance to look at the project report?' },
    { sender: john._id, content: 'Just opened it — looks great so far.' },
    { sender: sarah._id, content: 'Awesome, let me know if anything needs changes before Friday.' },
    { sender: john._id, content: 'Will do. The project deadline is 30 September right?' },
    { sender: sarah._id, content: "Yep, and we have a meeting Friday 4:00 PM to review it." },
  ];
  let lastMsg = null;
  for (const m of directMessages) {
    lastMsg = await Message.create({
      conversation: directConvo._id,
      sender: m.sender,
      content: m.content,
      deliveredTo: [m.sender],
      readBy: [{ user: m.sender, readAt: new Date() }],
    });
  }
  directConvo.lastMessage = lastMsg._id;
  directConvo.lastMessageAt = new Date();
  await directConvo.save();

  console.log('[seed] Creating a group conversation (Design Team)...');
  const groupConvo = await Conversation.create({
    type: CONVERSATION_TYPE.GROUP,
    name: 'Design Team',
    description: 'All things product design',
    createdBy: david._id,
  });
  await ConversationMember.create([
    { conversation: groupConvo._id, user: david._id, role: MEMBER_ROLE.OWNER },
    { conversation: groupConvo._id, user: emily._id, role: MEMBER_ROLE.MEMBER },
    { conversation: groupConvo._id, user: jessica._id, role: MEMBER_ROLE.MEMBER },
  ]);
  const groupMsg = await Message.create({
    conversation: groupConvo._id,
    sender: david._id,
    content: 'Welcome to the Design Team space! Drop your mockups here.',
    deliveredTo: [david._id],
    readBy: [{ user: david._id, readAt: new Date() }],
  });
  groupConvo.lastMessage = groupMsg._id;
  groupConvo.lastMessageAt = new Date();
  await groupConvo.save();

  console.log('[seed] Creating department teams...');
  const departments = ['Engineering', 'Marketing', 'HR', 'Sales', 'Design'];
  for (const dept of departments) {
    const teamConvo = await Conversation.create({ type: CONVERSATION_TYPE.TEAM, name: dept, createdBy: john._id });
    const team = await Team.create({ name: dept, description: `${dept} department space`, conversation: teamConvo._id, createdBy: john._id });
    teamConvo.team = team._id;
    await teamConvo.save();

    const deptUsers = users.filter((u) => u.department === dept);
    const membersToAdd = deptUsers.length ? deptUsers : [john];
    await TeamMember.create(membersToAdd.map((u) => ({ team: team._id, user: u._id, role: MEMBER_ROLE.MEMBER })));
    await ConversationMember.create(membersToAdd.map((u) => ({ conversation: teamConvo._id, user: u._id, role: MEMBER_ROLE.MEMBER })));
  }

  console.log('\n[seed] Done! Demo accounts (all use the same password):');
  DEMO_USERS.forEach((u) => console.log(`  - ${u.email}`));
  console.log(`  Password: ${DEMO_PASSWORD}\n`);

  if (options && options.disconnectOnEnd === false) {
    return;
  }

  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = { seed, DEMO_USERS, DEMO_PASSWORD };
