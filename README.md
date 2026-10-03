# WorkWave — Connect. Collaborate. Communicate.

WorkWave is a real-time office communication app in the spirit of Slack / Microsoft Teams / WhatsApp Web: instant messaging, file sharing, one-to-one audio/video calls, screen sharing, group chats, team spaces, presence, typing indicators, read receipts, reactions, notifications, and search.

It's a full MERN-ish stack (**M**ongoDB, **E**xpress, **R**eact, **N**ode) with **Socket.IO** for real-time events and **WebRTC** for peer-to-peer audio/video.

> **Real-time is real.** There is no `setTimeout`-simulated chat, no fake presence, and no simulated calls. Messages are persisted in MongoDB and delivered over live Socket.IO connections; calls are negotiated with real WebRTC `RTCPeerConnection`s, with Socket.IO used only to exchange SDP/ICE signaling.

---

## 1. Requirements

| Tool | Version |
|---|---|
| Node.js | 18.x or 20.x LTS (uses native `fetch`-free APIs, no special ESM requirements) |
| npm | 9+ (ships with Node 18/20) |
| MongoDB | 6.x or 7.x, running locally or a connection string to Atlas |

You'll also want **two browser windows** (or one normal + one incognito window, or two different browsers) to properly test real-time chat and calls between two accounts.

---

## 2. Project structure

```
office-chat/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # Reusable UI building blocks
│       ├── pages/        # Route-level pages
│       ├── layouts/      # Auth layout / main app shell
│       ├── contexts/     # Auth, Socket, Theme, Toast, Call
│       ├── hooks/        # useWebRTC
│       ├── services/     # api.js (axios), socket.js
│       └── styles/       # SCSS variables + global styles
│
├── server/               # Node + Express + Socket.IO backend
│   ├── config/           # DB connection, shared enums/constants
│   ├── models/           # Mongoose schemas
│   ├── controllers/      # Route handlers
│   ├── routes/           # Express routers
│   ├── middleware/       # auth, upload (multer), error handler
│   ├── sockets/          # Socket.IO event handlers (presence, messages, calls)
│   ├── services/         # Shared business logic (messageService)
│   ├── seed/             # Demo data seed script
│   └── uploads/          # Local file storage (images/videos/documents/audio/other)
│
├── .env.example          # Root-level reference (see server/.env.example)
└── README.md
```

---

## 3. MongoDB setup

**Option A — Local MongoDB**

Install MongoDB Community Edition and start it:

```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

Confirm it's running on `mongodb://127.0.0.1:27017`.

**Option B — MongoDB Atlas (cloud, free tier)**

1. Create a free cluster at https://www.mongodb.com/atlas
2. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/workwave`)
3. Use that as `MONGO_URI` in `server/.env` (see below)

---

## 4. Installation

From the project root:

```bash
cd server
npm install
```

```bash
cd client
npm install
```

(Or from the repo root, if you keep the convenience `package.json`: `npm run install:all`.)

---

## 5. Environment variables

**Backend** — copy the example and fill in values:

```bash
cd server
cp .env.example .env
```

```
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/workwave

JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

MAX_FILE_SIZE_MB=25
UPLOAD_DIR=uploads

# STUN is free and public; TURN needs a provider (see section 15)
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Frontend** — copy the example:

```bash
cd client
cp .env.example .env
```

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=WorkWave
```

---

## 6. Backend setup & seed data

Populate the database with demo users, departments, and sample conversations so the UI isn't empty:

```bash
cd server
npm run seed
```

This creates 6 demo accounts (all use the password `Password123!`):

| Name | Email | Department |
|---|---|---|
| John Smith | john@workwave.demo | Engineering |
| Sarah Patel | sarah@workwave.demo | Marketing |
| Michael Brown | michael@workwave.demo | Sales |
| Emily Wilson | emily@workwave.demo | HR |
| David Miller | david@workwave.demo | Design |
| Jessica Taylor | jessica@workwave.demo | Management |

It also creates a direct conversation (John ↔ Sarah) with sample messages, a "Design Team" group, and one team space per department.

---

## 7. Running the application

**Terminal 1 — backend:**

```bash
cd server
npm run dev
```

You should see:

```
[db] MongoDB connected -> 127.0.0.1/workwave
[server] WorkWave API listening on http://localhost:5000
[server] Accepting client connections from http://localhost:5173
```

**Terminal 2 — frontend:**

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 8. How to test real-time chat (two browser windows)

1. Open `http://localhost:5173` in **Browser A**, log in as `john@workwave.demo`.
2. Open `http://localhost:5173` in **Browser B** (a different browser, or an incognito/private window — cookies/localStorage are per-browser-profile, not per-tab, so two tabs of the same browser will share the same logged-in session), log in as `sarah@workwave.demo`.
3. In Browser A, open the John ↔ Sarah conversation (seeded, or start a new one via the search/new-conversation button).
4. Type "Hello Sarah" in Browser A and hit Enter.
5. **Expected:** the message appears instantly in Browser B without a page refresh, along with a typing indicator while composing and a notification badge.
6. Click into the message thread in Browser B — the read receipt (✓✓) should update to blue/"read" in Browser A in real time.

