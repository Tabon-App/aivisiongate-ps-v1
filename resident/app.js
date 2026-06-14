/* =========================================================
   AI VISION GATE — Resident App
   app.js — UI logic, mock data, interactions
   ========================================================= */

// Fallback data (used if data.json can't be fetched, e.g. opened via file://)
const DEFAULT_DATA = {
  house: { number: "431/3", owner: "คุณ ฐปนัท ใบแสง", phone: "098-225-4566", pin: "4313" },
  vehicleStatus: { plate: "กข 1234 ขอนแก่น", label: "IN COMPOUND · ENTERED 09:41" },
  notifications: [
    { id: "visitor_request", demoLabel: "คำขอเข้าพบ", guestName: "คุณสมชาย ใจดี", idNumber: "1-XXXX-XXXXX-XX-X", plate: "กข 1234 ขอนแก่น", time: "09:41" },
    { id: "pin_alert", demoLabel: "PIN Override", time: "09:15" },
    { id: "guest_arrived", demoLabel: "แขกมาถึง", guestName: "คุณวิชัย มั่งมี", time: "10:02" },
    { id: "manual_exit", demoLabel: "ออกแมนนวล", time: "14:30" },
    { id: "empty", demoLabel: "ไม่มีคำขอ" }
  ],
  vehicles: [
    { plate: "กข 1234 ขอนแก่น", brand: "Toyota", color: "ขาว", type: "รถยนต์" },
    { plate: "5กข 678 ขอนแก่น", brand: "Honda", color: "เทา", type: "รถยนต์" }
  ],
  logs: [
    { group: "วันนี้ — 14 มิ.ย.", category: "resident", time: "09:41", title: "กข 1234 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { group: "วันนี้ — 14 มิ.ย.", category: "visitor", time: "09:38", title: "3 ขษ 821", meta: "VISITOR · APPROVED", status: "live", statusText: "APPROVED" },
    { group: "วันนี้ — 14 มิ.ย.", category: "visitor", time: "08:55", title: "9 กส 684", meta: "VISITOR · DENIED", status: "danger", statusText: "DENIED" },
    { group: "เมื่อวาน — 13 มิ.ย.", category: "visitor", time: "10:02", title: "กค 9999 ขอนแก่น", meta: "PRE-REGISTERED · AUTO ENTRY", status: "ok", statusText: "AUTO" },
    { group: "เมื่อวาน — 13 มิ.ย.", category: "resident", time: "09:15", title: "กข 1234 ขอนแก่น", meta: "RESIDENT · PIN OVERRIDE", status: "warn", statusText: "PIN" },
    { group: "เมื่อวาน — 13 มิ.ย.", category: "visitor", time: "14:30", title: "3 ขษ 821", meta: "VISITOR · MANUAL EXIT", status: "warn", statusText: "MANUAL" }
  ],
  preregisteredGuests: [
    { name: "คุณวิชัย มั่งมี", plate: "กค 9999 ขอนแก่น", date: "15 มิ.ย. 2569", status: "pending" },
    { name: "คุณสมหญิง รักดี", plate: "5กข 678 ขอนแก่น", date: "13 มิ.ย. 2569", status: "arrived" }
  ]
};

// Inline icons used inside JS-rendered placeholders
const ICON_USER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`;
const ICON_CAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l1.5-5h13L20 16"/><path d="M4 16h16v3H4z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/></svg>`;

let appData = null;
let countdownInterval = null;
let pinVisible = false;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => { if(!res.ok) throw new Error('no data.json'); return res.json(); })
    .then(data => { appData = data; init(); })
    .catch(() => { appData = DEFAULT_DATA; init(); });
});

function init(){
  renderDemoSwitcher();
  renderNotification('visitor_request');
  renderVehicleStatus();
  renderLogs('all');
  renderVehicles();
  renderGuests();
  renderProfile();
  bindNav();
  bindFilterTabs();
  bindVehicleForm();
}

