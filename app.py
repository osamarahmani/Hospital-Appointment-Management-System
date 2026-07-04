from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)


def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",       # ← change to your MySQL password
        database="hospital_db"
    )


def td_to_str(val):
    """Convert timedelta (MySQL TIME) to HH:MM string."""
    if isinstance(val, timedelta):
        total = int(val.total_seconds())
        h, m = divmod(total // 60, 60)
        return f"{h:02d}:{m:02d}"
    return str(val)[:5]  # already a string like "09:00:00"


ISSUE_SPECIALIZATION = {
    "Regular Checkup": "General Physician",
    "Heart Problem":   "Cardiologist",
    "Skin Problem":    "Dermatologist",
    "Bone Pain":       "Orthopedic",
    "Fever":           "General Physician",
    "Headache":        "Neurologist",
    "Eye Problem":     "Ophthalmologist",
    "Dental Problem":  "Dentist",
    "Pregnancy":       "Gynecologist",
}


# ── Health check ────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({"message": "Hospital backend running"})


# ── Patients ─────────────────────────────────────────────────────────────────
@app.route("/patients/register", methods=["POST"])
def register_patient():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM patients WHERE email = %s", (data["email"],))
    if cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({"error": "An account already exists with this email"}), 400

    cursor.execute(
        """INSERT INTO patients
           (patient_code, name, age, gender, phone, address, email, password)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        ("", data["name"], data["age"], data["gender"],
         data["phone"], data["address"], data["email"], data["password"])
    )
    conn.commit()
    pid = cursor.lastrowid
    code = f"P{1000 + pid}"
    cursor.execute("UPDATE patients SET patient_code=%s WHERE id=%s", (code, pid))
    conn.commit()

    cursor.execute("SELECT * FROM patients WHERE id=%s", (pid,))
    patient = cursor.fetchone()
    cursor.close(); conn.close()
    return jsonify(patient), 201


@app.route("/patients/login", methods=["POST"])
def patient_login():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """SELECT * FROM patients
           WHERE (email=%s OR patient_code=%s) AND password=%s""",
        (data["login"], data["login"], data["password"])
    )
    patient = cursor.fetchone()
    cursor.close(); conn.close()

    if not patient:
        return jsonify({"error": "Invalid credentials. Check your Patient ID / email and password."}), 401
    return jsonify(patient)


# ── Doctors ───────────────────────────────────────────────────────────────────
@app.route("/doctors", methods=["GET"])
def list_doctors():
    """Used by login page dropdown."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, specialization FROM doctors ORDER BY name")
    doctors = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(doctors)


@app.route("/doctors/login", methods=["POST"])
def doctor_login():
    """
    Frontend sends { doctorId: <id> } (the numeric id from the dropdown).
    No password needed — doctor just selects their name.
    """
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM doctors WHERE id=%s", (data["doctorId"],))
    doctor = cursor.fetchone()
    cursor.close(); conn.close()

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 401

    # Convert timedelta fields so they serialise cleanly
    doctor["start_time"] = td_to_str(doctor["start_time"])
    doctor["end_time"]   = td_to_str(doctor["end_time"])
    return jsonify(doctor)


# ── Admins ────────────────────────────────────────────────────────────────────
@app.route("/admins/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM admins WHERE username=%s AND password=%s",
        (data["username"], data["password"])
    )
    admin = cursor.fetchone()
    cursor.close(); conn.close()

    if not admin:
        return jsonify({"error": "Invalid admin credentials"}), 401
    return jsonify(admin)


# ── Appointments ──────────────────────────────────────────────────────────────
@app.route("/appointments/book", methods=["POST"])
def book_appointment():
    data = request.get_json()
    health_issue      = data["healthIssue"]
    appointment_date  = data["appointmentDate"]
    appointment_time  = data["appointmentTime"]   # "HH:MM"
    patient_id        = data["patientId"]

    specialization = ISSUE_SPECIALIZATION.get(health_issue)
    if not specialization:
        return jsonify({"error": "Unknown health issue"}), 400

    day_name = datetime.strptime(appointment_date, "%Y-%m-%d").strftime("%A")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # Check duplicate booking (same patient, same slot)
    cursor.execute(
        """SELECT id FROM appointments
           WHERE patient_id=%s AND appointment_date=%s AND appointment_time=%s""",
        (patient_id, appointment_date, appointment_time)
    )
    if cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({"error": "You already have an appointment at this date and time"}), 400

    # Find an available doctor
    cursor.execute(
        "SELECT * FROM doctors WHERE specialization=%s",
        (specialization,)
    )
    doctors = cursor.fetchall()

    selected_doctor = None
    for doc in doctors:
        days      = [d.strip() for d in doc["available_days"].split(",")]
        start_str = td_to_str(doc["start_time"])   # "HH:MM"
        end_str   = td_to_str(doc["end_time"])

        if day_name in days and start_str <= appointment_time <= end_str:
            selected_doctor = doc
            break

    if not selected_doctor:
        cursor.close(); conn.close()
        return jsonify({
            "error": f"No {specialization} available on {day_name} at {appointment_time}. "
                     f"Please choose a different date or time."
        }), 400

    cursor.execute(
        """INSERT INTO appointments
           (patient_id, doctor_id, health_issue, appointment_date, appointment_time, status)
           VALUES (%s,%s,%s,%s,%s,'Scheduled')""",
        (patient_id, selected_doctor["id"], health_issue, appointment_date, appointment_time)
    )
    conn.commit()
    appt_id = cursor.lastrowid

    cursor.execute(
        """SELECT a.*, p.patient_code, p.name AS patient_name,
                  d.name AS doctor_name, d.specialization
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors  d ON a.doctor_id  = d.id
           WHERE a.id=%s""",
        (appt_id,)
    )
    appt = cursor.fetchone()

    # Serialise time fields
    appt["appointment_time"] = td_to_str(appt["appointment_time"])

    cursor.close(); conn.close()
    return jsonify(appt), 201


@app.route("/appointments/<int:appt_id>/status", methods=["PATCH"])
def update_status(appt_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE appointments SET status=%s WHERE id=%s",
        (data["status"], appt_id)
    )
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"message": "Status updated"})


