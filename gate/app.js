/* =========================================================
   AI VISION GATE — Gate Station
   app.js — kiosk state machine, mock data, interactions
   ========================================================= */

// Fallback data (used if data.json can't be fetched, e.g. opened via file://)
const DEFAULT_DATA = {
  gate: { name: "GATE A — ทางเข้าหลัก", village: "หมู่บ้านพฤกษา แอร์พอร์ต-มะลิวัลย์" },
  scenarios: {
    resident_match: { demoLabel: "รถลูกบ้าน (ตรงข้อมูล)", plate: "กฆ 2201 ขอนแก่น", house: "53/12", owner: "นาย สมชาย ศรีสุวรรณ", vehicleInfo: "Toyota Vios สีขาว", time: "09:41" },
    guest_preregistered: { demoLabel: "แขกตามนัด (Pre-register)", plate: "กค 9999 ขอนแก่น", guestName: "คุณวิชัย มั่งมี", house: "7/1", expectedDate: "14 มิ.ย. 2569", time: "09:42" },
    visitor_unknown: { demoLabel: "ผู้มาติดต่อ (ไม่มีข้อมูล)", plate: "8กษ 3344 กรุงเทพมหานคร", targetHouse: "53/45", targetOwner: "นาย วิชัย ทองมาก", time: "09:45" }
  },
  recentLog: [
    { time: "09:41", house: "53/12", plate: "กฆ 2201 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { time: "09:38", house: "53/45", plate: "ขฉ 4504 ขอนแก่น", meta: "RESIDENT (มอเตอร์ไซค์) · AUTO", status: "ok", statusText: "AUTO" },
    { time: "09:35", house: "7/1", plate: "กค 9999 ขอนแก่น", meta: "GUEST · นัดล่วงหน้า", status: "ok", statusText: "AUTO" },
    { time: "09:20", house: "—", plate: "8กษ 3344 กรุงเทพมหานคร", meta: "VISITOR · DENIED", status: "danger", statusText: "DENIED" },
    { time: "09:05", house: "53/89", plate: "กฏ 8907 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { time: "08:55", house: "431/3", plate: "3 ขษ 821 กรุงเทพมหานคร", meta: "RESIDENT · PIN OVERRIDE", status: "warn", statusText: "PIN" }
  ]
};

// Inline icons
const ICON_CAMERA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h4l2-2h6l2 2h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>`;
const ICON_CAR    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l1.5-5h13L20 16"/><path d="M4 16h16v3H4z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/></svg>`;
const ICON_ID     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8" cy="11" r="2"/><line x1="13" y1="9" x2="18" y2="9"/><line x1="13" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="10" y2="16"/></svg>`;

const DEMO_STATES = [
  { id: "idle",               label: "พร้อมใช้งาน" },
  { id: "scanning",           label: "กำลังสแกน" },
  { id: "resident_match",     label: "รถลูกบ้าน" },
  { id: "guest_preregistered",label: "แขกตามนัด" },
  { id: "visitor_unknown",    label: "ผู้มาติดต่อ" }
];

let appData = null;
let scanTimer = null;
let countdownInterval = null;
let autoReturnInterval = null;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => { if (!res.ok) throw new Error('no data.json'); return res.json(); })
    .then(data => { appData = data; init(); })
    .catch(() => { appData = DEFAULT_DATA; init(); });
});

function init(){
  renderGateInfo();
  renderRecentLog();
  renderDemoSwitcher();
  updateClock();
  setInterval(updateClock, 1000);
  renderState('idle');
}

