/* =============================================
   MediCore HMS — app.js
   Frontend logic (connects to Python/Flask backend)
   ============================================= */

// ── CONFIG ──────────────────────────────────────────
const API = "http://localhost:5000/api";   // Flask backend URL

// ── STATE ───────────────────────────────────────────
let patients = [];
let doctors  = [];
let appointments = [];
let editingId = null;

// ── HELPERS ─────────────────────────────────────────
async function apiFetch(url, method = "GET", body = null) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + url, opts);
    return await res.json();
  } catch (err) {
    // Fallback to localStorage when backend is not running
    return null;
  }
}

function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " error" : "");
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function openModal(id) {
  editingId = null;
  document.getElementById(id).classList.remove("hidden");
  // Reset selects for appointment
  if (id === "appointmentModal") populateAppointmentDropdowns();
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  clearForm(id);
}
function clearForm(modalId) {
  document.querySelectorAll(`#${modalId} input, #${modalId} select`).forEach(el => {
    if (el.type !== "hidden") el.value = "";
  });
}

// ── AUTH ─────────────────────────────────────────────
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const err      = document.getElementById("loginError");

  if (!username || !password) {
    err.textContent = "Please enter username and password.";
    err.classList.remove("hidden"); return;
  }

  // Try backend first
  const data = await apiFetch("/login", "POST", { username, password });

  // Fallback: demo credentials
  const valid = (data && data.success) || (username === "admin" && password === "admin123");

  if (valid) {
    err.classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("active");
    document.getElementById("dashboardScreen").classList.add("active");
    document.body.classList.remove("login-page");
    document.getElementById("loggedUser").textContent = username;
    loadAll();
  } else {
    err.textContent = "Invalid username or password.";
    err.classList.remove("hidden");
  }
}

function logout() {
  document.getElementById("dashboardScreen").classList.remove("active");
  document.getElementById("loginScreen").classList.add("active");
  document.body.classList.add("login-page");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Enter key triggers login
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.getElementById("loginScreen").classList.contains("active")) login();
});

// ── TAB NAVIGATION ───────────────────────────────────
function showTab(tab, el) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");

  const titles = { dashboard: ["Dashboard","Overview of your hospital today"],
    patients: ["Patients","Manage patient records"],
    doctors:  ["Doctors","Manage doctor profiles"],
    appointments: ["Appointments","Schedule & track appointments"] };
  document.getElementById("pageTitle").textContent    = titles[tab][0];
  document.getElementById("pageSubtitle").textContent = titles[tab][1];

  if (tab === "dashboard") updateStats();
}

// ── LOAD ALL DATA ────────────────────────────────────
async function loadAll() {
  await loadPatients();
  await loadDoctors();
  await loadAppointments();
  updateStats();
}

// ──────────────────────────────────────────────────────
//  PATIENTS
// ──────────────────────────────────────────────────────
async function loadPatients() {
  const data = await apiFetch("/patients");
  if (data) {
    patients = data;
    saveLocal("patients", patients);
  } else {
    patients = loadLocal("patients");
  }
  renderPatients();
}

function renderPatients() {
  const tbody = document.getElementById("patientBody");
  tbody.innerHTML = "";
  patients.forEach((p, i) => {
    tbody.innerHTML += `
      <tr data-search="${(p.name+p.disease+p.mobile).toLowerCase()}">
        <td>${i+1}</td>
        <td><b>${p.name}</b></td>
        <td>${p.age}</td>
        <td><span class="tag">${p.disease}</span></td>
        <td>${p.mobile}</td>
        <td>${p.address}</td>
        <td><div class="action-btns">
          <button class="btn-icon edit" onclick="editPatient(${p.id})"><i class="fa fa-pen"></i></button>
          <button class="btn-icon del"  onclick="deletePatient(${p.id})"><i class="fa fa-trash"></i></button>
        </div></td>
      </tr>`;
  });
}

function editPatient(id) {
  const p = patients.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById("patientId").value    = p.id;
  document.getElementById("pName").value        = p.name;
  document.getElementById("pAge").value         = p.age;
  document.getElementById("pDisease").value     = p.disease;
  document.getElementById("pMobile").value      = p.mobile;
  document.getElementById("pAddress").value     = p.address;
  document.getElementById("patientModalTitle").textContent = "Edit Patient";
  openModal("patientModal");
}

