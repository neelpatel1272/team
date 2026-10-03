const Call = require('../models/Call');
const { ok } = require('../utils/apiResponse');

async function getCallHistory(req, res, next) {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user._id }, { callee: req.user._id }],
    })
      .populate('caller', 'firstName lastName profileImage')
      .populate('callee', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(100);

    const withDirection = calls.map((call) => {
      const callerId = String(call.caller?._id || call.caller || '');
      const isCaller = callerId === String(req.user._id);
      let status = call.status;
      // If a call was left in ringing state for > 45s, treat as missed
      if (status === 'ringing' && Date.now() - new Date(call.createdAt).getTime() > 45000) {
        status = 'missed';
      }
      return {
        ...call.toObject(),
        status,
        direction: isCaller ? 'outgoing' : 'incoming',
      };
    });

    return ok(res, { calls: withDirection });
  } catch (err) {
    next(err);
  }
}

// Returns STUN/TURN server config for the frontend's RTCPeerConnection.
// Credentials live only in server env vars — never hardcoded in client source.
async function getIceServers(req, res) {
  const iceServers = [];

  (process.env.STUN_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((url) => iceServers.push({ urls: url }));

  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }

  return ok(res, { iceServers });
}

module.exports = { getCallHistory, getIceServers };
