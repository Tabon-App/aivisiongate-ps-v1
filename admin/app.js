/* =========================================================
   AI VISION GATE — Admin Dashboard
   app.js — sidebar nav, overview, tables, reports, settings
   ========================================================= */

// Fallback data (used if data.json can't be fetched, e.g. opened via file://)
const DEFAULT_DATA = {
  village: { name: "หมู่บ้านพฤกษา แอร์พอร์ต-มะลิวัลย์", totalHouses: 11, totalVehicles: 16 },
  overview: {
    stats: { houses: 11, vehicles: 16, todayEntries: 24, todayVisitors: 3 },
    hourly: [
      { hour: "08:00", count: 3 }, { hour: "09:00", count: 5 }, { hour: "10:00", count: 2 },
      { hour: "11:00", count: 1 }, { hour: "12:00", count: 2 }, { hour: "13:00", count: 1 },
      { hour: "14:00", count: 2 }, { hour: "15:00", count: 1 }, { hour: "16:00", count: 2 },
      { hour: "17:00", count: 3 }, { hour: "18:00", count: 1 }, { hour: "19:00", count: 1 }
    ],
    recentActivity: [
      { time: "09:46", house: "53/89", plate: "กฎ 8907 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
      { time: "09:42", house: "53/34", plate: "1กง 3402 ขอนแก่น", meta: "RESIDENT · AUTO EXIT", status: "ok", statusText: "AUTO" },
      { time: "09:41", house: "53/12", plate: "กฆ 2201 ขอนแก่น", meta: "RESIDENT · AUTO ENTRY", status: "ok", statusText: "AUTO" },
      { time: "09:35", house: "7/1", plate: "กค 9999 ขอนแก่น", meta: "GUEST · นัดล่วงหน้า", status: "ok", statusText: "AUTO" },
      { time: "09:20", house: "—", plate: "8กษ 3344 กรุงเทพมหานคร", meta: "VISITOR · DENIED", status: "danger", statusText: "DENIED" }
    ]
  },
  residents: [
    { house: "431/3", owner: "นาย ฐปนัท ใบแสง", pin: "4313", phone: "0982254566", username: "resident1", vehicleCount: 1 },
    { house: "53/12", owner: "นาย สมชาย ศรีสุวรรณ", pin: "5312", phone: "0812345601", username: "resident2", vehicleCount: 1 },
    { house: "53/34", owner: "นางสาว พิมพ์ชนก รุ่งเรืองกิจ", pin: "5334", phone: "0823456712", username: "resident3", vehicleCount: 1 },
    { house: "53/45", owner: "นาย วิชัย ทองมาก", pin: "5345", phone: "0834567823", username: "resident4", vehicleCount: 2 },
    { house: "53/67", owner: "นาง สมหญิง แก้วมณีรัตน์", pin: "5367", phone: "0845678934", username: "resident5", vehicleCount: 1 },
    { house: "53/78", owner: "นาย ธีรพงษ์ บุญประเสริฐ", pin: "5378", phone: "0856789045", username: "resident6", vehicleCount: 1 },
    { house: "53/89", owner: "นางสาว อรุณี จันทร์เพ็ญ", pin: "5389", phone: "0867890156", username: "resident7", vehicleCount: 2 },
    { house: "53/91", owner: "นาย ประเสริฐ มั่งมีทรัพย์", pin: "5391", phone: "0878901267", username: "resident8", vehicleCount: 1 },
    { house: "53/15", owner: "นาง วรรณา ใจบุญ", pin: "5315", phone: "0889012378", username: "resident9", vehicleCount: 1 },
    { house: "53/28", owner: "นาย กิตติพงศ์ ศักดิ์สิทธิ์เจริญ", pin: "5328", phone: "0890123489", username: "resident10", vehicleCount: 1 },
    { house: "53/40", owner: "นางสาว จันทร์ฉาย รัตนวงศ์", pin: "5340", phone: "0801234590", username: "resident11", vehicleCount: 1 }
  ],
  vehicles: [
    { plate: "กข 1234 ขอนแก่น", owner: "นายสมชาย ใจดี", house: "12/3", phone: "0812345678", info: "—" },
    { plate: "5กข 678 ขอนแก่น", owner: "นางสาวสมหญิง รักดี", house: "45", phone: "0898765432", info: "—" },
    { plate: "กค 9999 ขอนแก่น", owner: "นายวิชัย มั่งมี", house: "7/1", phone: "0811111111", info: "—" },
    { plate: "3 ขษ 821 กรุงเทพมหานคร", owner: "นายฐปนัท ใบแสง", house: "431/3", phone: "0982254566", info: "—" },
    { plate: "กฆ 2201 ขอนแก่น", owner: "นาย สมชาย ศรีสุวรรณ", house: "53/12", phone: "0812345601", info: "Toyota Vios สีขาว (รถยนต์)" },
    { plate: "1กง 3402 ขอนแก่น", owner: "นางสาว พิมพ์ชนก รุ่งเรืองกิจ", house: "53/34", phone: "0823456712", info: "Honda City สีเทา (รถยนต์)" },
    { plate: "กจ 4503 ขอนแก่น", owner: "นาย วิชัย ทองมาก", house: "53/45", phone: "0834567823", info: "Mazda 2 สีแดง (รถยนต์)" },
    { plate: "ขฉ 4504 ขอนแก่น", owner: "นาย วิชัย ทองมาก", house: "53/45", phone: "0834567823", info: "Honda Wave 110 สีดำ-แดง (มอเตอร์ไซค์)" },
    { plate: "กณ 6705 ขอนแก่น", owner: "นาง สมหญิง แก้วมณีรัตน์", house: "53/67", phone: "0845678934", info: "Isuzu D-Max สีบรอนซ์เงิน (กระบะ)" },
    { plate: "2กญ 7806 ขอนแก่น", owner: "นาย ธีรพงษ์ บุญประเสริฐ", house: "53/78", phone: "0856789045", info: "Toyota Camry สีดำ (รถยนต์)" },
    { plate: "กฎ 8907 ขอนแก่น", owner: "นางสาว อรุณี จันทร์เพ็ญ", house: "53/89", phone: "0867890156", info: "Honda HR-V สีขาวมุก (รถยนต์)" },
    { plate: "ขฎ 8908 ขอนแก่น", owner: "นางสาว อรุณี จันทร์เพ็ญ", house: "53/89", phone: "0867890156", info: "Yamaha Fino สีฟ้า (มอเตอร์ไซค์)" },
    { plate: "3กฐ 9109 ขอนแก่น", owner: "นาย ประเสริฐ มั่งมีทรัพย์", house: "53/91", phone: "0878901267", info: "Ford Ranger สีขาว (กระบะ)" },
    { plate: "กฑ 1510 ขอนแก่น", owner: "นาง วรรณา ใจบุญ", house: "53/15", phone: "0889012378", info: "Nissan Almera สีเทา (รถยนต์)" },
    { plate: "4กฒ 2811 ขอนแก่น", owner: "นาย กิตติพงศ์ ศักดิ์สิทธิ์เจริญ", house: "53/28", phone: "0890123489", info: "Honda Civic สีดำ (รถยนต์)" },
    { plate: "กฑ 4012 ขอนแก่น", owner: "นางสาว จันทร์ฉาย รัตนวงศ์", house: "53/40", phone: "0801234590", info: "MG ZS สีน้ำเงิน (รถยนต์)" }
  ],
  reports: {
    weekly: [
      { day: "จันทร์", entries: 38, exits: 36 },
      { day: "อังคาร", entries: 41, exits: 39 },
      { day: "พุธ", entries: 35, exits: 33 },
      { day: "พฤหัสบดี", entries: 44, exits: 42 },
      { day: "ศุกร์", entries: 50, exits: 47 },
      { day: "เสาร์", entries: 29, exits: 28 },
      { day: "อาทิตย์", entries: 24, exits: 23 }
    ],
    byGate: [
      { gate: "Gate A — ทางเข้าหลัก", entries: 252, exits: 9 },
      { gate: "Gate B — ทางออก", entries: 9, exits: 239 }
    ]
  },
  settings: {
    villageName: "หมู่บ้านพฤกษา แอร์พอร์ต-มะลิวัลย์",
    gates: ["Gate A — ทางเข้าหลัก", "Gate B — ทางออก"],
    toggles: [
      { id: "pinFallback", label: "เปิดใช้ PIN สำรองเมื่อ AI จดจำป้ายทะเบียนไม่ได้", value: true },
      { id: "sosLine", label: "แจ้งเตือน SOS ไปยัง LINE กลุ่มนิติบุคคล", value: true },
      { id: "guestPrereg", label: "อนุญาตให้ลูกบ้าน Pre-register แขกล่วงหน้า", value: true },
      { id: "autoLog", label: "บันทึก Log อัตโนมัติทุกครั้งที่มีการเข้า-ออก", value: true },
      { id: "guardOverride", label: "อนุญาตให้ รปภ. Override อนุมัติแทนลูกบ้านได้", value: true }
    ]
  }
};

let appData = null;
let pinRevealed = false;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => { if (!res.ok) throw new Error('no data.json'); return res.json(); })
    .then(data => { appData = data; init(); })
    .catch(() => { appData = JSON.parse(JSON.stringify(DEFAULT_DATA)); init(); });
});

