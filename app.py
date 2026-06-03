from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

doctors = [
    {"id": 1, "name": "Dr. Ananya Sharma", "department": "Cardiology"},
    {"id": 2, "name": "Dr. Rahul Mehta", "department": "Orthopedics"},
    {"id": 3, "name": "Dr. Priya Nair", "department": "Dermatology"},
    {"id": 4, "name": "Dr. Kabir Khan", "department": "Neurology"},
]

appointments = [
    {
        "id": 101,
        "patientName": "Amit Verma",
        "phone": "9876543210",
        "doctorId": 1,
        "date": "2026-06-05",
        "time": "10:30",
        "reason": "Chest pain consultation",
        "status": "Scheduled",
    }
]


@app.get("/")
def home():
    return jsonify({"message": "Hospital Appointment API is running"})


@app.get("/doctors")
def get_doctors():
    return jsonify(doctors)


@app.get("/appointments")
def get_appointments():
    return jsonify(appointments)


@app.post("/appointments")
def add_appointment():
    data = request.get_json()

    required_fields = ["patientName", "phone", "doctorId", "date", "time"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    appointment = {
        "id": len(appointments) + 101,
        "patientName": data["patientName"],
        "phone": data["phone"],
        "doctorId": int(data["doctorId"]),
        "date": data["date"],
        "time": data["time"],
        "reason": data.get("reason", ""),
        "status": "Scheduled",
    }

    appointments.insert(0, appointment)
    return jsonify(appointment), 201


@app.patch("/appointments/<int:appointment_id>")
def update_appointment_status(appointment_id):
    data = request.get_json()

    for appointment in appointments:
        if appointment["id"] == appointment_id:
            appointment["status"] = data.get("status", appointment["status"])
            return jsonify(appointment)

    return jsonify({"error": "Appointment not found"}), 404


@app.delete("/appointments/<int:appointment_id>")
def delete_appointment(appointment_id):
    for appointment in appointments:
        if appointment["id"] == appointment_id:
            appointments.remove(appointment)
            return jsonify({"message": "Appointment deleted"})

    return jsonify({"error": "Appointment not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)