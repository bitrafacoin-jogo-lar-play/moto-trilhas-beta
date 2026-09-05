(() => {
  'use strict';

  const socket = io({ reconnection: true, reconnectionAttempts: Infinity });

  const $ = selector => document.querySelector(selector);
  const joinPanel = $('#joinPanel');
  const gamePanel = $('#gamePanel');
  const joinForm = $('#joinForm');
  const nameInput = $('#playerName');
  const joinMessage = $('#joinMessage');
  const canvas = $('#gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = $('#overlay');
  const rewardCard = $('#rewardCard');
  const rewardIcon = $('#rewardIcon');
  const rewardUnlocked = $('#rewardUnlocked');
  const rewardHint = $('#rewardHint');
  const phaseLabel = $('#phaseLabel');
  const trackName = $('#trackName');
  const bikeLabel = $('#bikeLabel');
  const rewardText = $('#rewardText');
  const rewardDescription = $('#rewardDescription');
  const nextRewardIcon = $('#nextRewardIcon');
  const progressBar = $('#progressBar');
  const progressText = $('#progressText');
  const standings = $('#standings');
  const playerCount = $('#playerCount');
  const roomBadge = $('#roomBadge');
  const garageBtn = $('#garageBtn');
  const garageCloseBtn = $('#garageCloseBtn');
  const garagePanel = $('#garagePanel');
  const bikeGrid = $('#bikeGrid');
  const equipmentList = $('#equipmentList');
  const soundBtn = $('#soundBtn');

  const controls = {
    left: $('#leftBtn'),
    jump: $('#jumpBtn'),
    crouch: $('#crouchBtn'),
    right: $('#rightBtn')
  };

  const TRACKS = [
    {
      name: 'Bosque Verde', mode: 'forest', sky: '#dff4ff', ground: '#79ae68', dirt: '#bd8551', accent: '#315f43',
      hazards: [
        { type: 'rock', action: 'jump' }, { type: 'branch', action: 'crouch' },
        { type: 'puddle', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Deserto Dourado', mode: 'desert', sky: '#ffe6ad', ground: '#dfbd69', dirt: '#b86e3e', accent: '#8a5a31',
      hazards: [
        { type: 'cactus', action: 'jump' }, { type: 'desertArch', action: 'crouch' },
        { type: 'sand', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Montanha Gelada', mode: 'ice', sky: '#e8f7ff', ground: '#d9e9e8', dirt: '#7896a1', accent: '#537584',
      hazards: [
        { type: 'ice', action: 'jump' }, { type: 'snowArch', action: 'crouch' },
        { type: 'snow', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Vulcão Aventura', mode: 'volcano', sky: '#ffd1b9', ground: '#66534d', dirt: '#8d4b35', accent: '#542f2a',
      hazards: [
        { type: 'lavaRock', action: 'jump' }, { type: 'smokeBar', action: 'crouch' },
        { type: 'crack', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Cidade Neon', mode: 'city', sky: '#dce3ff', ground: '#777c89', dirt: '#4d5767', accent: '#343a49',
      hazards: [
        { type: 'barrier', action: 'jump' }, { type: 'sign', action: 'crouch' },
        { type: 'cityPuddle', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Praia Tropical', mode: 'beach', sky: '#cfefff', ground: '#e3ca7b', dirt: '#b88b55', accent: '#4d8b78',
      hazards: [
        { type: 'driftwood', action: 'jump' }, { type: 'palmLeaf', action: 'crouch' },
        { type: 'water', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Caverna Cristal', mode: 'cave', sky: '#37354c', ground: '#565265', dirt: '#766b72', accent: '#a58ec0',
      hazards: [
        { type: 'crystal', action: 'jump' }, { type: 'lowRock', action: 'crouch' },
        { type: 'cavePuddle', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    },
    {
      name: 'Vale dos Dinossauros', mode: 'dino', sky: '#d8f2d1', ground: '#6f9e61', dirt: '#a97649', accent: '#3e6540',
      hazards: [
        { type: 'egg', action: 'jump' }, { type: 'vine', action: 'crouch' },
        { type: 'mud', action: 'jump' }, { type: 'ramp', action: 'ramp' }
      ]
    }
  ];

  const BIKES = [
    { id: 'trail50', name: 'Trilha 50', unlockAfter: 0, color: '#1d7a59', emoji: '🏍️', note: 'A companheira do começo da aventura.' },
    { id: 'turbo80', name: 'Turbo 80', unlockAfter: 2, color: '#d16f3f', emoji: '🏍️', note: 'Visual esportivo do deserto.' },
    { id: 'snow100', name: 'Neve 100', unlockAfter: 4, color: '#3f7fa4', emoji: '🏍️', note: 'Preparada para pistas geladas.' },
    { id: 'neonx', name: 'Neon X', unlockAfter: 6, color: '#7950a8', emoji: '🏍️', note: 'Brilha nas pistas noturnas.' },
    { id: 'dino200', name: 'Dino 200', unlockAfter: 8, color: '#6e8b3d', emoji: '🏍️', note: 'A moto especial do Vale Dino.' }
  ];

  const REWARDS = [
    { name: 'Capacete Verde', icon: '🪖', description: 'Proteção para suas aventuras.', kind: 'equipment' },
    { name: 'Moto Turbo 80', icon: '🏍️', description: 'Nova moto liberada na garagem.', kind: 'bike', bikeId: 'turbo80' },
    { name: 'Suspensão de Salto', icon: '🛠️', description: 'Equipamento especial conquistado.', kind: 'equipment' },
    { name: 'Moto Neve 100', icon: '🏍️', description: 'Nova moto liberada na garagem.', kind: 'bike', bikeId: 'snow100' },
    { name: 'Roupa Vulcão', icon: '🥽', description: 'Equipamento especial conquistado.', kind: 'equipment' },
    { name: 'Moto Neon X', icon: '🏍️', description: 'Nova moto liberada na garagem.', kind: 'bike', bikeId: 'neonx' },
    { name: 'Luvas Cristal', icon: '🧤', description: 'Equipamento especial conquistado.', kind: 'equipment' },
    { name: 'Moto Dino 200', icon: '🏍️', description: 'Moto especial do Vale desbloqueada.', kind: 'bike', bikeId: 'dino200' }
  ];

  let playerId = null;
  let playerToken = null;
  let playerName = '';
  let room = null;
  let phase = 1;
  let seed = 1;
  let phaseDistance = 3300;
  let obstacles = [];
  let lastTime = performance.now();
  let sendAccumulator = 0;
  let hitCooldown = 0;
  let finishSent = false;
  let connected = socket.connected;
  let rewardShownForPhase = 0;
  let justResumed = false;
  let audioContext = null;
  let soundEnabled = true;
  let laneTween = 1;
  let jumpHintShown = false;

  const localProgress = loadProgress();
  const remotePlayers = new Map();

  const me = {
    distance: 0,
    lane: 1,
    yOffset: 0,
    vy: 0,
    crouching: false,
    speed: 246,
    stun: 0,
    hitFlash: 0,
    rampBoost: 0
  };

  function loadProgress() {
    const fallback = { maxCompletedPhase: 0, selectedBike: 'trail50', equipment: [] };
    try {
      const raw = JSON.parse(localStorage.getItem('moto-trilhas-progress-v2') || '{}');
      const maxCompletedPhase = Math.max(0, Math.trunc(Number(raw.maxCompletedPhase) || 0));
      const selectedBike = BIKES.some(b => b.id === raw.selectedBike) ? raw.selectedBike : 'trail50';
      const equipment = Array.isArray(raw.equipment) ? raw.equipment.filter(x => typeof x === 'string').slice(0, 20) : [];
      return { maxCompletedPhase, selectedBike, equipment };
    } catch {
      return fallback;
    }
  }

  function persistProgress() {
    try {
      localStorage.setItem('moto-trilhas-progress-v2', JSON.stringify(localProgress));
    } catch { /* storage can be unavailable in private mode */ }
  }

  function rememberName(name) {
    try { localStorage.setItem('moto-trilhas-last-name', name); } catch { /* ignore */ }
  }

  function getRememberedName() {
    try { return localStorage.getItem('moto-trilhas-last-name') || ''; } catch { return ''; }
  }

  function currentBike() {
    return BIKES.find(b => b.id === localProgress.selectedBike) || BIKES[0];
  }

  function isBikeUnlocked(bike) {
    return localProgress.maxCompletedPhase >= bike.unlockAfter;
  }

  function rewardForPhase(value) {
    return REWARDS[(Math.max(1, value) - 1) % REWARDS.length];
  }

  function trackForPhase(value) {
    return TRACKS[(Math.max(1, value) - 1) % TRACKS.length];
  }

  function unlockPhaseReward(completedPhase) {
    if (completedPhase <= localProgress.maxCompletedPhase) return false;
    localProgress.maxCompletedPhase = completedPhase;
    const reward = rewardForPhase(completedPhase);
    if (reward.kind === 'equipment' && !localProgress.equipment.includes(reward.name)) {
      localProgress.equipment.push(reward.name);
    }
    if (reward.kind === 'bike' && reward.bikeId) {
      localProgress.selectedBike = reward.bikeId;
      socket.emit('setBike', { bikeId: reward.bikeId });
    }
    persistProgress();
    renderGarage();
    return true;
  }

  function seededRandom(s) {
    let x = s >>> 0;
    return () => {
      x += 0x6D2B79F5;
      let t = x;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildObstacles() {
    const track = trackForPhase(phase);
    const rand = seededRandom(seed + phase * 9973);
    const list = [];
    let x = 520;
    let previousLane = -1;
    let previousAction = '';
    while (x < phaseDistance - 260) {
      let hazard = track.hazards[Math.floor(rand() * track.hazards.length)];
      if (hazard.action === previousAction && rand() < .55) {
        hazard = track.hazards[(track.hazards.indexOf(hazard) + 1) % track.hazards.length];
      }
      let lane = Math.floor(rand() * 3);
      if (lane === previousLane && rand() < .5) lane = (lane + 1 + Math.floor(rand() * 2)) % 3;
      list.push({ x, lane, type: hazard.type, action: hazard.action, used: false });
      previousLane = lane;
      previousAction = hazard.action;
      x += 270 + rand() * 190;
    }
    return list;
  }

  function resetForPhase() {
    me.distance = 0;
    me.lane = 1;
    laneTween = 1;
    me.yOffset = 0;
    me.vy = 0;
    me.crouching = false;
    me.stun = 0;
    me.hitFlash = 0;
    me.rampBoost = 0;
    finishSent = false;
    jumpHintShown = false;
    obstacles = buildObstacles();
    rewardCard.classList.add('hidden');
    updateMeta();
  }

  function updateMeta() {
    const track = trackForPhase(phase);
    const bike = currentBike();
    const nextReward = rewardForPhase(phase);
    const pct = Math.round(Math.min(100, Math.max(0, me.distance / phaseDistance * 100)));
    phaseLabel.textContent = String(phase);
    trackName.textContent = track.name;
    bikeLabel.textContent = bike.name;
    rewardText.textContent = nextReward.name;
    rewardDescription.textContent = nextReward.description;
    nextRewardIcon.textContent = nextReward.icon;
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;
  }

  function sanitizeNameClient(raw) {
    return String(raw || '').normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 14);
  }

  function ensureAudio() {
    if (!soundEnabled || audioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try { audioContext = new AudioCtx(); } catch { audioContext = null; }
  }

  function tone(frequency, duration = .07, volume = .035, type = 'sine') {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function rewardSound() {
    tone(523, .1, .035);
    setTimeout(() => tone(659, .1, .035), 90);
    setTimeout(() => tone(784, .14, .035), 180);
  }

  function join(name) {
    playerName = sanitizeNameClient(name);
    if (!playerName) {
      joinMessage.textContent = 'Digite um nome ou apelido.';
      return;
    }
    ensureAudio();
    joinMessage.textContent = 'Conectando…';
    const resumeToken = sessionStorage.getItem('moto-trilhas-player-token') || '';
    socket.emit('joinGame', { name: playerName, resumeToken });
  }

  const remembered = getRememberedName();
  if (remembered) nameInput.value = remembered;

  joinForm.addEventListener('submit', event => {
    event.preventDefault();
    join(nameInput.value);
  });

  socket.on('connect', () => {
    connected = true;
    if (playerId && playerToken && playerName) {
      justResumed = true;
      socket.emit('joinGame', { name: playerName, resumeToken: playerToken });
    }
  });

  socket.on('disconnect', () => {
    connected = false;
    if (playerId) {
      overlay.textContent = 'Reconectando…';
      overlay.style.display = 'block';
    }
  });

  socket.on('connect_error', () => {
    if (!playerId) joinMessage.textContent = 'Não foi possível conectar ao servidor.';
  });

  socket.on('joined', data => {
    playerId = data.playerId;
    playerToken = data.playerToken;
    sessionStorage.setItem('moto-trilhas-player-token', playerToken);
    rememberName(playerName);
    joinPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
    roomBadge.textContent = `Sala ${data.roomId}`;
    socket.emit('setBike', { bikeId: currentBike().id });
    renderGarage();
    canvas.focus();
    joinMessage.textContent = '';
  });

  socket.on('roomState', state => {
    const phaseChanged = state.phase !== phase || state.seed !== seed;
    room = state;
    phase = state.phase;
    seed = state.seed;
    phaseDistance = state.phaseDistance;
    roomBadge.textContent = `Sala ${state.roomId}`;

    const localServerPlayer = state.players.find(p => p.id === playerId);
    if (phaseChanged) resetForPhase();
    if (justResumed && localServerPlayer) {
      me.distance = Number(localServerPlayer.distance) || 0;
      me.lane = Number.isFinite(localServerPlayer.lane) ? localServerPlayer.lane : 1;
      laneTween = me.lane;
      justResumed = false;
    }

    remotePlayers.clear();
    for (const p of state.players) {
      if (p.id !== playerId) remotePlayers.set(p.id, { ...p });
    }
    renderStandings(state.players);
    playerCount.textContent = `${state.players.filter(p => p.connected).length}/4`;

    if (state.state === 'intermission') {
      const newUnlock = unlockPhaseReward(state.phase);
      if (rewardShownForPhase !== state.phase) {
        rewardShownForPhase = state.phase;
        showReward(state.phase, newUnlock);
      }
    } else if (state.state === 'countdown' && phaseChanged) {
      rewardCard.classList.add('hidden');
    }

    updateOverlay();
    updateMeta();
  });

  socket.on('playerUpdate', p => {
    if (p.id === playerId) return;
    const current = remotePlayers.get(p.id) || {};
    remotePlayers.set(p.id, { ...current, ...p });
    if (room) {
      room.players = room.players.map(x => x.id === p.id ? { ...x, ...p } : x);
      renderStandings(room.players);
    }
  });

  function showReward(completedPhase, isNew) {
    const reward = rewardForPhase(completedPhase);
    rewardIcon.textContent = reward.icon;
    rewardUnlocked.textContent = reward.name;
    rewardHint.textContent = isNew
      ? (reward.kind === 'bike' ? 'Já está equipada. Você pode trocar na garagem.' : 'Equipamento adicionado à sua coleção.')
      : 'Recompensa já conquistada anteriormente.';
    rewardCard.classList.remove('hidden');
    if (isNew) rewardSound();
  }

  function renderStandings(players) {
    const sorted = [...players].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishRank || 99) - (b.finishRank || 99);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return (b.distance || 0) - (a.distance || 0);
    });
    standings.replaceChildren();
    sorted.forEach((p, index) => {
      const li = document.createElement('li');
      if (p.id === playerId) li.classList.add('me');
      if (!p.connected) li.classList.add('offline');
      const pct = Math.round(Math.min(100, Math.max(0, (p.distance || 0) / phaseDistance * 100)));
      const placeText = p.finished && p.finishRank ? `${p.finishRank}º` : `${index + 1}º`;
      const status = p.finished ? '🏁' : `${pct}%`;
      li.innerHTML = `<div class="standing-row"><span class="place">${placeText}</span><span class="pilot-name"></span><span class="pilot-progress">${status}</span></div>`;
      li.querySelector('.pilot-name').textContent = `${p.name}${p.connected ? '' : ' (reconectando)'}`;
      standings.appendChild(li);
    });
  }

  function setLane(delta) {
    if (!isRunning()) return;
    const next = Math.max(0, Math.min(2, me.lane + delta));
    if (next !== me.lane) {
      me.lane = next;
      tone(220, .045, .018, 'triangle');
    }
  }

  function jump() {
    if (!isRunning() || me.yOffset > 1) return;
    me.vy = 475 + me.rampBoost;
    me.rampBoost = 0;
    tone(360, .065, .025, 'triangle');
  }

  function setCrouch(on) {
    if (!isRunning()) on = false;
    me.crouching = on && me.yOffset < 5;
  }

  controls.left.addEventListener('click', () => setLane(-1));
  controls.right.addEventListener('click', () => setLane(1));
  controls.jump.addEventListener('click', jump);

  const crouchStart = event => {
    event.preventDefault();
    controls.crouch.classList.add('pressed');
    setCrouch(true);
  };
  const crouchEnd = () => {
    controls.crouch.classList.remove('pressed');
    setCrouch(false);
  };
  controls.crouch.addEventListener('pointerdown', crouchStart);
  controls.crouch.addEventListener('pointerup', crouchEnd);
  controls.crouch.addEventListener('pointercancel', crouchEnd);
  controls.crouch.addEventListener('pointerleave', crouchEnd);

  canvas.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setLane(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setLane(1); }
    if (event.key === 'ArrowUp' || event.key === ' ') { event.preventDefault(); jump(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); setCrouch(true); }
  });
  canvas.addEventListener('keyup', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setCrouch(false); }
  });

  garageBtn.addEventListener('click', () => toggleGarage());
  garageCloseBtn.addEventListener('click', () => toggleGarage(false));

  function toggleGarage(force) {
    const open = typeof force === 'boolean' ? force : garagePanel.classList.contains('hidden');
    garagePanel.classList.toggle('hidden', !open);
    garageBtn.setAttribute('aria-expanded', String(open));
    if (open) renderGarage();
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = `Som: ${soundEnabled ? 'ligado' : 'desligado'}`;
    soundBtn.setAttribute('aria-pressed', String(!soundEnabled));
    if (soundEnabled) {
      ensureAudio();
      tone(440, .06, .025);
    }
  });

  function renderGarage() {
    bikeGrid.replaceChildren();
    for (const bike of BIKES) {
      const unlocked = isBikeUnlocked(bike);
      const selected = bike.id === currentBike().id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `bike-card${selected ? ' selected' : ''}${unlocked ? '' : ' locked'}`;
      button.disabled = !unlocked;
      button.innerHTML = `<span class="bike-emoji">${bike.emoji}</span><strong></strong><small></small>`;
      button.querySelector('strong').textContent = bike.name;
      button.querySelector('small').textContent = unlocked ? bike.note : `Desbloqueia após a fase ${bike.unlockAfter}.`;
      button.addEventListener('click', () => {
        if (!unlocked) return;
        localProgress.selectedBike = bike.id;
        persistProgress();
        socket.emit('setBike', { bikeId: bike.id });
        renderGarage();
        updateMeta();
        tone(520, .08, .025);
      });
      bikeGrid.appendChild(button);
    }

    equipmentList.replaceChildren();
    if (localProgress.equipment.length === 0) {
      const chip = document.createElement('span');
      chip.className = 'equipment-chip';
      chip.textContent = 'Conclua a fase 1 para ganhar o primeiro equipamento';
      equipmentList.appendChild(chip);
    } else {
      for (const name of localProgress.equipment) {
        const chip = document.createElement('span');
        chip.className = 'equipment-chip';
        chip.textContent = name;
        equipmentList.appendChild(chip);
      }
    }
  }

  function isRunning() {
    return Boolean(connected && room && room.state === 'running' && !finishSent);
  }

  function collide(obstacle) {
    if (obstacle.used || obstacle.lane !== me.lane) return;
    const dx = obstacle.x - me.distance;
    if (dx < -36 || dx > 43) return;

    if (obstacle.action === 'ramp') {
      obstacle.used = true;
      if (me.yOffset < 5) {
        me.rampBoost = 105;
        me.vy = 585;
        tone(470, .09, .03, 'triangle');
      }
      return;
    }

    const safe = obstacle.action === 'crouch'
      ? me.crouching
      : me.yOffset > (obstacle.type.includes('puddle') || obstacle.type === 'water' || obstacle.type === 'mud' || obstacle.type === 'sand' || obstacle.type === 'crack' ? 28 : 45);

    if (!safe && hitCooldown <= 0) {
      me.stun = .82;
      me.hitFlash = .38;
      hitCooldown = .72;
      tone(120, .12, .04, 'sawtooth');
    }
    obstacle.used = true;
  }

  function update(dt) {
    hitCooldown = Math.max(0, hitCooldown - dt);
    me.hitFlash = Math.max(0, me.hitFlash - dt);
    me.stun = Math.max(0, me.stun - dt);
    laneTween += (me.lane - laneTween) * Math.min(1, dt * 11);

    if (isRunning()) {
      const speed = me.stun > 0 ? 112 : me.speed + Math.min(48, phase * 4);
      me.distance += speed * dt;
      for (const obstacle of obstacles) collide(obstacle);
      if (me.distance >= phaseDistance) {
        me.distance = phaseDistance;
        finishSent = true;
        socket.emit('playerState', {
          distance: me.distance,
          lane: me.lane,
          airborne: me.yOffset > 5,
          crouching: me.crouching
        });
        setTimeout(() => socket.emit('finishPhase'), 70);
        tone(880, .14, .035);
      }
    }

    if (me.yOffset > 0 || me.vy > 0) {
      me.yOffset += me.vy * dt;
      me.vy -= 1050 * dt;
      if (me.yOffset <= 0) {
        me.yOffset = 0;
        me.vy = 0;
      }
    }

    sendAccumulator += dt;
    if (isRunning() && sendAccumulator >= .1) {
      sendAccumulator = 0;
      socket.emit('playerState', {
        distance: me.distance,
        lane: me.lane,
        airborne: me.yOffset > 5,
        crouching: me.crouching
      });
    }

    updateOverlay();
    updateMeta();
  }

  function updateOverlay() {
    if (!connected && playerId) {
      overlay.textContent = 'Reconectando…';
      overlay.style.display = 'block';
      return;
    }
    if (!room) return;

    if (room.state === 'lobby') {
      const count = room.players.filter(p => p.connected).length;
      overlay.textContent = `Aguardando pilotos… ${count}/4`;
    } else if (room.state === 'countdown') {
      const seconds = Math.max(1, Math.ceil((room.startAt - Date.now()) / 1000));
      overlay.textContent = `${seconds}`;
    } else if (room.state === 'running') {
      overlay.textContent = finishSent ? 'Chegou! 🏁' : '';
    } else if (room.state === 'intermission') {
      overlay.textContent = 'Fase concluída!';
    }
    overlay.style.display = overlay.textContent ? 'block' : 'none';
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawBike(x, y, bikeId, crouching = false, alpha = 1, local = false) {
    const bike = BIKES.find(b => b.id === bikeId) || BIKES[0];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (local && me.hitFlash > 0) ctx.globalAlpha *= .46;

    if (bike.id === 'neonx') {
      ctx.strokeStyle = '#b792dc88';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-62, 3); ctx.lineTo(-35, 3); ctx.stroke();
    } else if (bike.id === 'dino200') {
      ctx.fillStyle = '#91aa5f88';
      ctx.beginPath(); ctx.moveTo(-47, 0); ctx.lineTo(-60, -8); ctx.lineTo(-57, 6); ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle = '#28332f';
    ctx.beginPath(); ctx.arc(-24, 10, 13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 10, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#69736f';
    ctx.beginPath(); ctx.arc(-24, 10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 10, 6, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = bike.color; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-19, 2); ctx.lineTo(0, -12); ctx.lineTo(19, 2); ctx.lineTo(-8, 2); ctx.lineTo(0, -12); ctx.stroke();
    ctx.fillStyle = bike.color; roundedRect(-7, -20, 31, 10, 5); ctx.fill();

    ctx.fillStyle = '#ffd4ad';
    ctx.beginPath(); ctx.arc(crouching ? 2 : -3, crouching ? -27 : -38, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f557f'; roundedRect(crouching ? -9 : -13, crouching ? -24 : -33, 19, crouching ? 10 : 18, 6); ctx.fill();
    ctx.fillStyle = bike.color;
    ctx.beginPath(); ctx.arc(crouching ? 3 : -3, crouching ? -29 : -41, 9, Math.PI, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawObstacle(o, screenX, laneY) {
    ctx.save();
    ctx.translate(screenX, laneY);

    const groundJump = ['puddle', 'sand', 'snow', 'crack', 'cityPuddle', 'water', 'cavePuddle', 'mud'];
    if (groundJump.includes(o.type)) {
      const fill = o.type === 'crack' ? '#3b2f2b' : o.type === 'snow' ? '#f7fbff' : o.type === 'sand' ? '#d59f55' : o.type === 'mud' ? '#79523b' : '#4c9ec7';
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.ellipse(0, 14, 35, 9, 0, 0, Math.PI * 2); ctx.fill();
    } else if (o.type === 'rock' || o.type === 'lavaRock' || o.type === 'ice' || o.type === 'crystal' || o.type === 'egg' || o.type === 'barrier' || o.type === 'cactus' || o.type === 'driftwood') {
      if (o.type === 'cactus') {
        ctx.strokeStyle = '#487b44'; ctx.lineWidth = 11; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, -30); ctx.moveTo(0, -8); ctx.lineTo(-15, -16); ctx.lineTo(-15, -28); ctx.moveTo(0, -1); ctx.lineTo(14, -9); ctx.lineTo(14, -19); ctx.stroke();
      } else if (o.type === 'crystal') {
        ctx.fillStyle = '#b59bd0';
        ctx.beginPath(); ctx.moveTo(-22, 14); ctx.lineTo(-10, -24); ctx.lineTo(0, -8); ctx.lineTo(12, -34); ctx.lineTo(24, 14); ctx.closePath(); ctx.fill();
      } else if (o.type === 'egg') {
        ctx.fillStyle = '#efe0b0'; ctx.strokeStyle = '#8e805e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, -4, 20, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7e9563'; ctx.beginPath(); ctx.arc(-6, -10, 4, 0, Math.PI * 2); ctx.arc(7, 1, 5, 0, Math.PI * 2); ctx.fill();
      } else if (o.type === 'barrier') {
        ctx.fillStyle = '#eae8df'; roundedRect(-31, -18, 62, 30, 5); ctx.fill();
        ctx.fillStyle = '#d77547'; ctx.fillRect(-25, -12, 16, 18); ctx.fillRect(3, -12, 16, 18);
      } else if (o.type === 'driftwood') {
        ctx.strokeStyle = '#805735'; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-28, 8); ctx.lineTo(29, -5); ctx.stroke();
      } else {
        const fill = o.type === 'lavaRock' ? '#543a32' : o.type === 'ice' ? '#9dd7ec' : '#686961';
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.moveTo(-24, 12); ctx.lineTo(-15, -16); ctx.lineTo(5, -25); ctx.lineTo(24, 5); ctx.lineTo(12, 16); ctx.closePath(); ctx.fill();
      }
    } else if (o.action === 'crouch') {
      const barColor = o.type === 'sign' ? '#d6d0c2' : o.type === 'snowArch' ? '#d9f0f5' : o.type === 'smokeBar' ? '#6a5149' : o.type === 'palmLeaf' ? '#4e8c58' : o.type === 'lowRock' ? '#696475' : o.type === 'vine' ? '#51763f' : o.type === 'desertArch' ? '#9a7042' : '#65472d';
      ctx.strokeStyle = barColor; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-39, -58); ctx.lineTo(39, -58); ctx.stroke();
      if (o.type === 'branch' || o.type === 'palmLeaf' || o.type === 'vine') {
        ctx.strokeStyle = o.type === 'palmLeaf' ? '#5d9d62' : '#3d7a44'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-18, -61); ctx.lineTo(-8, -78); ctx.moveTo(13, -61); ctx.lineTo(26, -75); ctx.stroke();
      }
    } else if (o.type === 'ramp') {
      ctx.fillStyle = '#b77a3a';
      ctx.beginPath(); ctx.moveTo(-35, 18); ctx.lineTo(35, 18); ctx.lineTo(35, -19); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6f4a2c'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
  }

  function drawBackground(track, w, h) {
    ctx.fillStyle = track.sky;
    ctx.fillRect(0, 0, w, h);

    if (track.mode === 'cave') {
      ctx.fillStyle = '#252436';
      for (let x = 10; x < w; x += 110) {
        const height = 45 + Math.abs(Math.sin((x + me.distance * .03) * .02)) * 70;
        ctx.beginPath(); ctx.moveTo(x - 35, 0); ctx.lineTo(x, height); ctx.lineTo(x + 35, 0); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#aa91c833';
      for (let x = 40; x < w; x += 180) {
        ctx.beginPath(); ctx.arc(x - (me.distance * .03 % 180), 170 + Math.sin(x) * 12, 16, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      if (track.mode !== 'volcano' && track.mode !== 'city') {
        ctx.fillStyle = track.mode === 'ice' ? '#fffdf0' : '#f5cf64';
        ctx.beginPath(); ctx.arc(w - 95, 76, 38, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = track.accent + '38';
      ctx.beginPath();
      ctx.moveTo(0, 235);
      for (let x = 0; x <= w; x += 70) {
        const yy = 190 + Math.sin((x + me.distance * .055) * .015) * (track.mode === 'city' ? 18 : 36);
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(w, 280); ctx.lineTo(0, 280); ctx.closePath(); ctx.fill();

      if (track.mode === 'city') {
        ctx.fillStyle = '#4a506055';
        for (let x = -30; x < w + 80; x += 85) {
          const offset = (me.distance * .08) % 85;
          const bh = 55 + ((x * 7) % 65 + 65) % 65;
          ctx.fillRect(x - offset, 220 - bh, 55, bh);
        }
      }
      if (track.mode === 'dino') {
        ctx.fillStyle = '#35543855';
        ctx.beginPath(); ctx.ellipse(w - 145, 200, 48, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(w - 150, 193, 8, 52);
        ctx.beginPath(); ctx.arc(w - 103, 190, 15, 0, Math.PI * 2); ctx.fill();
      }
      if (track.mode === 'volcano') {
        ctx.fillStyle = '#6d3d32';
        ctx.beginPath(); ctx.moveTo(w - 290, 245); ctx.lineTo(w - 160, 90); ctx.lineTo(w - 20, 245); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e27345';
        ctx.beginPath(); ctx.moveTo(w - 183, 116); ctx.lineTo(w - 160, 90); ctx.lineTo(w - 136, 117); ctx.closePath(); ctx.fill();
      }
      if (track.mode === 'beach') {
        ctx.fillStyle = '#65bad1'; ctx.fillRect(0, 232, w, 30);
      }
    }

    ctx.fillStyle = track.ground;
    ctx.fillRect(0, 245, w, h - 245);
  }

  function drawScene() {
    const w = canvas.width;
    const h = canvas.height;
    const track = trackForPhase(phase);
    ctx.clearRect(0, 0, w, h);
    drawBackground(track, w, h);

    const laneYs = [300, 365, 430];
    for (const laneY of laneYs) {
      ctx.strokeStyle = track.dirt; ctx.lineWidth = 42; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, laneY); ctx.lineTo(w, laneY); ctx.stroke();
      ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; ctx.setLineDash([20, 26]);
      ctx.beginPath(); ctx.moveTo(0, laneY - 20); ctx.lineTo(w, laneY - 20); ctx.stroke();
      ctx.setLineDash([]);
    }

    const finishX = 170 + (phaseDistance - me.distance) * .72;
    if (finishX > -100 && finishX < w + 100) {
      ctx.fillStyle = '#27332f'; ctx.fillRect(finishX - 3, 250, 6, 200);
      ctx.fillStyle = '#fff'; ctx.fillRect(finishX - 46, 255, 92, 34);
      ctx.fillStyle = '#27332f'; ctx.font = '900 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CHEGADA', finishX, 278);
    }

    for (const obstacle of obstacles) {
      const sx = 170 + (obstacle.x - me.distance) * .72;
      if (sx < -80 || sx > w + 80) continue;
      drawObstacle(obstacle, sx, laneYs[obstacle.lane]);
    }

    for (const p of remotePlayers.values()) {
      const sx = 170 + ((p.distance || 0) - me.distance) * .72;
      if (sx > -70 && sx < w + 70) {
        const lane = Math.max(0, Math.min(2, p.lane ?? 1));
        const y = laneYs[lane] - (p.airborne ? 42 : 0);
        drawBike(sx, y, p.bikeId || 'trail50', p.crouching, p.connected === false ? .35 : .68, false);
        ctx.fillStyle = track.mode === 'cave' ? '#fff' : '#17352c';
        ctx.font = '700 13px system-ui'; ctx.textAlign = 'center';
        ctx.fillText((p.name || 'Piloto').slice(0, 14), sx, y - 58);
      }
    }

    const localY = laneYs[0] + (laneYs[1] - laneYs[0]) * laneTween;
    drawBike(170, localY - me.yOffset, currentBike().id, me.crouching, 1, true);

    if (isRunning() && me.distance < 440) {
      ctx.fillStyle = '#17352ce8'; roundedRect(276, 23, 408, 57, 16); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 17px system-ui'; ctx.textAlign = 'center';
      const hint = phase === 1 ? 'Pule • Abaixe • Desvie para os lados' : `Nova pista: ${track.name}`;
      ctx.fillText(hint, 480, 58);
      jumpHintShown = true;
    }

    if (me.stun > 0) {
      ctx.fillStyle = '#fff5d8e8'; roundedRect(400, 94, 160, 38, 13); ctx.fill();
      ctx.fillStyle = '#7b4c2d'; ctx.font = '900 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Ops! Continue! ⭐', 480, 119);
    }
  }

  function loop(now) {
    const dt = Math.min(.05, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    drawScene();
    requestAnimationFrame(loop);
  }

  renderGarage();
  resetForPhase();
  requestAnimationFrame(loop);
})();