function init(){
  renderSidebar();
  setupNav();
  renderOverview();
  renderResidents();
  renderVehicles();
  renderReports();
  renderSettings();
  setupSearches();
  setupPinToggle();
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

// ---------- Sidebar / nav ----------
function renderSidebar(){
  document.getElementById('sidebar-village').textContent = appData.village.name;
}
function setupNav(){
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
    });
  });
}

// ---------- Overview ----------
function renderOverview(){
  const stats = appData.overview.stats;
  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card"><div class="stat-value">${stats.houses}</div><div class="stat-label">บ้านทั้งหมด</div></div>
    <div class="stat-card"><div class="stat-value">${stats.vehicles}</div><div class="stat-label">รถที่ลงทะเบียน</div></div>
    <div class="stat-card"><div class="stat-value">${stats.todayEntries}</div><div class="stat-label">เข้า-ออกวันนี้</div></div>
    <div class="stat-card"><div class="stat-value">${stats.todayVisitors}</div><div class="stat-label">ผู้มาติดต่อวันนี้</div></div>`;
  renderHourlyChart();
  renderOverviewActivity();
}
function renderHourlyChart(){
  const data = appData.overview.hourly;
  const max = Math.max(...data.map(d => d.count));
  document.getElementById('hourly-chart').innerHTML = data.map(d => {
    const h = Math.max(4, Math.round((d.count / max) * 100));
    return `
      <div class="bar-col">
        <div class="bar-pair">
          <div class="bar entries" style="height:${h}%"></div>
        </div>
        <div class="bar-label">${d.hour}</div>
      </div>`;
  }).join('');
}
function activityRowHTML(entry){
  const houseLabel = entry.house !== '—' ? entry.house + ' · ' : '';
  return `
    <div class="activity-row">
      <span class="dot ${entry.status}"></span>
      <div class="activity-row-main">
        <div class="activity-row-title">${entry.plate}</div>
        <div class="activity-row-meta">${houseLabel}${entry.meta}</div>
      </div>
      <div class="activity-row-right">
        <span class="activity-row-time">${entry.time}</span>
        <span class="activity-row-status">● ${entry.statusText}</span>
      </div>
    </div>`;
}
function renderOverviewActivity(){
  document.getElementById('overview-activity').innerHTML =
    appData.overview.recentActivity.map(activityRowHTML).join('');
}

// ---------- Residents ----------
function residentRowHTML(r){
  const pinDisplay = pinRevealed ? r.pin : '••••';
  return `
    <tr data-search="${(r.house + ' ' + r.owner).toLowerCase()}">
      <td class="mono">${r.house}</td>
      <td>${r.owner}</td>
      <td class="mono">${pinDisplay}</td>
      <td class="mono dim">${r.phone}</td>
      <td class="dim">${r.username}</td>
      <td class="mono">${r.vehicleCount}</td>
    </tr>`;
}
function renderResidents(){
  document.getElementById('residents-tbody').innerHTML = appData.residents.map(residentRowHTML).join('');
}
function setupPinToggle(){
  const btn = document.getElementById('toggle-pin');
  btn.addEventListener('click', () => {
    pinRevealed = !pinRevealed;
    btn.textContent = pinRevealed ? 'ซ่อน PIN' : 'แสดง PIN';
    btn.classList.toggle('is-active', pinRevealed);
    renderResidents();
    applyTableFilter('residents-search', 'residents-tbody');
  });
}

// ---------- Vehicles ----------
function vehicleRowHTML(v){
  return `
    <tr data-search="${(v.plate + ' ' + v.house + ' ' + v.owner).toLowerCase()}">
      <td class="mono">${v.plate}</td>
      <td>${v.owner}</td>
      <td class="mono">${v.house}</td>
      <td class="mono dim">${v.phone}</td>
      <td class="dim">${v.info}</td>
    </tr>`;
}
function renderVehicles(){
  document.getElementById('vehicles-tbody').innerHTML = appData.vehicles.map(vehicleRowHTML).join('');
}

// ---------- Table search filter ----------
function setupSearches(){
  document.getElementById('residents-search').addEventListener('input', () => applyTableFilter('residents-search', 'residents-tbody'));
  document.getElementById('vehicles-search').addEventListener('input', () => applyTableFilter('vehicles-search', 'vehicles-tbody'));
}
function applyTableFilter(inputId, tbodyId){
  const q = document.getElementById(inputId).value.trim().toLowerCase();
  const tbody = document.getElementById(tbodyId);
  const rows = tbody.querySelectorAll('tr[data-search]');
  let visibleCount = 0;
  rows.forEach(row => {
    const match = !q || row.dataset.search.includes(q);
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });
  let emptyRow = tbody.querySelector('tr.empty-row');
  if (visibleCount === 0){
    if (!emptyRow){
      const colCount = tbody.closest('table').querySelectorAll('thead th').length;
      tbody.insertAdjacentHTML('beforeend', `<tr class="empty-row"><td colspan="${colCount}" class="no-results">ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>`);
    }
  } else if (emptyRow){
    emptyRow.remove();
  }
}

// ---------- Reports ----------
function renderReports(){
  renderWeeklyChart();
  renderGateSummary();
}
function renderWeeklyChart(){
  const data = appData.reports.weekly;
  const max = Math.max(...data.flatMap(d => [d.entries, d.exits]));
  document.getElementById('weekly-chart').innerHTML = data.map(d => {
    const he = Math.max(4, Math.round((d.entries / max) * 100));
    const hx = Math.max(4, Math.round((d.exits / max) * 100));
    return `
      <div class="bar-col">
        <div class="bar-pair">
          <div class="bar entries" style="height:${he}%"></div>
          <div class="bar exits" style="height:${hx}%"></div>
        </div>
        <div class="bar-label">${d.day}</div>
      </div>`;
  }).join('');
}
function renderGateSummary(){
  document.getElementById('gate-summary-tbody').innerHTML = appData.reports.byGate.map(g => `
    <tr>
      <td>${g.gate}</td>
      <td class="mono">${g.entries}</td>
      <td class="mono">${g.exits}</td>
      <td class="mono">${g.entries + g.exits}</td>
    </tr>`).join('');
}

// ---------- Settings ----------
function renderSettings(){
  document.getElementById('settings-village-name').textContent = appData.settings.villageName;
  document.getElementById('settings-total-houses').textContent = appData.village.totalHouses + ' บ้าน';
  document.getElementById('settings-total-vehicles').textContent = appData.village.totalVehicles + ' คัน';

  document.getElementById('settings-gates').innerHTML = appData.settings.gates.map(g =>
    `<div class="gate-item"><span class="dot ok"></span>${g}</div>`
  ).join('');

  renderToggles();
}
function renderToggles(){
  const container = document.getElementById('settings-toggles');
  container.innerHTML = appData.settings.toggles.map(t => `
    <div class="settings-row">
      <span class="s-label">${t.label}</span>
      <div class="toggle ${t.value ? 'on' : ''}" data-id="${t.id}"><div class="thumb"></div></div>
    </div>`).join('');

  container.querySelectorAll('.toggle').forEach(el => {
    el.addEventListener('click', () => {
      const t = appData.settings.toggles.find(x => x.id === el.dataset.id);
      t.value = !t.value;
      el.classList.toggle('on', t.value);
    });
  });
}