async function savePatient() {
  const name    = document.getElementById("pName").value.trim();
  const age     = document.getElementById("pAge").value.trim();
  const disease = document.getElementById("pDisease").value.trim();
  const mobile  = document.getElementById("pMobile").value.trim();
  const address = document.getElementById("pAddress").value.trim();

  if (!name || !age || !disease || !mobile || !address) { showToast("All fields are required!", true); return; }

  const payload = { name, age: parseInt(age), disease, mobile, address };

  if (editingId) {
    const data = await apiFetch(`/patients/${editingId}`, "PUT", payload);
    const idx  = patients.findIndex(x => x.id === editingId);
    patients[idx] = { ...patients[idx], ...payload };
    showToast("Patient updated!");
  } else {
    payload.id = Date.now();
    const data = await apiFetch("/patients", "POST", payload);
    if (data && data.id) payload.id = data.id;
    patients.push(payload);
    showToast("Patient added!");
  }
  saveLocal("patients", patients);
  renderPatients();
  updateStats();
  closeModal("patientModal");
}

async function deletePatient(id) {
  if (!confirm("Delete this patient?")) return;
  await apiFetch(`/patients/${id}`, "DELETE");
  patients = patients.filter(x => x.id !== id);
  saveLocal("patients", patients);
  renderPatients();
  updateStats();
  showToast("Patient deleted.");
}

// ──────────────────────────────────────────────────────
//  DOCTORS
// ──────────────────────────────────────────────────────
async function loadDoctors() {
  const data = await apiFetch("/doctors");
  if (data) {
    doctors = data;
    saveLocal("doctors", doctors);
  } else {
    doctors = loadLocal("doctors");
  }
  renderDoctors();
}

function renderDoctors() {
  const tbody = document.getElementById("doctorBody");
  tbody.innerHTML = "";
  doctors.forEach((d, i) => {
    tbody.innerHTML += `
      <tr data-search="${(d.name+d.specialization).toLowerCase()}">
        <td>${i+1}</td>
        <td><b>${d.name}</b></td>
        <td>${d.age}</td>
        <td><span class="tag teal">${d.specialization}</span></td>
        <td>${d.experience} yrs</td>
        <td><div class="action-btns">
          <button class="btn-icon edit" onclick="editDoctor(${d.id})"><i class="fa fa-pen"></i></button>
          <button class="btn-icon del"  onclick="deleteDoctor(${d.id})"><i class="fa fa-trash"></i></button>
        </div></td>
      </tr>`;
  });
}

function editDoctor(id) {
  const d = doctors.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById("doctorId").value  = d.id;
  document.getElementById("dName").value     = d.name;
  document.getElementById("dAge").value      = d.age;
  document.getElementById("dSpecial").value  = d.specialization;
  document.getElementById("dExp").value      = d.experience;
  document.getElementById("doctorModalTitle").textContent = "Edit Doctor";
  openModal("doctorModal");
}

async function saveDoctor() {
  const name           = document.getElementById("dName").value.trim();
  const age            = document.getElementById("dAge").value.trim();
  const specialization = document.getElementById("dSpecial").value.trim();
  const experience     = document.getElementById("dExp").value.trim();

  if (!name || !age || !specialization || !experience) { showToast("All fields are required!", true); return; }

  const payload = { name, age: parseInt(age), specialization, experience: parseInt(experience) };

  if (editingId) {
    await apiFetch(`/doctors/${editingId}`, "PUT", payload);
    const idx = doctors.findIndex(x => x.id === editingId);
    doctors[idx] = { ...doctors[idx], ...payload };
    showToast("Doctor updated!");
  } else {
    payload.id = Date.now();
    const data = await apiFetch("/doctors", "POST", payload);
    if (data && data.id) payload.id = data.id;
    doctors.push(payload);
    showToast("Doctor added!");
  }
  saveLocal("doctors", doctors);
  renderDoctors();
  updateStats();
  closeModal("doctorModal");
}

async function deleteDoctor(id) {
  if (!confirm("Delete this doctor?")) return;
  await apiFetch(`/doctors/${id}`, "DELETE");
  doctors = doctors.filter(x => x.id !== id);
  saveLocal("doctors", doctors);
  renderDoctors();
  updateStats();
  showToast("Doctor deleted.");
}

// ──────────────────────────────────────────────────────
//  APPOINTMENTS
// ──────────────────────────────────────────────────────
async function loadAppointments() {
  const data = await apiFetch("/appointments");
  if (data) {
    appointments = data;
    saveLocal("appointments", appointments);
  } else {
    appointments = loadLocal("appointments");
  }
  renderAppointments();
}

function renderAppointments() {
  const tbody = document.getElementById("appointmentBody");
  tbody.innerHTML = "";
  appointments.forEach((a, i) => {
    tbody.innerHTML += `
      <tr data-search="${(a.patient_name+a.doctor_name+a.date).toLowerCase()}">
        <td>${i+1}</td>
        <td>${a.date}</td>
        <td>${a.time}</td>
        <td>${a.patient_name}</td>
        <td>${a.doctor_name}</td>
        <td><div class="action-btns">
          <button class="btn-icon edit" onclick="editAppointment(${a.id})"><i class="fa fa-pen"></i></button>
          <button class="btn-icon del"  onclick="deleteAppointment(${a.id})"><i class="fa fa-trash"></i></button>
        </div></td>
      </tr>`;
  });
}