// ---------- Navigation ----------
function showView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-view="${name}"]`);
  if(navBtn) navBtn.classList.add('active');
}

function bindNav(){
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });
}

// ---------- Toast ----------
function showToast(type, text){
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="dot ${type}"></span><span>${text}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// ---------- SOS Modal ----------
function openSOS(){ document.getElementById('sos-modal').classList.remove('hidden'); }
function closeSOS(){ document.getElementById('sos-modal').classList.add('hidden'); }
function confirmSOS(){
  closeSOS();
  showToast('danger', '● SOS SENT — แจ้งเตือน รปภ. ด่วนแล้ว');
  renderNotification('empty');
}

// ---------- Notification card variants ----------
function renderNotification(id){
  clearInterval(countdownInterval);
  const container = document.getElementById('notification-card');
  const n = appData.notifications.find(x => x.id === id) || {};

  if (id === 'visitor_request') {
    container.innerHTML = `
      <div class="notif-card" id="notif-active">
        <div class="reticle photo">
          <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
          <div class="placeholder">${ICON_USER}</div>
        </div>
        <div class="guest-name">${n.guestName}</div>
        <div class="meta-list">
          <div class="notif-meta">ID <b>${n.idNumber}</b></div>
          <div class="notif-meta">PLATE <b>${n.plate}</b></div>
          <div class="notif-meta faint">${n.time}</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-approve"><span class="dot ok"></span>อนุญาต</button>
          <button class="btn btn-ghost" id="btn-deny"><span class="dot danger"></span>ปฏิเสธ</button>
        </div>
        <div class="countdown">
          <div class="countdown-num" id="countdown-num">01:00</div>
          <span class="label">Time Remaining</span>
        </div>
      </div>`;
    document.getElementById('btn-approve').onclick = handleApprove;
    document.getElementById('btn-deny').onclick = handleDeny;
    startCountdown(60);

  } else if (id === 'pin_alert') {
    container.innerHTML = `
      <div class="notif-card simple-text">
        <div class="status-label"><span class="dot warn"></span>PIN Override Detected</div>
        <p>เวลา ${n.time} น. — กรุณายืนยันว่าเป็นเหตุการณ์ปกติ</p>
        <div class="btn-row">
          <button class="btn btn-ghost" id="btn-normal"><span class="dot ok"></span>ปกติ</button>
          <button class="btn btn-danger" onclick="openSOS()">SOS</button>
        </div>
      </div>`;
    document.getElementById('btn-normal').onclick = handleNormal;

  } else if (id === 'guest_arrived') {
    container.innerHTML = `
      <div class="notif-card simple-text">
        <div class="status-label"><span class="dot ok"></span>Guest Arrived — Auto Entry</div>
        <p>${n.guestName} — เข้าหมู่บ้านอัตโนมัติ เวลา ${n.time} น. (นัดล่วงหน้า)</p>
        <span class="link">ดูรายละเอียด</span>
      </div>`;

  } else if (id === 'manual_exit') {
    container.innerHTML = `
      <div class="notif-card simple-text">
        <div class="status-label"><span class="dot warn"></span>Manual Exit — Confirm Required</div>
        <p>รปภ. เปิดประตูแบบแมนนวล เวลา ${n.time} น. กรุณายืนยัน</p>
        <div class="btn-row">
          <button class="btn btn-ghost" id="btn-normal2"><span class="dot ok"></span>ปกติ</button>
          <button class="btn btn-danger" onclick="openSOS()">SOS</button>
        </div>
      </div>`;
    document.getElementById('btn-normal2').onclick = handleNormal;

  } else { // empty
    container.innerHTML = `
      <div class="notif-card">
        <div class="empty-state">
          <div class="reticle mini">
            <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
            <span class="dot faint"></span>
          </div>
          <span class="label">No Pending Requests</span>
          <p class="sub">ระบบจะแจ้งเตือนทันทีเมื่อมีแขกมาถึง</p>
        </div>
      </div>`;
  }

  // sync demo switcher highlight
  document.querySelectorAll('#demo-switcher .btn-sm').forEach(b => {
    b.classList.toggle('is-active', b.dataset.notif === id);
  });
}

function startCountdown(seconds){
  let remaining = seconds;
  updateCountdownDisplay(remaining);
  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      timeoutNotification();
      return;
    }
    updateCountdownDisplay(remaining);
  }, 1000);
}
function updateCountdownDisplay(sec){
  const el = document.getElementById('countdown-num');
  if (!el) return;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${s}`;
}
function timeoutNotification(){
  const card = document.getElementById('notif-active');
  if (!card) return;
  card.classList.add('dimmed');
  const btnRow = card.querySelector('.btn-row');
  if (btnRow) btnRow.innerHTML = `<div class="status-label" style="margin:0 auto;"><span class="dot faint"></span>Guard Notified</div>`;
  const cd = card.querySelector('.countdown');
  if (cd) cd.innerHTML = `<p style="font-size:12px;color:var(--dim);">รปภ. กำลังตรวจสอบ</p>`;
}

function handleApprove(){
  clearInterval(countdownInterval);
  showToast('ok', '● APPROVED — เปิดประตูให้แขกแล้ว');
  renderNotification('empty');
}
function handleDeny(){
  clearInterval(countdownInterval);
  showToast('danger', '● DENIED — แจ้งเตือน รปภ. แล้ว');
  renderNotification('empty');
}
function handleNormal(){
  showToast('ok', '● CONFIRMED — บันทึกเป็นเหตุการณ์ปกติ');
  renderNotification('empty');
}

