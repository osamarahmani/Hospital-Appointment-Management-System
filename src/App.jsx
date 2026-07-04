import { useEffect, useState } from "react";

const API = "https://hospital-appointment-management-system-2.onrender.com";

const healthIssues = [
  "Regular Checkup",
  "Heart Problem",
  "Skin Problem",
  "Bone Pain",
  "Fever",
  "Headache",
  "Eye Problem",
  "Dental Problem",
  "Pregnancy",
];

const statusOptions = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];

function statusBadge(status) {
  const map = {
    Scheduled: "badge-scheduled",
    Completed: "badge-completed",
    Cancelled: "badge-cancelled",
    Rescheduled: "badge-rescheduled",
  };
  const icons = { Scheduled: "🕐", Completed: "✅", Cancelled: "❌", Rescheduled: "🔄" };
  return (
    <span className={`badge ${map[status] || "badge-scheduled"}`}>
      {icons[status] || "🕐"} {status}
    </span>
  );
}

/* ── Root ───────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "ok" });

  function notify(text, type = "ok") { setMessage({ text, type }); }
  function logout() { setUser(null); setPage("login"); setMessage({ text: "", type: "ok" }); }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🏥</div>
          <div>
            <p className="eyebrow">Hospital Management System</p>
            <h1>Smart Appointment Portal</h1>
          </div>
        </div>
        {user && (
          <button className="btn btn-ghost" onClick={logout}>
            ← Logout
          </button>
        )}
      </header>

      {message.text && (
        <p className={`flash ${message.type === "err" ? "error" : ""}`}>
          {message.type === "ok" ? "✓" : "⚠"} {message.text}
        </p>
      )}

      {page === "login" && (
        <LoginPage setPage={setPage} setUser={setUser} notify={notify} />
      )}
      {page === "newPatient" && (
        <NewPatientPage setPage={setPage} setUser={setUser} notify={notify} />
      )}
      {page === "patientBooking" && user && (
        <PatientBookingPage patient={user} notify={notify} />
      )}
      {page === "doctorDashboard" && user && (
        <DoctorDashboard doctor={user} notify={notify} />
      )}
      {page === "adminDashboard" && user && (
        <AdminDashboard notify={notify} />
      )}
    </main>
  );
}

/* ── Login ──────────────────────────────────────── */
function LoginPage({ setPage, setUser, notify }) {
  const [role, setRole] = useState("");
  const [patientLogin, setPatientLogin] = useState({ login: "", password: "" });
  const [doctorLogin, setDoctorLogin] = useState({ doctorId: "" });
  const [adminLogin, setAdminLogin] = useState({ username: "", password: "" });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetch(`${API}/doctors`)
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});
  }, []);

  function loginPatient(e) {
    e.preventDefault();
    fetch(`${API}/patients/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientLogin),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { notify(data.error, "err"); return; }
        setUser(data);
        setPage("patientBooking");
        notify(`Welcome back, ${data.name}!`);
      });
  }

  function loginDoctor(e) {
    e.preventDefault();
    fetch(`${API}/doctors/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doctorLogin),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { notify(data.error, "err"); return; }
        setUser(data);
        setPage("doctorDashboard");
        notify(`Welcome, ${data.name}`);
      });
  }

  function loginAdmin(e) {
    e.preventDefault();
    fetch(`${API}/admins/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminLogin),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { notify(data.error, "err"); return; }
        setUser(data);
        setPage("adminDashboard");
        notify("Welcome, Admin");
      });
  }

  const roles = [
    { key: "newPatient", icon: "🆕", label: "New Patient" },
    { key: "oldPatient", icon: "👤", label: "Existing Patient" },
    { key: "doctor",    icon: "🩺", label: "Doctor" },
    { key: "admin",     icon: "🔐", label: "Admin" },
  ];

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>Welcome</h2>
        <p className="login-subtitle">Select your role to continue</p>

        <div className="role-grid">
          {roles.map((r) => (
            <button
              key={r.key}
              className={`role-btn ${role === r.key ? "active" : ""}`}
              onClick={() => setRole(r.key)}
            >
              <span className="role-icon">{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {role === "newPatient" && (
          <button className="btn btn-primary btn-full" onClick={() => setPage("newPatient")}>
            Create Account →
          </button>
        )}

        {role === "oldPatient" && (
          <form onSubmit={loginPatient}>
            <label>
              Patient ID or Email
              <input
                value={patientLogin.login}
                onChange={(e) => setPatientLogin({ ...patientLogin, login: e.target.value })}
                placeholder="e.g. P1001 or email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={patientLogin.password}
                onChange={(e) => setPatientLogin({ ...patientLogin, password: e.target.value })}
                required
              />
            </label>
            <button className="btn btn-primary btn-full">Login</button>
          </form>
        )}

        {role === "doctor" && (
          <form onSubmit={loginDoctor}>
            <label>
              Select Doctor
              <select
                value={doctorLogin.doctorId}
                onChange={(e) => setDoctorLogin({ doctorId: e.target.value })}
                required
              >
                <option value="">— Choose your name —</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.specialization}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary btn-full">Login as Doctor</button>
          </form>
        )}

        {role === "admin" && (
          <form onSubmit={loginAdmin}>
            <label>
              Username
              <input
                value={adminLogin.username}
                onChange={(e) => setAdminLogin({ ...adminLogin, username: e.target.value })}
                placeholder="admin"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={adminLogin.password}
                onChange={(e) => setAdminLogin({ ...adminLogin, password: e.target.value })}
                required
              />
            </label>
            <button className="btn btn-primary btn-full">Login as Admin</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── New Patient Registration ───────────────────── */
function NewPatientPage({ setPage, setUser, notify }) {
  const [form, setForm] = useState({
    name: "", age: "", gender: "", phone: "",
    address: "", email: "", password: "",
  });

  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function register(e) {
    e.preventDefault();
    fetch(`${API}/patients/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { notify(data.error, "err"); return; }
        setUser(data);
        setPage("patientBooking");
        notify(`Registration successful! Your Patient ID is ${data.patient_code}`);
      });
  }

  return (
    <form className="panel wide-panel" onSubmit={register}>
      <h2 className="panel-title">🆕 New Patient Registration</h2>

      <div className="form-grid">
        <label>Full Name <input name="name" value={form.name} onChange={update} required /></label>
        <label>Age <input name="age" type="number" value={form.age} onChange={update} required /></label>
        <label>
          Gender
          <select name="gender" value={form.gender} onChange={update} required>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>
        <label>Phone <input name="phone" value={form.phone} onChange={update} required /></label>
        <label>Email <input name="email" type="email" value={form.email} onChange={update} required /></label>
        <label>Password <input name="password" type="password" value={form.password} onChange={update} required /></label>
      </div>

      <label>
        Address
        <textarea name="address" value={form.address} onChange={update} required />
      </label>

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={() => setPage("login")}>← Back</button>
        <button className="btn btn-primary">Register Patient</button>
      </div>
    </form>
  );
}

