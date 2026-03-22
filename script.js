/* ============================================================
   LOVE WEBSITE — script.js
   Handles: landing transition, typewriter, music, gallery,
            countdown, floating hearts, popup, secret message
   ============================================================ */

// ---- DOM REFS ----
const landing       = document.getElementById('landing');
const mainPage      = document.getElementById('main-page');
const openBtn       = document.getElementById('open-btn');
const musicBtn      = document.getElementById('music-btn');
const musicIcon     = document.getElementById('music-icon');
const bgMusic       = document.getElementById('bg-music');
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const specialPopup  = document.getElementById('special-popup');
const popupClose    = document.getElementById('popup-close');
const secretMsg     = document.getElementById('secret-msg');
const secretClose   = document.getElementById('secret-close');
const typewriterEl  = document.getElementById('typewriter-text');

// ---- STATE ----
let musicPlaying = false;
let clickCount   = 0;
let clickTimer   = null;

/* ============================================================
   1. LANDING → MAIN PAGE TRANSITION
   ============================================================ */
openBtn.addEventListener('click', () => {
  // Fade out landing
  landing.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  landing.style.opacity    = '0';
  landing.style.transform  = 'scale(1.05)';

  setTimeout(() => {
    landing.style.display = 'none';
    mainPage.classList.remove('hidden');
    mainPage.style.opacity = '0';

    // Fade in main
    requestAnimationFrame(() => {
      mainPage.style.transition = 'opacity 0.8s ease';
      mainPage.style.opacity    = '1';
    });

    // Start typewriter after hero is visible
    setTimeout(startTypewriter, 800);

    // Try starting music (requires user interaction)
    tryPlayMusic();

    // Special popup after 8 seconds
    setTimeout(showSpecialPopup, 8000);

  }, 850);
});

/* ============================================================
   2. FLOATING HEARTS
   ============================================================ */
const heartsContainer = document.getElementById('hearts-container');
const heartChars = ['❤️','💖','💕','💗','💓','🌹','💞'];

function spawnHeart() {
  const el       = document.createElement('span');
  el.className   = 'floating-heart';
  el.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];

  const size     = 0.9 + Math.random() * 1.4;
  const left     = Math.random() * 100;
  const duration = 7 + Math.random() * 9;
  const delay    = Math.random() * 3;

  el.style.cssText = `
    left: ${left}%;
    font-size: ${size}rem;
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
  `;

  heartsContainer.appendChild(el);

  // Remove after animation
  setTimeout(() => el.remove(), (duration + delay + 1) * 1000);
}

// Spawn hearts continuously
setInterval(spawnHeart, 600);
// Initial burst
for (let i = 0; i < 8; i++) spawnHeart();

/* ============================================================
   3. TYPEWRITER EFFECT
   ============================================================ */
const messages = [
  "From the moment I met you, everything started to feel special...",
  "Your smile became my favorite reason to be happy...",
  "In your eyes, I found my peace...",
  "Every moment with you feels like a beautiful dream...",
  "No matter what happens, I will always choose you...",
  "You are not just my love, you are my everything ❤️"
];

let msgIndex  = 0;
let charIndex = 0;
let isDeleting = false;
let typeTimeout;

function startTypewriter() {
  typeLoop();
}

function typeLoop() {
  const currentMsg = messages[msgIndex];

  if (!isDeleting) {
    // Type forward
    typewriterEl.textContent = currentMsg.slice(0, charIndex + 1);
    charIndex++;

    if (charIndex === currentMsg.length) {
      // Pause at end, then start deleting
      typeTimeout = setTimeout(() => {
        isDeleting = true;
        typeLoop();
      }, 2800);
      return;
    }
  } else {
    // Delete backward
    typewriterEl.textContent = currentMsg.slice(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      isDeleting = false;
      msgIndex   = (msgIndex + 1) % messages.length;
      typeTimeout = setTimeout(typeLoop, 500);
      return;
    }
  }

  const speed = isDeleting ? 35 : 65;
  typeTimeout = setTimeout(typeLoop, speed);
}

/* ============================================================
   4. MUSIC PLAYER
   ============================================================ */
function tryPlayMusic() {
  bgMusic.play()
    .then(() => {
      musicPlaying = true;
      musicIcon.textContent = '🎵';
    })
    .catch(() => {
      // Autoplay blocked — user must click
      musicPlaying = false;
      musicIcon.textContent = '▶️';
    });
}

musicBtn.addEventListener('click', () => {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying     = false;
    musicIcon.textContent = '▶️';
  } else {
    bgMusic.play();
    musicPlaying     = true;
    musicIcon.textContent = '🎵';
  }
});

/* ============================================================
   5. PHOTO GALLERY — LIGHTBOX
   ============================================================ */
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const src = item.getAttribute('data-src');
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox() {
  lightbox.classList.add('hidden');
  lightboxImg.src              = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);

// Keyboard close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ============================================================
   6. SPECIAL POPUP (after 8 seconds)
   ============================================================ */
function showSpecialPopup() {
  specialPopup.classList.remove('hidden');
}

popupClose.addEventListener('click', () => {
  specialPopup.classList.add('hidden');
});

specialPopup.addEventListener('click', e => {
  if (e.target === specialPopup) specialPopup.classList.add('hidden');
});

/* ============================================================
   7. HIDDEN SECRET (5 clicks anywhere)
   ============================================================ */
document.addEventListener('click', e => {
  // Ignore clicks on open button (those have their own handler)
  if (e.target.closest('#open-btn')) return;

  clickCount++;

  // Reset click count after 3 seconds of no clicking
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clickCount = 0; }, 3000);

  if (clickCount >= 5) {
    clickCount = 0;
    clearTimeout(clickTimer);
    secretMsg.classList.remove('hidden');
  }
});

secretClose.addEventListener('click', () => {
  secretMsg.classList.add('hidden');
});

secretMsg.addEventListener('click', e => {
  if (e.target === secretMsg) secretMsg.classList.add('hidden');
});

/* ============================================================
   8. COUNTDOWN TIMER
   ============================================================ */
const startDate = new Date('2022-11-10T00:00:00');

function updateCountdown() {
  const now  = new Date();
  const diff = now - startDate;

  if (diff < 0) return; // Not started yet

  const totalSeconds = Math.floor(diff / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours   = Math.floor(totalSeconds / 3600) % 24;
  const days    = Math.floor(totalSeconds / 86400);

  document.getElementById('cd-days').textContent  = days.toLocaleString();
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent  = String(minutes).padStart(2, '0');
  document.getElementById('cd-secs').textContent  = String(seconds).padStart(2, '0');
}

// Update every second
setInterval(updateCountdown, 1000);
updateCountdown(); // Immediate first run

/* ============================================================
   9. SWIPE SUPPORT FOR MOBILE
   ============================================================ */
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

// Prevent lightbox scroll-through on mobile
lightbox.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