// ---------- Clock ----------
function updateClock(){
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}
function currentTimeStr(){
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

// ---------- Gate info ----------
function renderGateInfo(){
  document.getElementById('gate-info').innerHTML =
    `${appData.gate.name}<span class="village">${appData.gate.village}</span>`;
}

// ---------- Demo switcher ----------
function renderDemoSwitcher(){
  const container = document.getElementById('demo-switcher');
  container.innerHTML = DEMO_STATES.map(s =>
    `<button class="btn-sm" data-state="${s.id}">${s.label}</button>`
  ).join('');
  container.querySelectorAll('.btn-sm').forEach(btn => {
    btn.addEventListener('click', () => renderState(btn.dataset.state));
  });
}
function highlightDemoSwitcher(id){
  document.querySelectorAll('#demo-switcher .btn-sm').forEach(b => {
    const match = b.dataset.state === id || (id.startsWith('visitor_') && b.dataset.state === 'visitor_unknown');
    b.classList.toggle('is-active', match);
  });
}

// ---------- Low-level setters ----------
function setReticleScanning(on){
  document.getElementById('main-reticle').classList.toggle('scanning', !!on);
}
function setFeed(iconSvg, label){
  document.getElementById('main-feed').innerHTML = `${iconSvg}<span class="feed-label">${label}</span>`;
}
function setPlateReadout(plate){
  const el = document.getElementById('plate-readout');
  if (!plate){ el.style.display = 'none'; return; }
  el.style.display = 'flex';
  document.getElementById('plate-value').textContent = plate;
}
function setCaptureStrip(html){
  document.getElementById('capture-strip').innerHTML = html || '';
}
function setStatusBlock({ variant, dot, label, title, sub }){
  const el = document.getElementById('status-block');
  el.className = 'status-block' + (variant ? ' ' + variant : '');
  el.innerHTML = `
    <div class="status-label"><span class="dot ${dot}"></span>${label}</div>
    <div class="status-title">${title}</div>
    <div class="status-sub">${sub}</div>`;
}
function setDetailCard(rows){
  const el = document.getElementById('detail-card');
  if (!rows){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'flex';
  el.innerHTML = rows.map(([k, v]) => `<div class="detail-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
}
function setCountdownBlock(html){
  const el = document.getElementById('countdown-block');
  if (!html){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'flex';
  el.innerHTML = html;
}

// ---------- Recent log ----------
function logRowHTML(entry){
  const houseLabel = entry.house !== '—' ? entry.house + ' · ' : '';
  return `
    <div class="log-row">
      <span class="dot ${entry.status}"></span>
      <div class="log-row-main">
        <div class="log-row-title">${entry.plate}</div>
        <div class="log-row-meta">${houseLabel}${entry.meta}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
        <span class="log-row-time">${entry.time}</span>
        <span class="log-row-status">● ${entry.statusText}</span>
      </div>
    </div>`;
}
function renderRecentLog(){
  document.getElementById('recent-log').innerHTML = appData.recentLog.map(logRowHTML).join('');
}
function prependLog(entry){
  const container = document.getElementById('recent-log');
  container.insertAdjacentHTML('afterbegin', logRowHTML(entry));
  while (container.children.length > 8) container.removeChild(container.lastChild);
}

// ---------- Timers ----------
function clearAllTimers(){
  clearTimeout(scanTimer);
  clearInterval(countdownInterval);
  clearInterval(autoReturnInterval);
  scanTimer = null;
  countdownInterval = null;
  autoReturnInterval = null;
}
function startAutoReturn(seconds){
  let remaining = seconds;
  const tick = () => {
    const el = document.getElementById('auto-return-num');
    if (el) el.textContent = remaining;
  };
  tick();
  autoReturnInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0){
      clearInterval(autoReturnInterval);
      renderState('idle');
      return;
    }
    tick();
  }, 1000);
}
function startVisitorCountdown(seconds){
  let remaining = seconds;
  const tick = () => {
    const el = document.getElementById('visitor-countdown');
    if (!el) return;
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
  };
  tick();
  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0){
      clearInterval(countdownInterval);
      renderState('visitor_timeout');
      return;
    }
    tick();
  }, 1000);
}

// ---------- Main state machine ----------
function renderState(id){
  clearAllTimers();
  highlightDemoSwitcher(id);

  switch (id){

    case 'idle':
      setReticleScanning(false);
      setFeed(ICON_CAMERA, 'WAITING FOR VEHICLE');
      setPlateReadout(null);
      setCaptureStrip('');
      setStatusBlock({
        variant: '', dot: 'live pulse', label: 'STANDBY',
        title: 'พร้อมใช้งาน',
        sub: 'ระบบกำลังรอตรวจจับยานพาหนะที่เข้ามาในระยะกล้อง'
      });
      setDetailCard(null);
      setCountdownBlock(null);
      break;

    case 'scanning':
      setReticleScanning(true);
      setFeed(ICON_CAMERA, 'ANALYZING...');
      setPlateReadout(null);
      setCaptureStrip('');
      setStatusBlock({
        variant: '', dot: 'live pulse', label: 'PROCESSING',
        title: 'กำลังสแกนป้ายทะเบียน...',
        sub: 'AI กำลังประมวลผลภาพจากกล้องหน้าด่าน'
      });
      setDetailCard(null);
      setCountdownBlock(null);
      scanTimer = setTimeout(() => renderState('resident_match'), 2500);
      break;

    case 'resident_match': {
      const s = appData.scenarios.resident_match;
      setReticleScanning(false);
      setFeed(ICON_CAR, 'VEHICLE CAPTURED');
      setPlateReadout(s.plate);
      setCaptureStrip('');
      setStatusBlock({
        variant: 'success', dot: 'ok', label: 'ACCESS GRANTED',
        title: 'อนุญาตเข้า — เปิดประตูอัตโนมัติ',
        sub: `ตรวจสอบกับฐานข้อมูลลูกบ้านสำเร็จ · กลับสู่หน้าหลักใน <span id="auto-return-num">6</span> วิ`
      });
      setDetailCard([
        ['บ้านเลขที่', s.house],
        ['เจ้าของรถ', s.owner],
        ['รถ', s.vehicleInfo],
        ['เวลา', s.time]
      ]);
      setCountdownBlock(null);
      prependLog({ time: s.time, house: s.house, plate: s.plate, meta: 'RESIDENT · AUTO ENTRY', status: 'ok', statusText: 'AUTO' });
      startAutoReturn(6);
      break;
    }

    case 'guest_preregistered': {
      const s = appData.scenarios.guest_preregistered;
      setReticleScanning(false);
      setFeed(ICON_CAR, 'VEHICLE CAPTURED');
      setPlateReadout(s.plate);
      setCaptureStrip('');
      setStatusBlock({
        variant: 'success', dot: 'ok', label: 'WELCOME',
        title: 'ยินดีต้อนรับ — แขกตามนัด',
        sub: `พบรายการนัดหมายล่วงหน้าในระบบ · กลับสู่หน้าหลักใน <span id="auto-return-num">6</span> วิ`
      });
      setDetailCard([
        ['ชื่อแขก', s.guestName],
        ['บ้านที่นัด', s.house],
        ['วันที่นัด', s.expectedDate],
        ['เวลา', s.time]
      ]);
      setCountdownBlock(null);
      prependLog({ time: s.time, house: s.house, plate: s.plate, meta: 'GUEST · นัดล่วงหน้า', status: 'ok', statusText: 'AUTO' });
      startAutoReturn(6);
      break;
    }

    case 'visitor_unknown': {
      const s = appData.scenarios.visitor_unknown;
      setReticleScanning(false);
      setFeed(ICON_CAR, 'VEHICLE CAPTURED');
      setPlateReadout(s.plate);
      setCaptureStrip(`
        <div class="reticle mini">
          <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
          <div class="feed">${ICON_ID}</div>
        </div>
        <span class="cap-label">ID Card Captured</span>`);
      setStatusBlock({
        variant: 'warn', dot: 'warn', label: 'PENDING APPROVAL',
        title: 'ไม่พบข้อมูลในระบบ',
        sub: `ส่งคำขอเข้าไปยังบ้านเลขที่ ${s.targetHouse} (${s.targetOwner}) แล้ว — กำลังรอการตอบกลับ`
      });
      setDetailCard([
        ['ทะเบียนรถ', s.plate],
        ['ติดต่อบ้าน', s.targetHouse],
        ['เจ้าบ้าน', s.targetOwner],
        ['เวลา', s.time]
      ]);
      setCountdownBlock(`
        <div class="countdown-num" id="visitor-countdown">01:00</div>
        <span class="label">Time Remaining</span>
        <div class="btn-row">
          <button class="btn btn-ghost" id="btn-sim-approve"><span class="dot ok"></span>[Demo] ลูกบ้านอนุมัติ</button>
          <button class="btn btn-ghost" id="btn-sim-deny"><span class="dot danger"></span>[Demo] ลูกบ้านปฏิเสธ</button>
        </div>`);
      document.getElementById('btn-sim-approve').onclick = () => renderState('visitor_approved');
      document.getElementById('btn-sim-deny').onclick = () => renderState('visitor_denied');
      startVisitorCountdown(60);
      break;
    }

    case 'visitor_approved': {
      const s = appData.scenarios.visitor_unknown;
      setStatusBlock({
        variant: 'success', dot: 'ok', label: 'ACCESS GRANTED',
        title: 'ลูกบ้านอนุมัติแล้ว',
        sub: `เปิดประตูให้ผู้มาติดต่อ · กลับสู่หน้าหลักใน <span id="auto-return-num">6</span> วิ`
      });
      setCountdownBlock(null);
      prependLog({ time: currentTimeStr(), house: s.targetHouse, plate: s.plate, meta: 'VISITOR · APPROVED', status: 'ok', statusText: 'APPROVED' });
      startAutoReturn(6);
      break;
    }

    case 'visitor_denied': {
      const s = appData.scenarios.visitor_unknown;
      setStatusBlock({
        variant: 'danger', dot: 'danger', label: 'ACCESS DENIED',
        title: 'ลูกบ้านปฏิเสธ',
        sub: `กรุณาติดต่อ รปภ. เพื่อดำเนินการต่อ · กลับสู่หน้าหลักใน <span id="auto-return-num">6</span> วิ`
      });
      setCountdownBlock(null);
      prependLog({ time: currentTimeStr(), house: s.targetHouse, plate: s.plate, meta: 'VISITOR · DENIED', status: 'danger', statusText: 'DENIED' });
      startAutoReturn(6);
      break;
    }

    case 'visitor_timeout': {
      const s = appData.scenarios.visitor_unknown;
      setStatusBlock({
        variant: 'warn', dot: 'warn', label: 'NO RESPONSE',
        title: 'ไม่มีการตอบกลับจากลูกบ้าน',
        sub: `ระบบแจ้งเตือน รปภ. ให้ตรวจสอบแทน · กลับสู่หน้าหลักใน <span id="auto-return-num">6</span> วิ`
      });
      setCountdownBlock(null);
      prependLog({ time: currentTimeStr(), house: s.targetHouse, plate: s.plate, meta: 'VISITOR · NO RESPONSE', status: 'warn', statusText: 'TIMEOUT' });
      startAutoReturn(6);
      break;
    }
  }
}

// ---------- Intercom modal ----------
function openIntercom(){ document.getElementById('intercom-modal').classList.remove('hidden'); }
function closeIntercom(){ document.getElementById('intercom-modal').classList.add('hidden'); }
