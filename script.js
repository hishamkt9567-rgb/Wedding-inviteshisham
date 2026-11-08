'use strict';

const opening = document.getElementById('opening');
const website = document.getElementById('website');
const openButton = document.getElementById('openButton');
const siteHeader = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');
const sideDrawer = document.getElementById('sideDrawer');
const closeDrawer = document.getElementById('closeDrawer');
const music = document.getElementById('music');
const musicButton = document.getElementById('musicButton');
const musicIconPlaying = document.getElementById('musicIconPlaying');
const musicIconMuted = document.getElementById('musicIconMuted');

let opened = false;
music.volume = 0.65;

// Audio Icon State Handler
function updateMusicIcon() {
  const isPlaying = !music.paused;
  if (isPlaying) {
    musicIconPlaying.classList.remove('hidden');
    musicIconMuted.classList.add('hidden');
    musicButton.setAttribute('aria-label', 'Pause music');
  } else {
    musicIconPlaying.classList.add('hidden');
    musicIconMuted.classList.remove('hidden');
    musicButton.setAttribute('aria-label', 'Play music');
  }
}

function playMusic() {
  music.play()
    .then(updateMusicIcon)
    .catch(err => {
      console.warn('Playback error or browser autoplay policy:', err);
      updateMusicIcon();
    });
}

// Opening Sequence
openButton.addEventListener('click', () => {
  if (opened) return;
  opened = true;
  openButton.disabled = true;

  // Reveal site and controls
  website.hidden = false;
  siteHeader.hidden = false;
  musicButton.hidden = false;
  window.scrollTo(0, 0);

  // Start background audio
  playMusic();

  // Smooth fade transition
  opening.classList.add('open');
  setTimeout(() => {
    opening.hidden = true;
    setupReveal();
    setupScratch();
  }, 1000);
});

// Sound Toggle
musicButton.addEventListener('click', () => {
  if (music.paused) {
    playMusic();
  } else {
    music.pause();
    updateMusicIcon();
  }
});

music.addEventListener('play', updateMusicIcon);
music.addEventListener('pause', updateMusicIcon);

// Drawer Navigation
if (navToggle && sideDrawer && closeDrawer) {
  navToggle.addEventListener('click', () => sideDrawer.classList.add('open'));
  closeDrawer.addEventListener('click', () => sideDrawer.classList.remove('open'));
  sideDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => sideDrawer.classList.remove('open'));
  });
}

// Countdown Calculation (Sunday, 27 Dec 2026, 4:00 PM IST)
const weddingDate = new Date('2026-12-27T16:00:00+05:30').getTime();

function updateCountdown() {
  const remaining = Math.max(0, weddingDate - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60
  };

  for (const [id, val] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val).padStart(2, '0');
  }

  if (remaining === 0) {
    const txt = document.getElementById('countdownText');
    if (txt) txt.textContent = 'Our wedding celebration is happening today!';
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Intersection Observer for Smooth Reveal Animations
function setupReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  elements.forEach(el => observer.observe(el));
}

// Scratch Card Canvas
let scratchReady = false;
function setupScratch() {
  if (scratchReady) return;
  scratchReady = true;

  const canvas = document.getElementById('scratchCanvas');
  const revealButton = document.getElementById('revealButton');
  if (!canvas || !revealButton) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    canvas.hidden = true;
    revealButton.hidden = true;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.scale(ratio, ratio);

  // Background overlay
  ctx.fillStyle = '#9caa92';
  ctx.fillRect(0, 0, width, height);

  // Scratch center illustration
  ctx.fillStyle = '#e4ebd9';
  ctx.beginPath();
  ctx.moveTo(width / 2, height * 0.78);
  ctx.bezierCurveTo(width * 0.05, height * 0.48, width * 0.17, height * 0.12, width / 2, height * 0.33);
  ctx.bezierCurveTo(width * 0.83, height * 0.12, width * 0.95, height * 0.48, width / 2, height * 0.78);
  ctx.fill();

  ctx.fillStyle = '#46583d';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Montserrat, sans-serif';
  ctx.fillText('SCRATCH HERE', width / 2, height * 0.52);

  let drawing = false;
  let previous = null;
  let strokes = 0;
  let revealed = false;

  function point(event) {
    const b = canvas.getBoundingClientRect();
    return { x: event.clientX - b.left, y: event.clientY - b.top };
  }

  function scratch(p) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (previous) ctx.moveTo(previous.x, previous.y);
    else ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    previous = p;
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    canvas.style.transition = 'opacity 0.6s ease';
    canvas.style.opacity = '0';
    canvas.style.pointerEvents = 'none';
    revealButton.hidden = true;
  }

  function check() {
    if (revealed) return;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0, total = 0;
    for (let i = 3; i < pixels.length; i += 80) {
      total++;
      if (pixels[i] < 128) cleared++;
    }
    if (total && (cleared / total) > 0.4) reveal();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (revealed) return;
    drawing = true;
    previous = null;
    canvas.setPointerCapture(e.pointerId);
    scratch(point(e));
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing || revealed) return;
    scratch(point(e));
    if (++strokes % 12 === 0) check();
  });

  const finish = () => {
    if (!drawing) return;
    drawing = false;
    previous = null;
    check();
  };

  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  revealButton.addEventListener('click', reveal);
}

// Add to Calendar (.ics Generator)
const calendarBtn = document.getElementById('calendarButton');
if (calendarBtn) {
  calendarBtn.addEventListener('click', () => {
    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Invitation//EN',
      'BEGIN:VEVENT',
      'UID:hisham-aneena-20261227@wedding.invitation',
      'DTSTAMP:20261108T000000Z',
      'DTSTART:20261227T103000Z',
      'DTEND:20261227T143000Z',
      'SUMMARY:Muhammed Hisham & Aneena Jubin Wedding',
      'LOCATION:B.U.M Hall Auditorium, Mundithodika, Malappuram, Kerala',
      'DESCRIPTION:Wedding celebration of Muhammed Hisham and Aneena Jubin',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Hisham-Aneena-Wedding.ics';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// Native Web Share / WhatsApp Share
const shareBtn = document.getElementById('shareButton');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const text = "You're invited to the wedding of Muhammed Hisham & Aneena Jubin! Sunday, 27 December 2026, 4:00 PM–8:00 PM at B.U.M Hall Auditorium, Mundithodika, Malappuram.";
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Muhammed Hisham & Aneena Wedding',
          text,
          url: window.location.href
        });
      } catch (err) {}
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + window.location.href), '_blank', 'noopener');
    }
  });
}