// ---------- Demo switcher ----------
function renderDemoSwitcher(){
  const container = document.getElementById('demo-switcher');
  container.innerHTML = appData.notifications.map(n =>
    `<button class="btn-sm" data-notif="${n.id}">${n.demoLabel}</button>`
  ).join('');
  container.querySelectorAll('.btn-sm').forEach(btn => {
    btn.addEventListener('click', () => renderNotification(btn.dataset.notif));
  });
}

// ---------- Vehicle status (Home) ----------
function renderVehicleStatus(){
  document.getElementById('vs-plate').textContent = appData.vehicleStatus.plate;
  document.getElementById('vs-label').textContent = appData.vehicleStatus.label;
}

// ---------- Log ----------
function bindFilterTabs(){
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLogs(tab.dataset.filter);
    });
  });
}
function renderLogs(filter){
  const container = document.getElementById('log-list');
  let logs = appData.logs;
  if (filter !== 'all') logs = logs.filter(l => l.category === filter);

  let html = '';
  let lastGroup = '';
  logs.forEach(l => {
    if (l.group !== lastGroup) {
      html += `<div class="label-row"><span class="label">${l.group}</span></div>`;
      lastGroup = l.group;
    }
    html += `
      <div class="log-row">
        <span class="dot ${l.status}"></span>
        <div class="log-row-main">
          <div class="log-row-title">${l.title}</div>
          <div class="log-row-meta">${l.meta}</div>
        </div>
        <div class="log-row-status">● ${l.statusText}</div>
      </div>`;
  });
  container.innerHTML = html || `<p style="color:var(--dim); font-size:12px; padding:20px 0;">ไม่มีข้อมูล</p>`;
}

// ---------- Vehicles ----------
function renderVehicles(){
  const container = document.getElementById('vehicle-list');
  container.innerHTML = appData.vehicles.map((v, i) => `
    <div class="vehicle-card">
      <div class="reticle mini">
        <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
        <div class="placeholder">${ICON_CAR}</div>
      </div>
      <div class="vehicle-card-main">
        <div class="plate">${v.plate}</div>
        <div class="sub">${v.brand} · ${v.color} · ${v.type}</div>
      </div>
      <button class="remove" onclick="removeVehicle(${i})">Remove</button>
    </div>`).join('');
}
function removeVehicle(i){
  appData.vehicles.splice(i, 1);
  renderVehicles();
  showToast('ok', '● REMOVED — ลบรถออกจากระบบแล้ว');
}
function bindVehicleForm(){
  document.getElementById('btn-add-vehicle').addEventListener('click', () => {
    document.getElementById('vehicle-form').classList.toggle('hidden');
  });
}
function submitVehicle(){
  const plate = document.getElementById('v-plate').value.trim();
  const type = document.getElementById('v-type').value;
  const brand = document.getElementById('v-brand').value.trim() || '—';
  const color = document.getElementById('v-color').value.trim() || '—';
  if (!plate) return;
  appData.vehicles.push({ plate, brand, color, type });
  renderVehicles();
  document.getElementById('vehicle-form').classList.add('hidden');
  document.getElementById('v-brand').value = '';
  document.getElementById('v-color').value = '';
  showToast('ok', '● SAVED — บันทึกรถใหม่แล้ว');
}

// ---------- Pre-register guest ----------
function renderGuests(){
  const container = document.getElementById('guest-list');
  container.innerHTML = appData.preregisteredGuests.map(g => `
    <div class="guest-row">
      <div class="guest-row-main">
        <div class="name">${g.name}</div>
        <div class="meta">${g.plate} · ${g.date}</div>
      </div>
      <div class="status-label">
        <span class="dot ${g.status === 'pending' ? 'warn' : 'ok'}"></span>
        ${g.status === 'pending' ? 'Pending' : 'Arrived'}
      </div>
    </div>`).join('');
}
function submitGuest(){
  const name = document.getElementById('g-name').value.trim();
  const plate = document.getElementById('g-plate').value.trim();
  const date = document.getElementById('g-date').value;
  if (!name || !plate) return;
  appData.preregisteredGuests.unshift({ name, plate, date: date || '—', status: 'pending' });
  renderGuests();
  document.getElementById('g-name').value = '';
  document.getElementById('g-plate').value = '';
  document.getElementById('g-date').value = '';
  document.getElementById('g-note').value = '';
  showToast('ok', '● SAVED — บันทึกการนัดแขกแล้ว');
}

// ---------- Profile ----------
function renderProfile(){
  document.getElementById('p-house').textContent = `บ้านเลขที่ ${appData.house.number}`;
  document.getElementById('p-owner').textContent = appData.house.owner;
  document.getElementById('p-phone').textContent = appData.house.phone;
  document.getElementById('p-pin').textContent = '••••';

  document.getElementById('btn-toggle-pin').addEventListener('click', () => {
    pinVisible = !pinVisible;
    document.getElementById('p-pin').textContent = pinVisible ? appData.house.pin : '••••';
  });

  document.getElementById('toggle-notif').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('on');
  });
}
