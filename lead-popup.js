/* ═══════════════════════════════════════════════════════════
   Marketer Raja — Lead Capture Popup
   • First popup appears after 3 minutes on the site
   • If ignored / closed, it comes back every 5 minutes
   • Once the visitor submits, it never shows again
   • Leads are saved to Firestore "enquiries" (shows in admin panel)
     and sent to the Make webhook (WhatsApp / Gmail alert)
   Timer only counts while the tab is visible, and is remembered
   across pages so navigating does not reset it.
═══════════════════════════════════════════════════════════ */

const FIRST_DELAY_MS  = 3 * 60 * 1000;   // first popup: 3 minutes
const REPEAT_DELAY_MS = 5 * 60 * 1000;   // reappear every: 5 minutes
const NEW_VISIT_GAP   = 30 * 60 * 1000;  // away >30 min = treated as a new visit
const STORAGE_KEY     = 'mr_lead_popup_v1';
const WEBHOOK_URL     = 'https://hook.eu1.make.com/2r0f6hgm3eoywvzxzgaf2dgb2oq6uwbx';
const FIRESTORE_SDK   = 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

/* ── safe storage ── */
function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function writeState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* private mode etc. */ }
}

let state = readState();
if (state && state.done) { /* already submitted — never show again */ }
else {
  const now = Date.now();
  if (!state || !state.lastSeen || now - state.lastSeen > NEW_VISIT_GAP) {
    state = { nextAt: now + FIRST_DELAY_MS, lastSeen: now, done: false };
  } else {
    state.lastSeen = now;
  }
  writeState(state);
  start();
}

function start() {
  let open = false;
  let lastTick = Date.now();
  let lastWrite = 0;

  setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastTick;
    lastTick = now;

    // another tab may have submitted already
    const stored = readState();
    if (stored && stored.done) { state.done = true; return; }
    if (state.done) return;

    // freeze the countdown while the tab is hidden
    if (document.hidden) { state.nextAt += elapsed; }
    else if (!open && now >= state.nextAt) { open = true; showPopup(onDismiss, onSuccess); }

    state.lastSeen = now;
    if (now - lastWrite > 5000) { writeState(state); lastWrite = now; }
  }, 1000);

  function onDismiss() {
    open = false;
    state.nextAt = Date.now() + REPEAT_DELAY_MS;
    writeState(state);
  }
  function onSuccess() {
    open = false;
    state.done = true;
    writeState(state);
  }
}

