/* =========================================================
   AI VISION GATE — Guard Dashboard
   app.js — live feed, alerts, pending approvals, gate control
   ========================================================= */

// Fallback data (used if data.json can't be fetched, e.g. opened via file://)
const DEFAULT_DATA = {
  station: { name: "ป้อมยาม — รักษาความปลอดภัย", village: "หมู่บ้านพฤกษา แอร์พอร์ต-มะลิวัลย์" },
  gates: [
    { id: "gateA", name: "Gate A — ทางเข้าหลัก" },
    { id: "gateB", name: "Gate B — ทางออก" }
  ],
  activityFeed: [
    { time: "09:46", gate: "Gate A", house: "53/89", plate: "กฎ 8907 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { time: "09:42", gate: "Gate B", house: "53/34", plate: "1กง 3402 ขอนแก่น", meta: "RESIDENT · AUTO EXIT", status: "ok", statusText: "AUTO" },
    { time: "09:41", gate: "Gate A", house: "53/12", plate: "กฆ 2201 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { time: "09:38", gate: "Gate A", house: "53/45", plate: "ขฉ 4504 ขอนแก่น", meta: "RESIDENT (มอเตอร์ไซค์) · AUTO", status: "ok", statusText: "AUTO" },
    { time: "09:35", gate: "Gate A", house: "7/1", plate: "กค 9999 ขอนแก่น", meta: "GUEST · นัดล่วงหน้า", status: "ok", statusText: "AUTO" },
    { time: "09:20", gate: "Gate A", house: "—", plate: "8กษ 3344 กรุงเทพมหานคร", meta: "VISITOR · DENIED", status: "danger", statusText: "DENIED" },
    { time: "09:05", gate: "Gate B", house: "53/91", plate: "3กฐ 9109 ขอนแก่น", meta: "RESIDENT · AUTO EXIT", status: "ok", statusText: "AUTO" },
    { time: "08:55", gate: "Gate A", house: "431/3", plate: "3 ขษ 821 กรุงเทพมหานคร", meta: "RESIDENT · PIN OVERRIDE", status: "warn", statusText: "PIN" }
  ],
  sosScenario: { house: "53/67", name: "นาง สมหญิง แก้วมณีรัตน์", time: "09:50" },
  callScenario: { gate: "Gate A — ทางเข้าหลัก" },
  overrideScenario: { plate: "8กษ 3344 กรุงเทพมหานคร", targetHouse: "53/45", targetOwner: "นาย วิชัย ทองมาก", gate: "Gate A — ทางเข้าหลัก", time: "09:52" }
};

const DEMO_STATES = [
  { id: "normal",   label: "ปกติ" },
  { id: "sos",      label: "SOS จากลูกบ้าน" },
  { id: "call",     label: "สายเรียกจาก Gate A" },
  { id: "override", label: "ผู้มาติดต่อรอเกินเวลา" }
];

let appData = null;
let pendingItems = [];
let gateStates = {}; // gateId -> 'online' | 'opening' | 'open'

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => { if (!res.ok) throw new Error('no data.json'); return res.json(); })
    .then(data => { appData = data; init(); })
    .catch(() => { appData = JSON.parse(JSON.stringify(DEFAULT_DATA)); init(); });
});