function populateAppointmentDropdowns() {
  const ps = document.getElementById("aPatient");
  const ds = document.getElementById("aDoctor");
  ps.innerHTML = '<option value="">-- Select Patient --</option>';
  ds.innerHTML = '<option value="">-- Select Doctor --</option>';
  patients.forEach(p  => ps.innerHTML += `<option value="${p.name}">${p.name}</option>`);
  doctors.forEach(d   => ds.innerHTML += `<option value="${d.name}">${d.name}</option>`);
}

function editAppointment(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  populateAppointmentDropdowns();
  document.getElementById("apptId").value         = a.id;
  document.getElementById("aDate").value          = a.date;
  document.getElementById("aTime").value          = a.time;
  document.getElementById("aPatient").value       = a.patient_name;
  document.getElementById("aDoctor").value        = a.doctor_name;
  document.getElementById("apptModalTitle").textContent = "Edit Appointment";
  document.getElementById("appointmentModal").classList.remove("hidden");
}

async function saveAppointment() {
  const date         = document.getElementById("aDate").value;
  const time         = document.getElementById("aTime").value;
  const patient_name = document.getElementById("aPatient").value;
  const doctor_name  = document.getElementById("aDoctor").value;

  if (!date || !time || !patient_name || !doctor_name) { showToast("All fields are required!", true); return; }

  const payload = { date, time, patient_name, doctor_name };

  if (editingId) {
    await apiFetch(`/appointments/${editingId}`, "PUT", payload);
    const idx = appointments.findIndex(x => x.id === editingId);
    appointments[idx] = { ...appointments[idx], ...payload };
    showToast("Appointment updated!");
  } else {
    payload.id = Date.now();
    const data = await apiFetch("/appointments", "POST", payload);
    if (data && data.id) payload.id = data.id;
    appointments.push(payload);
    showToast("Appointment booked!");
  }
  saveLocal("appointments", appointments);
  renderAppointments();
  updateStats();
  closeModal("appointmentModal");
}

async function deleteAppointment(id) {
  if (!confirm("Delete this appointment?")) return;
  await apiFetch(`/appointments/${id}`, "DELETE");
  appointments = appointments.filter(x => x.id !== id);
  saveLocal("appointments", appointments);
  renderAppointments();
  updateStats();
  showToast("Appointment removed.");
}

// ──────────────────────────────────────────────────────
//  DASHBOARD STATS
// ──────────────────────────────────────────────────────
function updateStats() {
  document.getElementById("statPatients").textContent     = patients.length;
  document.getElementById("statDoctors").textContent      = doctors.length;
  document.getElementById("statAppointments").textContent = appointments.length;

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.date === today);
  document.getElementById("statToday").textContent = todayAppts.length;

  // Recent appointments (last 5)
  const recent = [...appointments].slice(-5).reverse();
  const tbody  = document.getElementById("recentBody");
  tbody.innerHTML = recent.length ? recent.map(a => `
    <tr>
      <td>${a.date}</td><td>${a.time}</td>
      <td>${a.patient_name}</td><td>${a.doctor_name}</td>
    </tr>`).join("") : `<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:24px">No appointments yet</td></tr>`;
}

// ──────────────────────────────────────────────────────
//  SEARCH
// ──────────────────────────────────────────────────────
function searchTable(tbodyId, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(row => {
    const text = row.dataset.search || row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? "" : "none";
  });
}

// ──────────────────────────────────────────────────────
//  LOCAL STORAGE (fallback when backend offline)
// ──────────────────────────────────────────────────────
function saveLocal(key, data) {
  try { sessionStorage.setItem("hms_" + key, JSON.stringify(data)); } catch(e) {}
}
function loadLocal(key) {
  try { return JSON.parse(sessionStorage.getItem("hms_" + key) || "[]"); } catch(e) { return []; }
}

// Add tag style dynamically
const style = document.createElement("style");
style.textContent = `
  .tag { display:inline-block; padding:3px 10px; border-radius:20px;
    background:rgba(245,166,35,.15); color:var(--amber); font-size:.78rem; font-weight:600; }
  .tag.teal { background:rgba(0,201,167,.12); color:var(--teal); }
  .toast.error { background:var(--rose); color:#fff; box-shadow:0 8px 32px rgba(255,107,139,.4); }
`;
document.head.appendChild(style);