/* ═══════════════ UI ═══════════════ */
function injectStyles() {
  if (document.getElementById('mr-lp-style')) return;
  const css = `
  .mr-lp-overlay{position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:16px;
    background:rgba(0,6,20,0.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    opacity:0;transition:opacity .3s ease;cursor:auto;}
  .mr-lp-overlay.mr-show{opacity:1;}
  .mr-lp-box{position:relative;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;
    background:#021233;border:1px solid #00f5ff;border-radius:8px;padding:34px 30px 28px;
    box-shadow:0 0 50px rgba(0,245,255,0.25);color:#e8f4ff;font-family:'Rajdhani',sans-serif;
    transform:translateY(24px) scale(.97);transition:transform .35s cubic-bezier(.34,1.56,.64,1);}
  .mr-show .mr-lp-box{transform:translateY(0) scale(1);}
  .mr-lp-box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg,transparent,#00f5ff,#ff0080,transparent);}
  .mr-lp-close{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:6px;cursor:pointer;
    background:rgba(255,255,255,0.04);border:1px solid rgba(0,245,255,0.3);color:#00f5ff;font-size:16px;line-height:1;transition:all .2s;}
  .mr-lp-close:hover{background:rgba(255,0,128,0.15);border-color:#ff0080;color:#ff0080;}
  .mr-lp-tag{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#00f5ff;margin-bottom:10px;}
  .mr-lp-title{font-family:'Orbitron',monospace;font-size:20px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;line-height:1.25;margin:0 30px 8px 0;}
  .mr-lp-title span{color:#00f5ff;text-shadow:0 0 20px rgba(0,245,255,0.5);}
  .mr-lp-sub{font-size:15px;line-height:1.55;color:rgba(232,244,255,0.6);margin:0 0 20px;}
  .mr-lp-form{display:flex;flex-direction:column;gap:13px;}
  .mr-lp-field{display:flex;flex-direction:column;gap:5px;}
  .mr-lp-field label{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(232,244,255,0.55);}
  .mr-lp-field label i{color:#ff0080;font-style:normal;}
  .mr-lp-field input,.mr-lp-field select{width:100%;padding:12px 13px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);
    color:#fff;border-radius:4px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;}
  .mr-lp-field input::placeholder{color:rgba(232,244,255,0.3);}
  .mr-lp-field input:focus,.mr-lp-field select:focus{border-color:#00f5ff;box-shadow:0 0 12px rgba(0,245,255,0.3);}
  .mr-lp-field select{appearance:auto;} .mr-lp-field select option{color:#000;}
  .mr-lp-hp{position:absolute!important;left:-9999px!important;opacity:0;height:0;width:0;}
  .mr-lp-submit{padding:15px;background:#25D366;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:4px;
    font-family:'Orbitron',monospace;font-weight:700;font-size:13px;letter-spacing:2px;transition:all .25s;box-shadow:0 4px 15px rgba(37,211,102,0.4);}
  .mr-lp-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(37,211,102,0.55);filter:brightness(1.1);}
  .mr-lp-submit:disabled{opacity:.6;cursor:wait;transform:none;}
  .mr-lp-later{background:none;border:none;color:rgba(232,244,255,0.45);font-family:'Share Tech Mono',monospace;font-size:12px;
    letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:8px;text-align:center;transition:color .2s;}
  .mr-lp-later:hover{color:#00f5ff;}
  .mr-lp-status{display:none;text-align:center;font-family:'Share Tech Mono',monospace;font-size:13px;line-height:1.5;}
  .mr-lp-thanks{text-align:center;padding:30px 6px 14px;}
  .mr-lp-thanks .mr-ico{font-size:52px;display:block;margin-bottom:14px;}
  .mr-lp-thanks h3{font-family:'Orbitron',monospace;font-size:18px;letter-spacing:2px;color:#00ff88;text-shadow:0 0 20px rgba(0,255,136,0.4);margin:0 0 10px;text-transform:uppercase;}
  .mr-lp-thanks p{font-size:16px;color:rgba(232,244,255,0.7);line-height:1.6;margin:0;}
  @media(max-width:480px){.mr-lp-box{padding:28px 18px 22px;}.mr-lp-title{font-size:17px;}}
  `;
  const el = document.createElement('style');
  el.id = 'mr-lp-style';
  el.textContent = css;
  document.head.appendChild(el);
}

const HEARD_FROM = ['Google Search', 'Instagram', 'Facebook', 'YouTube', 'WhatsApp', 'Friend / Referral', 'Other'];
const PURPOSES   = ['I need digital marketing services', 'I want to join the digital marketing course', 'I want an internship', 'Just browsing', 'Other'];
const SERVICES   = ['Meta Ads', 'Google Ads', 'SEO', 'Web & App Development', 'Digital Marketing Course', 'Internship', 'Other'];

const opts = (arr, placeholder) =>
  `<option value="" disabled selected>${placeholder}</option>` + arr.map(v => `<option value="${v}">${v}</option>`).join('');