---

## 9. How to test audio calls

1. With both browsers logged in and both users online (green dot), open the direct conversation in Browser A.
2. Click the 🎧 phone icon in the chat header.
3. **Expected:** Browser B shows an incoming-call toast with Accept/Decline.
4. Click **Accept** in Browser B.
5. **Expected:** both windows transition to the in-call UI; you should hear audio from one microphone in the other window (use headphones to avoid feedback/echo when testing on one machine).
6. Test **mute/unmute** in either window and confirm the other side stops/resumes hearing audio.
7. Click **End call** in either window — both windows should return to the chat view, and a call-history entry should appear on the Calls page for both users.

---

## 10. How to test video calls

Same as above, but click the 📹 video icon instead of the phone icon.

- **Expected:** each browser shows the remote user's video full-screen and its own camera preview in a small corner window.
- Test **camera on/off** toggling.
- Grant camera/microphone permissions when your browser prompts you — if you previously denied permissions, you'll need to reset site permissions in your browser settings.

---

## 11. How to test file uploads

1. In an open conversation, click the 📎 attachment icon.
2. Choose **Photos**, **Documents**, or another category and select a file (or drag-and-drop a file directly onto the message composer).
3. **Expected:** an upload progress bar appears, then the file renders as an image thumbnail, video player, or file card (with Open/Download buttons) depending on type.
4. Confirm the file also appears in that conversation's **Shared Files** panel (folder icon in the chat header) and on the global **Files** page.

---

## 12. How to test screen sharing