/* ── Patient Booking ────────────────────────────── */
function PatientBookingPage({ patient, notify }) {
  const [form, setForm] = useState({ healthIssue: "", appointmentDate: "", appointmentTime: "" });
  const [lastAppt, setLastAppt] = useState(null);

  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function book(e) {
    e.preventDefault();
    fetch(`${API}/appointments/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, ...form }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { notify(data.error, "err"); return; }
        setLastAppt(data);
        notify("Appointment booked successfully!");
        setForm({ healthIssue: "", appointmentDate: "", appointmentTime: "" });
      });
  }

  return (
    <div className="two-col">
      {/* Patient Info */}
      <div className="panel">
        <h2 className="panel-title">👤 Patient Details</h2>
        <div className="info-list">
          <InfoRow label="Patient ID" value={patient.patient_code} />
          <InfoRow label="Name" value={patient.name} />
          <InfoRow label="Age" value={patient.age} />
          <InfoRow label="Gender" value={patient.gender} />
          <InfoRow label="Phone" value={patient.phone} />
          <InfoRow label="Address" value={patient.address} />
        </div>
      </div>

      {/* Booking Form */}
      <div className="panel">
        <h2 className="panel-title">📅 Book Appointment</h2>
        <form onSubmit={book}>
          <label>
            Health Issue
            <select name="healthIssue" value={form.healthIssue} onChange={update} required>
              <option value="">Select your concern</option>
              {healthIssues.map((i) => <option key={i}>{i}</option>)}
            </select>
          </label>

          <div className="form-grid-2">
            <label>
              Preferred Date
              <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={update} required />
            </label>
            <label>
              Preferred Time
              <input type="time" name="appointmentTime" value={form.appointmentTime} onChange={update} required />
            </label>
          </div>

          <button className="btn btn-primary btn-full">Submit Appointment</button>
        </form>

        {lastAppt && (
          <div className="success-box">
            <h3>✅ Doctor Assigned</h3>
            <p><strong>{lastAppt.doctor_name}</strong></p>
            <p>{lastAppt.specialization}</p>
            <p>Status: {statusBadge(lastAppt.status)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Doctor Dashboard ───────────────────────────── */
function DoctorDashboard({ doctor, notify }) {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  function loadAppointments(code = "") {
    fetch(`${API}/doctors/${doctor.id}/appointments?patientCode=${code}`)
      .then((r) => r.json())
      .then(setAppointments);
  }

  function loadPatient(patientId) {
    fetch(`${API}/doctors/patient/${patientId}`)
      .then((r) => r.json())
      .then(setSelectedPatient);
  }

  function updateStatus(apptId, status) {
    fetch(`${API}/appointments/${apptId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then(() => {
        notify("Status updated");
        loadAppointments(search);
        if (selectedPatient) loadPatient(selectedPatient.patient.id);
      });
  }

  useEffect(() => { loadAppointments(); }, []);

  return (
    <div className="doctor-layout">
      {/* Left – appointments list */}
      <div className="panel">
        <h2 className="panel-title">🩺 Doctor Dashboard</h2>
        <div className="info-list">
          <InfoRow label="Doctor" value={doctor.name} />
          <InfoRow label="Specialty" value={doctor.specialization} />
        </div>

        <hr className="divider" />

        <div className="search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient ID"
          />
          <button className="btn btn-ghost" onClick={() => loadAppointments(search)}>Search</button>
        </div>

        <div className="table-wrap">
          <div className="table-head appt-cols">
            <span>Patient ID</span>
            <span>Issue</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {appointments.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No appointments found</p>
            </div>
          )}
          {appointments.map((a) => (
            <button
              key={a.id}
              className="table-row appt-cols"
              onClick={() => loadPatient(a.patient_id)}
            >
              <span>{a.patient_code}</span>
              <span>{a.health_issue}</span>
              <span>{a.appointment_date}</span>
              <span>{statusBadge(a.status)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right – patient details */}
      <div className="panel">
        <h2 className="panel-title">👤 Patient Details</h2>

        {!selectedPatient ? (
          <div className="empty-state">
            <div className="empty-icon">🖱️</div>
            <p>Click a patient row to view their full details</p>
          </div>
        ) : (
          <>
            <div className="info-list">
              <InfoRow label="Patient ID"   value={selectedPatient.patient.patient_code} />
              <InfoRow label="Name"         value={selectedPatient.patient.name} />
              <InfoRow label="Age"          value={selectedPatient.patient.age} />
              <InfoRow label="Gender"       value={selectedPatient.patient.gender} />
              <InfoRow label="Phone"        value={selectedPatient.patient.phone} />
              <InfoRow label="Address"      value={selectedPatient.patient.address} />
              <InfoRow label="Total Visits" value={selectedPatient.totalVisits} />
            </div>

            {Object.keys(selectedPatient.sameIssueCounts).length > 0 && (
              <>
                <h3 style={{ marginBottom: 10, fontSize: 14, color: "var(--slate)" }}>
                  ⚠️ Recurring Issue Warnings
                </h3>
                {Object.entries(selectedPatient.sameIssueCounts).map(([issue, count]) => (
                  <div className="warning-strip" key={issue}>
                    ⚠ {issue} — visited {count} time{count > 1 ? "s" : ""}
                  </div>
                ))}
              </>
            )}

            <hr className="divider" />
            <h3 style={{ marginBottom: 14, fontSize: 15 }}>📂 Appointment History</h3>

            {selectedPatient.history.map((h) => (
              <div className="history-card" key={h.id}>
                <h4>{h.health_issue}</h4>
                <p>📅 {h.appointment_date} at {h.appointment_time}</p>
                <p>👨‍⚕️ {h.doctor_name} · {h.specialization}</p>
                <div style={{ marginTop: 10 }}>
                  {statusBadge(h.status)}
                </div>
                <select
                  value={h.status}
                  onChange={(e) => updateStatus(h.id, e.target.value)}
                  style={{ marginTop: 10 }}
                >
                  {statusOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Admin Dashboard ────────────────────────────── */
function AdminDashboard({ notify }) {
  const [tab, setTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  function load() {
    fetch(`${API}/admin/doctors`).then((r) => r.json()).then(setDoctors);
    fetch(`${API}/admin/patients`).then((r) => r.json()).then(setPatients);
    fetch(`${API}/admin/appointments`).then((r) => r.json()).then(setAppointments);
  }
  useEffect(load, []);

  function deleteDoctor(id) {
    fetch(`${API}/admin/doctors/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then(() => { notify("Doctor removed"); load(); });
  }

  const tabs = [
    { key: "doctors", label: "🩺 Doctors" },
    { key: "patients", label: "👤 Patients" },
    { key: "appointments", label: "📅 Appointments" },
  ];

  return (
    <div className="panel wide-panel">
      <h2 className="panel-title">🔐 Admin Dashboard</h2>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "doctors" && (
        <div className="list-grid">
          {doctors.map((d) => (
            <div className="list-card" key={d.id}>
              <div className="list-card-body">
                <strong>{d.name}</strong>
                <p>{d.specialization} · {d.department}</p>
                <p>📅 {d.available_days}</p>
                <p>🕐 {d.start_time} – {d.end_time}</p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteDoctor(d.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "patients" && (
        <div className="list-grid">
          {patients.map((p) => (
            <div className="list-card" key={p.id}>
              <div className="list-card-body">
                <strong>{p.patient_code} · {p.name}</strong>
                <p>📞 {p.phone}</p>
                <p>✉️ {p.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "appointments" && (
        <div className="list-grid">
          {appointments.map((a) => (
            <div className="list-card" key={a.id}>
              <div className="list-card-body">
                <strong>{a.patient_code} · {a.patient_name}</strong>
                <p>🏥 {a.health_issue} with {a.doctor_name}</p>
                <p>📅 {a.appointment_date} at {a.appointment_time}</p>
              </div>
              {statusBadge(a.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared ─────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}