function showPopup(onDismiss, onSuccess) {
  injectStyles();

  const overlay = document.createElement('div');
  overlay.className = 'mr-lp-overlay';
  overlay.innerHTML = `
    <div class="mr-lp-box" role="dialog" aria-modal="true" aria-labelledby="mr-lp-title">
      <button type="button" class="mr-lp-close" aria-label="Close">✕</button>
      <div id="mr-lp-main">
        <div class="mr-lp-tag">// Free Strategy Call</div>
        <h2 class="mr-lp-title" id="mr-lp-title">Tell Us <span>About You</span></h2>
        <p class="mr-lp-sub">Share a few quick details and our team will get back to you within 24 hours.</p>
        <form class="mr-lp-form" novalidate>
          <div class="mr-lp-field"><label for="mr-lp-name">Your Name <i>*</i></label>
            <input id="mr-lp-name" type="text" placeholder="e.g., Raja Kumar" autocomplete="name"></div>
          <div class="mr-lp-field"><label for="mr-lp-contact">Phone or Email <i>*</i></label>
            <input id="mr-lp-contact" type="text" placeholder="Phone / WhatsApp number or email" autocomplete="off"></div>
          <div class="mr-lp-field"><label for="mr-lp-heard">How did you find our website? <i>*</i></label>
            <select id="mr-lp-heard">${opts(HEARD_FROM, 'Select an option')}</select></div>
          <div class="mr-lp-field"><label for="mr-lp-purpose">Purpose of your visit <i>*</i></label>
            <select id="mr-lp-purpose">${opts(PURPOSES, 'Select an option')}</select></div>
          <div class="mr-lp-field"><label for="mr-lp-service">Service you need <i>*</i></label>
            <select id="mr-lp-service">${opts(SERVICES, 'Select a service')}</select></div>
          <input class="mr-lp-hp" id="mr-lp-website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" class="mr-lp-submit">SUBMIT →</button>
          <p class="mr-lp-status" role="status" aria-live="polite"></p>
          <button type="button" class="mr-lp-later">Maybe later</button>
        </form>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('mr-show'));

  const $ = (id) => overlay.querySelector('#' + id);
  const form = overlay.querySelector('form');
  const submitBtn = overlay.querySelector('.mr-lp-submit');
  const status = overlay.querySelector('.mr-lp-status');
  setTimeout(() => $('mr-lp-name').focus({ preventScroll: true }), 350);

  let finished = false;
  function close(cb) {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('mr-show');
    document.body.style.overflow = prevOverflow;
    setTimeout(() => overlay.remove(), 300);
    cb();
  }
  let submitted = false;
  const dismiss = () => close(submitted ? () => {} : onDismiss);
  function onKey(e) { if (e.key === 'Escape') dismiss(); }
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.mr-lp-close').addEventListener('click', dismiss);
  overlay.querySelector('.mr-lp-later').addEventListener('click', dismiss);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) dismiss(); });

  const say = (msg, color) => { status.style.color = color; status.textContent = msg; status.style.display = 'block'; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ($('mr-lp-website').value) return; // bot trap

    const name = $('mr-lp-name').value.trim();
    const contact = $('mr-lp-contact').value.trim();
    const heardFrom = $('mr-lp-heard').value;
    const purpose = $('mr-lp-purpose').value;
    const service = $('mr-lp-service').value;

    if (!name || !contact || !heardFrom || !purpose || !service) {
      return say('Please fill in all the fields.', '#ff0080');
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = contact.replace(/\D/g, '').length >= 10 && /^[+\d\s()-]+$/.test(contact);
    if (!isEmail && !isPhone) {
      return say('Enter a valid phone number (10+ digits) or email address.', '#ff0080');
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
    status.style.display = 'none';

    // keys name / contact / service / budget are what the admin panel already reads
    const data = { name, contact, service, budget: '-', heardFrom, purpose };

    try {
      const { db } = await import('./firebase-config.js');
      const { collection, addDoc, serverTimestamp } = await import(FIRESTORE_SDK);
      await addDoc(collection(db, 'enquiries'), {
        ...data, source: 'Popup', page: location.pathname, timestamp: serverTimestamp()
      });
      fetch(WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'Popup', page: location.pathname })
      }).catch(err => console.error('Notification routing dropped:', err));

      if (typeof fbq === 'function') fbq('track', 'Lead');
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'popup' });

      $('mr-lp-main').innerHTML = `
        <div class="mr-lp-thanks"><span class="mr-ico">✅</span>
        <h3>Thank You!</h3><p>We've received your details and will contact you within 24 hours.</p></div>`;
      submitted = true;
      onSuccess();                       // mark as done immediately (even if tab is closed right away)
      setTimeout(() => close(() => {}), 2800);
    } catch (err) {
      console.error('Popup submission failed:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT →';
      say('Could not send. Please try again or WhatsApp us directly.', '#ff0080');
    }
  });
}
