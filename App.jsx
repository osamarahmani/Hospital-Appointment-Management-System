import { useEffect, useMemo, useState } from "react";

const doctors = [
  { id: 1, name: "Dr. Ananya Sharma", department: "Cardiology" },
  { id: 2, name: "Dr. Rahul Mehta", department: "Orthopedics" },
  { id: 3, name: "Dr. Priya Nair", department: "Dermatology" },
  { id: 4, name: "Dr. Kabir Khan", department: "Neurology" },
];

const initialAppointments = [
  {
    id: 101,
    patientName: "Amit Verma",
    phone: "9876543210",
    doctorId: 1,
    date: "2026-06-05",
    time: "10:30",
    reason: "Chest pain consultation",
    status: "Scheduled",
  },
  {
    id: 102,
    patientName: "Neha Singh",
    phone: "9123456780",
    doctorId: 3,
    date: "2026-06-06",
    time: "14:00",
    reason: "Skin allergy",
    status: "Completed",
  },
];

export default function App() {
  const [appointments, setAppointments] = useState(initialAppointments);
  useEffect(() => {
  fetch("http://localhost:5000/appointments")
    .then((response) => response.json())
    .then((data) => setAppointments(data))
    .catch((error) => console.error("Error loading appointments:", error));
}, []);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [form, setForm] = useState({
    patientName: "",
    phone: "",
    doctorId: "",
    date: "",
    time: "",
    reason: "",
  });

  const departments = ["All", ...new Set(doctors.map((doctor) => doctor.department))];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const doctor = doctors.find((item) => item.id === appointment.doctorId);

      const matchesSearch =
        appointment.patientName.toLowerCase().includes(search.toLowerCase()) ||
        appointment.phone.includes(search) ||
        doctor?.name.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        departmentFilter === "All" || doctor?.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [appointments, search, departmentFilter]);

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((item) => item.status === "Scheduled").length,
    completed: appointments.filter((item) => item.status === "Completed").length,
    cancelled: appointments.filter((item) => item.status === "Cancelled").length,
  };

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addAppointment(event) {
    event.preventDefault();

    if (!form.patientName || !form.phone || !form.doctorId || !form.date || !form.time) {
      alert("Please fill all required fields.");
      return;
    }

    const newAppointment = {
      id: Date.now(),
      ...form,
      doctorId: Number(form.doctorId),
      status: "Scheduled",
    };

   fetch("http://localhost:5000/appointments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(newAppointment),
})
  .then((response) => response.json())
  .then(() => {
    setAppointments((prev) => [newAppointment, ...prev]);
  })
  .catch((error) => console.error("Error adding appointment:", error));

    setForm({
      patientName: "",
      phone: "",
      doctorId: "",
      date: "",
      time: "",
      reason: "",
    });
  }

  function updateStatus(id, status) {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    );
  }

  function deleteAppointment(id) {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  }

  return (
    <main className="app">
      <section className="header">
        <div>
          <p className="eyebrow">Hospital System</p>
          <h1>Appointment Management</h1>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
      </section>

      <section className="layout">
        <form className="panel form-panel" onSubmit={addAppointment}>
          <h2>Book Appointment</h2>

          <label>
            Patient Name *
            <input
              name="patientName"
              value={form.patientName}
              onChange={handleChange}
              placeholder="Enter patient name"
            />
          </label>

          <label>
            Phone *
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </label>

          <label>
            Doctor *
            <select name="doctorId" value={form.doctorId} onChange={handleChange}>
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.department}
                </option>
              ))}
            </select>
          </label>

          <div className="two-col">
            <label>
              Date *
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </label>

            <label>
              Time *
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Reason
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Short description"
              rows="4"
            />
          </label>

          <button className="primary-btn" type="submit">
            Add Appointment
          </button>
        </form>

        <section className="panel table-panel">
          <div className="table-header">
            <h2>Appointments</h2>

            <div className="filters">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, phone, doctor"
              />

              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="appointment-list">
            {filteredAppointments.length === 0 ? (
              <p className="empty">No appointments found.</p>
            ) : (
              filteredAppointments.map((appointment) => {
                const doctor = doctors.find((item) => item.id === appointment.doctorId);

                return (
                  <article className="appointment-card" key={appointment.id}>
                    <div>
                      <h3>{appointment.patientName}</h3>
                      <p>{appointment.phone}</p>
                    </div>

                    <div>
                      <strong>{doctor?.name}</strong>
                      <p>{doctor?.department}</p>
                    </div>

                    <div>
                      <strong>{appointment.date}</strong>
                      <p>{appointment.time}</p>
                    </div>

                    <p className={`status ${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </p>

                    <div className="actions">
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          updateStatus(appointment.id, event.target.value)
                        }
                      >
                        <option>Scheduled</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>

                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => deleteAppointment(appointment.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {appointment.reason && (
                      <p className="reason">{appointment.reason}</p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}