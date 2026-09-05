import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 50_000
});

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1h'
}));

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 4;
const LOBBY_MS = 4_500;
const COUNTDOWN_MS = 3_000;
const INTERMISSION_MS = 6_500;
const PHASE_DISTANCE = 3_300;
const PHASE_TIMEOUT_MS = 42_000;
const RECONNECT_GRACE_MS = 15_000;
const MAX_SERVER_SPEED = 440;

const rooms = new Map();
const playerTokens = new Map(); // token -> { roomId, player }

const BLOCKED_WORDS = [
  'merda', 'porra', 'caralho', 'puta', 'puto', 'foder', 'foda', 'cuzao', 'cuzão',
  'buceta', 'pinto', 'piroca', 'sexo', 'nazista', 'hitler'
];

function normalizeForFilter(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cleanName(raw) {
  const text = String(raw ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  let safe = text.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 14).trim();
  const filtered = normalizeForFilter(safe);
  if (!safe || BLOCKED_WORDS.some(word => filtered.includes(normalizeForFilter(word)))) {
    safe = `Piloto ${Math.floor(100 + Math.random() * 900)}`;
  }
  return safe;
}

function makeRoom() {
  const id = crypto.randomBytes(3).toString('hex').toUpperCase();
  const room = {
    id,
    phase: 1,
    state: 'lobby',
    seed: crypto.randomBytes(4).readUInt32LE(0),
    startAt: null,
    finishCounter: 0,
    players: new Map(), // token -> player
    lobbyTimer: null,
    phaseTimer: null,
    phaseTimeout: null
  };
  rooms.set(id, room);
  return room;
}

function findRoom() {
  for (const room of rooms.values()) {
    if (room.state === 'lobby' && room.players.size < MAX_PLAYERS) return room;
  }
  return makeRoom();
}

function publicPlayer(player) {
  return {
    id: player.token,
    name: player.name,
    distance: player.distance,
    lane: player.lane,
    airborne: player.airborne,
    crouching: player.crouching,
    finished: player.finished,
    finishRank: player.finishRank,
    connected: player.connected,
    bikeId: player.bikeId
  };
}

function publicRoom(room) {
  return {
    roomId: room.id,
    phase: room.phase,
    state: room.state,
    seed: room.seed,
    startAt: room.startAt,
    phaseDistance: PHASE_DISTANCE,
    players: [...room.players.values()].map(publicPlayer)
  };
}

function emitRoom(room) {
  io.to(room.id).emit('roomState', publicRoom(room));
}

function clearRoomTimers(room) {
  for (const key of ['lobbyTimer', 'phaseTimer', 'phaseTimeout']) {
    if (room[key]) clearTimeout(room[key]);
    room[key] = null;
  }
}

function resetPlayersForPhase(room) {
  room.finishCounter = 0;
  for (const p of room.players.values()) {
    p.distance = 0;
    p.lane = 1;
    p.airborne = false;
    p.crouching = false;
    p.finished = false;
    p.finishRank = null;
    p.lastUpdateAt = Date.now();
  }
}

function startRunning(room) {
  const activeCount = [...room.players.values()].filter(p => p.connected).length;
  if (!rooms.has(room.id) || activeCount === 0) return;
  room.state = 'running';
  emitRoom(room);
  room.phaseTimeout = setTimeout(() => {
    if (!rooms.has(room.id) || room.state !== 'running') return;
    for (const p of room.players.values()) {
      if (!p.finished) {
        room.finishCounter += 1;
        p.finished = true;
        p.finishRank = room.finishCounter;
        p.distance = Math.max(p.distance, PHASE_DISTANCE - 1);
      }
    }
    emitRoom(room);
    nextPhase(room);
  }, PHASE_TIMEOUT_MS);
}

function startRoom(room) {
  const activeCount = [...room.players.values()].filter(p => p.connected).length;
  if (room.state !== 'lobby' || activeCount === 0) return;
  if (room.lobbyTimer) clearTimeout(room.lobbyTimer);
  room.lobbyTimer = null;
  resetPlayersForPhase(room);
  room.state = 'countdown';
  room.startAt = Date.now() + COUNTDOWN_MS;
  emitRoom(room);
  room.phaseTimer = setTimeout(() => startRunning(room), COUNTDOWN_MS);
}

function scheduleStart(room) {
  if (room.lobbyTimer) return;
  room.lobbyTimer = setTimeout(() => startRoom(room), LOBBY_MS);
}

function nextPhase(room) {
  if (!rooms.has(room.id)) return;
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
  room.phaseTimer = null;
  room.phaseTimeout = null;
  room.state = 'intermission';
  emitRoom(room);

  room.phaseTimer = setTimeout(() => {
    if (!rooms.has(room.id) || room.players.size === 0) return;
    room.phase += 1;
    room.seed = crypto.randomBytes(4).readUInt32LE(0);
    resetPlayersForPhase(room);
    room.state = 'countdown';
    room.startAt = Date.now() + COUNTDOWN_MS;
    emitRoom(room);
    room.phaseTimer = setTimeout(() => startRunning(room), COUNTDOWN_MS);
  }, INTERMISSION_MS);
}

function maybeAdvance(room) {
  if (room.state !== 'running') return;
  const relevant = [...room.players.values()].filter(p => p.connected || p.finished);
  if (relevant.length && relevant.every(p => p.finished)) nextPhase(room);
}

function cleanupRoom(room) {
  const connected = [...room.players.values()].some(p => p.connected);
  if (connected || room.players.size > 0) return;
  clearRoomTimers(room);
  rooms.delete(room.id);
}

function scheduleDisconnectedRemoval(room, player) {
  if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
  player.disconnectTimer = setTimeout(() => {
    const currentRoom = rooms.get(room.id);
    const currentPlayer = currentRoom?.players.get(player.token);
    if (!currentRoom || !currentPlayer || currentPlayer.connected) return;
    currentRoom.players.delete(player.token);
    playerTokens.delete(player.token);
    emitRoom(currentRoom);
    if (currentRoom.players.size === 0) {
      clearRoomTimers(currentRoom);
      rooms.delete(currentRoom.id);
    } else {
      maybeAdvance(currentRoom);
    }
  }, RECONNECT_GRACE_MS);
}

app.get('/health', (_req, res) => {
  const players = [...rooms.values()].reduce((sum, room) => sum + room.players.size, 0);
  res.json({ ok: true, rooms: rooms.size, players });
});

io.on('connection', socket => {
  socket.on('joinGame', payload => {
    if (socket.data.playerToken) return;

    const resumeToken = String(payload?.resumeToken || '');
    const existing = playerTokens.get(resumeToken);
    if (existing) {
      const room = rooms.get(existing.roomId);
      const player = room?.players.get(resumeToken);
      if (room && player && !player.connected) {
        if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
        player.connected = true;
        player.socketId = socket.id;
        socket.data.playerToken = player.token;
        socket.data.roomId = room.id;
        socket.join(room.id);
        socket.emit('joined', {
          playerId: player.token,
          playerToken: player.token,
          roomId: room.id,
          resumed: true
        });
        emitRoom(room);
        return;
      }
    }

    const room = findRoom();
    const token = crypto.randomBytes(12).toString('hex');
    const player = {
      token,
      socketId: socket.id,
      name: cleanName(payload?.name),
      bikeId: 'trail50',
      distance: 0,
      lane: room.players.size % 3,
      airborne: false,
      crouching: false,
      finished: false,
      finishRank: null,
      connected: true,
      lastUpdateAt: Date.now(),
      disconnectTimer: null
    };

    room.players.set(token, player);
    playerTokens.set(token, { roomId: room.id, player });
    socket.data.playerToken = token;
    socket.data.roomId = room.id;
    socket.join(room.id);
    socket.emit('joined', {
      playerId: token,
      playerToken: token,
      roomId: room.id,
      resumed: false
    });
    emitRoom(room);
    scheduleStart(room);

    const activeCount = [...room.players.values()].filter(p => p.connected).length;
    if (activeCount >= MAX_PLAYERS && room.state === 'lobby') startRoom(room);
  });

  socket.on('setBike', payload => {
    const room = rooms.get(socket.data.roomId);
    const player = room?.players.get(socket.data.playerToken);
    if (!room || !player) return;
    const bikeId = String(payload?.bikeId || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 24);
    if (!bikeId) return;
    player.bikeId = bikeId;
    emitRoom(room);
  });

  socket.on('playerState', payload => {
    const room = rooms.get(socket.data.roomId);
    const player = room?.players.get(socket.data.playerToken);
    if (!room || !player || room.state !== 'running' || player.finished || !player.connected) return;

    const now = Date.now();
    const elapsedMs = Math.max(1, now - player.lastUpdateAt);
    if (elapsedMs < 55) return;
    player.lastUpdateAt = now;

    const distance = Number(payload?.distance);
    const laneRaw = Number(payload?.lane);
    const lane = Number.isFinite(laneRaw) ? Math.max(0, Math.min(2, Math.trunc(laneRaw))) : player.lane;

    if (Number.isFinite(distance)) {
      const allowedAdvance = MAX_SERVER_SPEED * Math.min(elapsedMs, 1_000) / 1_000 + 45;
      const maxDistance = Math.min(PHASE_DISTANCE, player.distance + allowedAdvance);
      player.distance = Math.max(player.distance, Math.min(distance, maxDistance));
    }
    player.lane = lane;
    player.airborne = Boolean(payload?.airborne);
    player.crouching = Boolean(payload?.crouching);

    socket.to(room.id).emit('playerUpdate', publicPlayer(player));
  });

  socket.on('finishPhase', () => {
    const room = rooms.get(socket.data.roomId);
    const player = room?.players.get(socket.data.playerToken);
    if (!room || !player || room.state !== 'running' || player.finished) return;
    if (player.distance < PHASE_DISTANCE - 90) return;

    room.finishCounter += 1;
    player.finished = true;
    player.finishRank = room.finishCounter;
    player.distance = PHASE_DISTANCE;
    emitRoom(room);
    maybeAdvance(room);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomId);
    const player = room?.players.get(socket.data.playerToken);
    if (!room || !player) return;
    player.connected = false;
    player.socketId = null;
    player.crouching = false;
    player.airborne = false;
    emitRoom(room);
    scheduleDisconnectedRemoval(room, player);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Moto Trilhas Beta rodando em http://localhost:${PORT}`);
});