# ── Doctor dashboard ──────────────────────────────────────────────────────────
@app.route("/doctors/<int:doctor_id>/appointments", methods=["GET"])
def doctor_appointments(doctor_id):
    search = request.args.get("patientCode", "")
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT a.id, a.health_issue, a.appointment_date,
               a.appointment_time, a.status,
               p.id AS patient_id, p.patient_code
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = %s
    """
    params = [doctor_id]
    if search:
        sql += " AND p.patient_code LIKE %s"
        params.append(f"%{search}%")
    sql += " ORDER BY a.appointment_date DESC, a.appointment_time DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    # Serialise timedelta
    for r in rows:
        r["appointment_time"] = td_to_str(r["appointment_time"])

    cursor.close(); conn.close()
    return jsonify(rows)


@app.route("/doctors/patient/<int:patient_id>", methods=["GET"])
def patient_details_for_doctor(patient_id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM patients WHERE id=%s", (patient_id,))
    patient = cursor.fetchone()

    cursor.execute(
        """SELECT a.*, d.name AS doctor_name, d.specialization
           FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
           WHERE a.patient_id = %s
           ORDER BY a.appointment_date DESC, a.appointment_time DESC""",
        (patient_id,)
    )
    history = cursor.fetchall()

    # Serialise time fields
    for h in history:
        h["appointment_time"] = td_to_str(h["appointment_time"])

    # Issue frequency map
    issue_counts = {}
    for h in history:
        issue_counts[h["health_issue"]] = issue_counts.get(h["health_issue"], 0) + 1

    cursor.close(); conn.close()
    return jsonify({
        "patient":         patient,
        "history":         history,
        "sameIssueCounts": issue_counts,
        "totalVisits":     len(history),
    })


# ── Admin routes ──────────────────────────────────────────────────────────────
@app.route("/admin/doctors", methods=["GET"])
def admin_get_doctors():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM doctors ORDER BY id DESC")
    docs = cursor.fetchall()
    for d in docs:
        d["start_time"] = td_to_str(d["start_time"])
        d["end_time"]   = td_to_str(d["end_time"])
    cursor.close(); conn.close()
    return jsonify(docs)


@app.route("/admin/doctors", methods=["POST"])
def admin_add_doctor():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO doctors
           (doctor_code, name, specialization, department,
            available_days, start_time, end_time, password)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (data["doctorCode"], data["name"], data["specialization"],
         data["department"], data["availableDays"],
         data["startTime"], data["endTime"], data["password"])
    )
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"message": "Doctor added"}), 201


@app.route("/admin/doctors/<int:doctor_id>", methods=["DELETE"])
def admin_delete_doctor(doctor_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM doctors WHERE id=%s", (doctor_id,))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"message": "Doctor deleted"})


@app.route("/admin/patients", methods=["GET"])
def admin_get_patients():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM patients ORDER BY id DESC")
    patients = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(patients)


@app.route("/admin/appointments", methods=["GET"])
def admin_get_appointments():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """SELECT a.*, p.patient_code, p.name AS patient_name,
                  d.name AS doctor_name, d.specialization
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors  d ON a.doctor_id  = d.id
           ORDER BY a.appointment_date DESC, a.appointment_time DESC"""
    )
    appts = cursor.fetchall()
    for a in appts:
        a["appointment_time"] = td_to_str(a["appointment_time"])
    cursor.close(); conn.close()
    return jsonify(appts)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