1. Start a **video** call between the two browsers.
2. In either call window, click the screen-share icon.
3. Choose a window/screen/tab to share from your OS's picker.
4. **Expected:** the other participant's "remote video" now shows your shared screen instead of your camera; a "Sharing your screen" label appears under your name.
5. Click the screen-share icon again (or use your browser's native "Stop sharing" bar) to revert to your camera feed.

---

## 13. How to test with two browser windows (summary checklist)

- [ ] Text message delivery (instant, no refresh)
- [ ] Typing indicator appears/disappears correctly
- [ ] Read receipts progress: sent → delivered → read
- [ ] Presence updates (online → away/offline) reflect within a second or two
- [ ] Reactions sync in both windows
- [ ] Edit/delete a message and confirm it updates live in the other window
- [ ] Reply-to and jump-to-original works
- [ ] Pin/unpin a message and see it in the Pinned Messages panel
- [ ] Audio call: ring → accept → hear audio → mute → end
- [ ] Video call: ring → accept → see video → toggle camera → end
- [ ] Screen share start/stop mid-call
- [ ] File upload (image, PDF, video) with progress and preview
- [ ] Voice message record → send → playback
- [ ] Group chat: create a group, add/remove members, send messages
- [ ] Reconnect: kill the backend (Ctrl+C), confirm the client shows "🔴 Offline", restart the backend, confirm it shows "🟢 Connected" and resumes working

---

## 14. STUN/TURN configuration

WebRTC needs STUN to discover public IP/port mappings, and **TURN** to relay media when a direct peer-to-peer connection isn't possible (common with strict corporate firewalls, symmetric NATs, or mobile carrier networks). Google's public STUN servers are wired up by default and are enough for most same-network/local testing.

For **reliable calls across arbitrary real-world networks**, you need TURN. Options:

- **Managed providers** (fastest to set up): [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn), [Xirsys](https://xirsys.com/), [Metered TURN](https://www.metered.ca/tools/openrelay/)
- **Self-hosted**: [coturn](https://github.com/coturn/coturn) is the standard open-source TURN server

Once you have credentials, set them in `server/.env`:

```
TURN_URL=turn:your-turn-host:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-credential
```

The backend exposes these via `GET /api/calls/ice-servers` (authenticated) so the frontend never hardcodes or bundles TURN credentials in client source code — they're fetched fresh from the server for each call.

---

## 15. Production deployment

**Backend**

1. Set `NODE_ENV=production` and a strong, unique `JWT_SECRET`.
2. Point `MONGO_URI` at a managed MongoDB instance (Atlas, or self-hosted with auth enabled).
3. Set `CLIENT_URL` to your deployed frontend's origin (for CORS + Socket.IO).
4. Put the Node process behind a reverse proxy (Nginx/Caddy) that terminates TLS and proxies both HTTP and WebSocket upgrade requests to the Node port.
5. Swap local disk storage for a cloud object store when you outgrow a single server — the `middleware/upload.js` + `Attachment` model are intentionally decoupled from the rest of the chat logic so you can point them at **AWS S3**, **Cloudinary**, or **Cloudflare R2** by changing only the storage layer, not the message/attachment schema or API contracts.
6. Run behind a process manager (`pm2`, systemd, or a container orchestrator) and enable log rotation.
7. Set real TURN credentials (section 14) — calls will fail intermittently in production without them.

**Frontend**

1. `npm run build` in `client/` produces a static `dist/` folder.
2. Serve it via any static host (Nginx, Vercel, Netlify, S3+CloudFront) with `VITE_API_URL` / `VITE_SOCKET_URL` pointed at your production backend origin (set at build time).
3. Make sure your backend's CORS + Socket.IO CORS config (`CLIENT_URL`) matches your deployed frontend origin exactly (including protocol/port).

**Scaling real-time**

- The current call architecture is a direct peer-to-peer WebRTC mesh, which is correct and efficient for 1:1 calls but does **not** scale to group video calls (each additional participant multiplies each browser's upload bandwidth). The codebase separates signaling (`sockets/callSocket.js`) from the peer connection logic (`hooks/useWebRTC.js`) specifically so that group calls can later be added by introducing an **SFU** (e.g. [LiveKit](https://livekit.io/) or [mediasoup](https://mediasoup.org/)) behind the same signaling events, without needing to rewrite the chat/messaging layer.
- If you run more than one Node process/instance behind a load balancer, add the [`socket.io-redis` adapter](https://socket.io/docs/v4/redis-adapter/) so Socket.IO events broadcast correctly across instances.

---

## 16. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `MongoDB connection error` on server start | MongoDB isn't running, or `MONGO_URI` is wrong. Confirm `mongod` is running locally, or that your Atlas IP allowlist includes your current IP. |
| Client shows "🔴 Offline" permanently | Backend isn't running, or `VITE_SOCKET_URL` doesn't match where the backend is listening. Check the browser console for the Socket.IO connection error. |
| CORS errors in the browser console | `CLIENT_URL` in `server/.env` doesn't exactly match the origin the frontend is served from (protocol + host + port all matter). |
| Login works but messages don't send | Check the backend terminal for Socket.IO auth errors — the token may be missing/expired. Try logging out and back in. |
| Calls ring but never connect | Almost always a TURN issue — see section 14. Test on the same local network first to isolate whether it's a NAT traversal problem. |
| "Microphone/Camera permission is required" | The browser blocked media access. Check the site's permissions (usually via the padlock icon in the address bar) and reload. |
| File upload fails with 413 | The file exceeds `MAX_FILE_SIZE_MB` (default 25MB). Increase it in `server/.env` if needed. |
| `EADDRINUSE` on server start | Port 5000 is already in use — stop the other process or change `PORT` in `server/.env` (and `VITE_API_URL`/`VITE_SOCKET_URL` in `client/.env` to match). |
| Seed script errors about duplicate emails | You've already seeded; the script clears `@workwave.demo` accounts and reseeds automatically. If it still fails, drop the `workwave` database and try again. |

---

## 17. Notes on scope & honesty about limitations

This is a genuinely functional implementation, not a static mockup — real Socket.IO events, a real MongoDB-backed API, and real WebRTC peer connections. That said, a couple of things are intentionally left as documented extension points rather than fully built out, so you know exactly what you're getting:

- **Group video calls** use the same signaling architecture as 1:1 calls, but only 1:1 is wired end-to-end in the UI (see section 15 on adding an SFU for group calls).
- **Password reset emails** are logged to the server console in development (see `authController.js`) rather than sent via a real transactional email provider — wire up your provider of choice (SendGrid, Postmark, SES, etc.) in `authController.forgotPassword` for production use.
- **GIF picker** is not wired to a third-party GIF API (e.g. Giphy/Tenor) out of the box, since that requires your own API key — the message pipeline already supports arbitrary image attachments, so a GIF is just an image attachment.
- **@mentions** are fully modeled end-to-end (the `Message.mentions` field, mention-aware notifications, and `@john` / `@everyone` / `@team` parsing conventions are all supported server-side), but the composer doesn't yet include an `@`-autocomplete dropdown UI — `mentions` is currently sent as an empty array from the client. Wiring up an autocomplete popover in `MessageComposer.jsx` that resolves `@name` to a user ID as the user types is a natural next step.

Everything else in the spec — auth, presence, 1:1 and group chat, typing indicators, read receipts, reactions, reply/edit/delete/forward/pin, file uploads with previews, voice messages, 1:1 audio/video calls, screen sharing, team spaces, notifications, global search, call history, dashboard, responsive layout, and dark/light mode — is implemented and live-wired between client and server.