function init(){
  initGateStates();
  renderStationInfo();
  renderGateStatusGroup();
  renderActivityFeed();
  renderPendingList();
  renderGateControls();
  renderDemoSwitcher();
  setupSearch();
  updateClock();
  setInterval(updateClock, 1000);
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

// ---------- Station info ----------
function renderStationInfo(){
  document.getElementById('station-info').innerHTML =
    `${appData.station.name}<span class="village">${appData.station.village}</span>`;
}

// ---------- Gate states ----------
function initGateStates(){
  appData.gates.forEach(g => { gateStates[g.id] = 'online'; });
}
function renderGateStatusGroup(){
  const container = document.getElementById('gate-status-group');
  container.innerHTML = appData.gates.map(g => {
    const st = gateStates[g.id];
    const dotClass = st === 'online' ? 'ok' : (st === 'opening' ? 'live pulse' : 'warn');
    const label = g.name.split(' — ')[0];
    return `<div class="gs-item"><span class="dot ${dotClass}"></span>${label}</div>`;
  }).join('');
}

// ---------- Gate control panel ----------
function renderGateControls(){
  const container = document.getElementById('gate-controls');
  container.innerHTML = appData.gates.map(g => {
    const st = gateStates[g.id];
    let statusText, dotClass, btnText, disabled = '';
    if (st === 'online'){ statusText = 'ออนไลน์ · ปิดปกติ'; dotClass = 'ok'; btnText = 'เปิดประตู (Manual)'; }
    else if (st === 'opening'){ statusText = 'กำลังเปิด...'; dotClass = 'live pulse'; btnText = 'กำลังเปิด...'; disabled = 'disabled'; }
    else { statusText = 'เปิดอยู่'; dotClass = 'warn'; btnText = 'เปิดอยู่'; disabled = 'disabled'; }
    return `
      <div class="gate-control-row">
        <div class="gc-info">
          <span class="gc-name">${g.name}</span>
          <span class="gc-status"><span class="dot ${dotClass}"></span>${statusText}</span>
        </div>
        <button class="btn-sm" data-gate="${g.id}" ${disabled}>${btnText}</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.btn-sm').forEach(btn => {
    if (!btn.disabled) btn.onclick = () => openGate(btn.dataset.gate);
  });
}
function openGate(gateId){
  if (gateStates[gateId] !== 'online') return;
  gateStates[gateId] = 'opening';
  renderGateControls();
  renderGateStatusGroup();
  setTimeout(() => {
    gateStates[gateId] = 'open';
    renderGateControls();
    renderGateStatusGroup();
    const g = appData.gates.find(x => x.id === gateId);
    prependFeed({ time: currentTimeStr(), gate: g.name.split(' — ')[0], house: '—', plate: '—', meta: 'MANUAL OPEN · BY GUARD', status: 'warn', statusText: 'MANUAL' });
    setTimeout(() => {
      gateStates[gateId] = 'online';
      renderGateControls();
      renderGateStatusGroup();
    }, 5000);
  }, 1200);
}

// ---------- Activity feed ----------
function feedRowHTML(entry){
  const houseLabel = entry.house !== '—' ? entry.house + ' · ' : '';
  const searchKey = (entry.plate + ' ' + entry.house).toLowerCase();
  return `
    <div class="feed-row" data-search="${searchKey}">
      <span class="dot ${entry.status}"></span>
      <div class="feed-row-main">
        <div class="feed-row-title">${entry.plate}</div>
        <div class="feed-row-meta">${houseLabel}${entry.meta}</div>
      </div>
      <div class="feed-row-gate">${entry.gate}</div>
      <div class="feed-row-right">
        <span class="feed-row-time">${entry.time}</span>
        <span class="feed-row-status">● ${entry.statusText}</span>
      </div>
    </div>`;
}
function renderActivityFeed(){
  const container = document.getElementById('feed-list');
  if (appData.activityFeed.length === 0){
    container.innerHTML = `<div class="feed-empty">ไม่มีกิจกรรม</div>`;
    return;
  }
  container.innerHTML = appData.activityFeed.map(feedRowHTML).join('');
  applySearchFilter();
}
function prependFeed(entry){
  appData.activityFeed.unshift(entry);
  renderActivityFeed();
}
function setupSearch(){
  document.getElementById('feed-search').addEventListener('input', applySearchFilter);
}
function applySearchFilter(){
  const q = document.getElementById('feed-search').value.trim().toLowerCase();
  document.querySelectorAll('#feed-list .feed-row').forEach(row => {
    const match = !q || row.dataset.search.includes(q);
    row.style.display = match ? 'flex' : 'none';
  });
}

// ---------- Pending approvals ----------
function renderPendingList(){
  const container = document.getElementById('pending-list');
  if (pendingItems.length === 0){
    container.innerHTML = `<div class="empty-state">ไม่มีคำขอที่รออนุมัติในขณะนี้</div>`;
    return;
  }
  container.innerHTML = pendingItems.map(p => `
    <div class="pending-card">
      <span class="pc-badge">เกินเวลารออนุมัติ</span>
      <div class="pc-row"><span class="k">ทะเบียนรถ</span><span class="v">${p.plate}</span></div>
      <div class="pc-row"><span class="k">ติดต่อบ้าน</span><span class="v">${p.targetHouse}</span></div>
      <div class="pc-row"><span class="k">เจ้าบ้าน</span><span class="v">${p.targetOwner}</span></div>
      <div class="pc-row"><span class="k">ประตู</span><span class="v">${p.gate.split(' — ')[0]}</span></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-override-approve" data-plate="${p.plate}"><span class="dot ok"></span>อนุมัติ (Override)</button>
        <button class="btn btn-ghost btn-override-deny" data-plate="${p.plate}"><span class="dot danger"></span>ปฏิเสธ (Override)</button>
      </div>
    </div>`).join('');

  container.querySelectorAll('.btn-override-approve').forEach(btn => btn.onclick = () => resolveOverride(btn.dataset.plate, true));
  container.querySelectorAll('.btn-override-deny').forEach(btn => btn.onclick = () => resolveOverride(btn.dataset.plate, false));
}
function addOverridePending(){
  const s = appData.overrideScenario;
  if (pendingItems.find(p => p.plate === s.plate)) return;
  pendingItems.push({ ...s });
  renderPendingList();
}
function resolveOverride(plate, approved){
  const item = pendingItems.find(p => p.plate === plate);
  if (!item) return;
  pendingItems = pendingItems.filter(p => p.plate !== plate);
  renderPendingList();
  prependFeed({
    time: currentTimeStr(),
    gate: item.gate.split(' — ')[0],
    house: item.targetHouse,
    plate: item.plate,
    meta: approved ? 'VISITOR · GUARD OVERRIDE APPROVED' : 'VISITOR · GUARD OVERRIDE DENIED',
    status: approved ? 'ok' : 'danger',
    statusText: approved ? 'OVERRIDE' : 'DENIED'
  });
}

// ---------- Alert banner (SOS / incoming call) ----------
function showAlertBanner(type){
  const el = document.getElementById('alert-banner');
  el.classList.remove('hidden', 'sos', 'call');
  el.classList.add(type);

  if (type === 'sos'){
    const s = appData.sosScenario;
    el.innerHTML = `
      <div class="alert-text"><span class="dot danger pulse"></span>SOS — บ้าน ${s.house} (${s.name}) กดขอความช่วยเหลือฉุกเฉิน</div>
      <button class="btn btn-ghost" id="btn-ack-sos">รับทราบ</button>`;
    document.getElementById('btn-ack-sos').onclick = () => {
      hideAlertBanner();
      prependFeed({ time: currentTimeStr(), gate: '—', house: s.house, plate: '—', meta: 'SOS · ACKNOWLEDGED BY GUARD', status: 'danger', statusText: 'SOS' });
    };
  } else if (type === 'call'){
    const c = appData.callScenario;
    el.innerHTML = `
      <div class="alert-text"><span class="dot live pulse"></span>สายเรียกเข้าจาก ${c.gate}</div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="btn-accept-call">รับสาย</button>
        <button class="btn btn-ghost" id="btn-decline-call">ปฏิเสธ</button>
      </div>`;
    document.getElementById('btn-accept-call').onclick = () => { hideAlertBanner(); openCallModal(c.gate); };
    document.getElementById('btn-decline-call').onclick = () => hideAlertBanner();
  }
}
function hideAlertBanner(){
  const el = document.getElementById('alert-banner');
  el.classList.add('hidden');
  el.innerHTML = '';
}

// ---------- Call modal ----------
function openCallModal(gateName){
  document.getElementById('call-modal-text').textContent = `กำลังเชื่อมต่อกับ ${gateName}...`;
  document.getElementById('call-modal').classList.remove('hidden');
}
function endCall(){
  document.getElementById('call-modal').classList.add('hidden');
}

// ---------- Demo switcher ----------
function renderDemoSwitcher(){
  const container = document.getElementById('demo-switcher');
  container.innerHTML = DEMO_STATES.map(s => `<button class="btn-sm" data-state="${s.id}">${s.label}</button>`).join('');
  container.querySelectorAll('.btn-sm').forEach(btn => {
    btn.addEventListener('click', () => handleDemo(btn.dataset.state));
  });
}
function highlightDemo(id){
  document.querySelectorAll('#demo-switcher .btn-sm').forEach(b => {
    b.classList.toggle('is-active', b.dataset.state === id);
  });
}
function handleDemo(id){
  highlightDemo(id);
  switch (id){
    case 'normal':
      hideAlertBanner();
      endCall();
      pendingItems = [];
      renderPendingList();
      break;
    case 'sos':
      showAlertBanner('sos');
      break;
    case 'call':
      showAlertBanner('call');
      break;
    case 'override':
      addOverridePending();
      break;
  }
}
