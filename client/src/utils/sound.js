/**
 * High-performance sound utility for SnackCraft
 * 1. Checks for custom user audio files in /sounds/ (client/public/sounds/)
 * 2. Falls back automatically to zero-latency Web Audio API synthesis
 */

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Attempt to play a custom audio file from /sounds/
 * Falls back to Web Audio synthesis if file doesn't exist or fails
 */
function playCustomOrFallback(fileCandidates, fallbackFn) {
  if (typeof window === 'undefined') return;

  const tryCandidate = (idx) => {
    if (idx >= fileCandidates.length) {
      // No custom file succeeded, use synthesized fallback
      fallbackFn();
      return;
    }

    const src = fileCandidates[idx];
    const audio = new Audio(src);
    audio.volume = 0.9;

    let hasHandled = false;

    const handleError = () => {
      if (hasHandled) return;
      hasHandled = true;
      tryCandidate(idx + 1);
    };

    audio.onerror = handleError;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        handleError();
      });
    }
  };

  tryCandidate(0);
}

// ==========================================
// 1. CUSTOMER ORDER PLACED SOUND
// ==========================================
function synthOrderPlaced() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.25 }, // C5
      { freq: 659.25, time: 0.1, duration: 0.25 }, // E5
      { freq: 783.99, time: 0.2, duration: 0.35 }, // G5
      { freq: 1046.5, time: 0.3, duration: 0.7 },  // C6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const startTime = ctx.currentTime + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch (err) {
    console.warn('[Audio] Synthesizer error:', err);
  }
}

export function playOrderPlacedSound() {
  playCustomOrFallback(
    [
      '/sounds/universfield-new-notification-036-485897.mp3',
      '/sounds/order-placed.mp3',
      '/sounds/order.mp3',
      '/sounds/order-placed.wav',
      '/sounds/order.wav',
      '/sounds/order.m4a',
    ],
    synthOrderPlaced
  );
}

// ==========================================
// 2. STORE OWNER / ADMIN NEW ORDER BELL
// ==========================================
function synthAdminBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const rings = [0.0, 0.22];

    rings.forEach((ringStart) => {
      const startTime = ctx.currentTime + ringStart;

      const fundamental = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(1318.51, startTime);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(2637.02, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.45, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

      fundamental.connect(gain);
      harmonic.connect(gain);
      gain.connect(ctx.destination);

      fundamental.start(startTime);
      harmonic.start(startTime);

      fundamental.stop(startTime + 0.7);
      harmonic.stop(startTime + 0.7);
    });
  } catch (err) {
    console.warn('[Audio] Synthesizer error:', err);
  }
}

export function playAdminNewOrderBell() {
  playCustomOrFallback(
    [
      '/sounds/universfield-new-notification-036-485897.mp3',
      '/sounds/bell.mp3',
      '/sounds/admin-order.mp3',
      '/sounds/admin-order.wav',
      '/sounds/bell.wav',
      '/sounds/new-order.mp3',
    ],
    synthAdminBell
  );
}

// ==========================================
// 3. CUSTOMER STATUS UPDATE SOUND
// ==========================================
function synthStatusUpdate() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, startTime); // E5
    osc.frequency.setValueAtTime(880.0, startTime + 0.12); // A5

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.45);
  } catch (err) {
    console.warn('[Audio] Synthesizer error:', err);
  }
}

export function playStatusUpdateSound() {
  playCustomOrFallback(
    [
      '/sounds/universfield-new-notification-036-485897.mp3',
      '/sounds/notification.mp3',
      '/sounds/status-update.mp3',
      '/sounds/status-update.wav',
      '/sounds/notification.wav',
    ],
    synthStatusUpdate
  );
}
