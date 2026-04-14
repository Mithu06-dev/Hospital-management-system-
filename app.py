from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "1234",
    "database": "medicore_hms",
}

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

# ── TEST ROUTE ──────────────────────────
@app.route("/")
def home():
    return "MediCore HMS Backend is Running!"

# ── LOGIN ───────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE username=%s AND password=%s",
                (data["username"], data["password"]))
    user = cur.fetchone()
    cur.close(); conn.close()
    if user:
        return jsonify({"success": True})
    return jsonify({"success": False}), 401

# ── PATIENTS ─────────────────────────────
@app.route("/api/patients", methods=["GET"])
def get_patients():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM patients ORDER BY id DESC")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

@app.route("/api/patients", methods=["POST"])
def add_patient():
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO patients (name,age,disease,mobile,address) VALUES (%s,%s,%s,%s,%s)",
                (d["name"],d["age"],d["disease"],d["mobile"],d["address"]))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route("/api/patients/<int:pid>", methods=["PUT"])
def update_patient(pid):
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE patients SET name=%s,age=%s,disease=%s,mobile=%s,address=%s WHERE id=%s",
                (d["name"],d["age"],d["disease"],d["mobile"],d["address"],pid))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "updated"})

@app.route("/api/patients/<int:pid>", methods=["DELETE"])
def delete_patient(pid):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM patients WHERE id=%s", (pid,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "deleted"})

# ── DOCTORS ──────────────────────────────
@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM doctors ORDER BY id DESC")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

@app.route("/api/doctors", methods=["POST"])
def add_doctor():
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO doctors (name,age,specialization,experience) VALUES (%s,%s,%s,%s)",
                (d["name"],d["age"],d["specialization"],d["experience"]))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route("/api/doctors/<int:did>", methods=["PUT"])
def update_doctor(did):
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE doctors SET name=%s,age=%s,specialization=%s,experience=%s WHERE id=%s",
                (d["name"],d["age"],d["specialization"],d["experience"],did))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "updated"})

@app.route("/api/doctors/<int:did>", methods=["DELETE"])
def delete_doctor(did):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM doctors WHERE id=%s", (did,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "deleted"})

# ── APPOINTMENTS ──────────────────────────
@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM appointments ORDER BY date DESC")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)

@app.route("/api/appointments", methods=["POST"])
def add_appointment():
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO appointments (date,time,patient_name,doctor_name) VALUES (%s,%s,%s,%s)",
                (d["date"],d["time"],d["patient_name"],d["doctor_name"]))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route("/api/appointments/<int:aid>", methods=["PUT"])
def update_appointment(aid):
    d = request.json
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE appointments SET date=%s,time=%s,patient_name=%s,doctor_name=%s WHERE id=%s",
                (d["date"],d["time"],d["patient_name"],d["doctor_name"],aid))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "updated"})

@app.route("/api/appointments/<int:aid>", methods=["DELETE"])
def delete_appointment(aid):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM appointments WHERE id=%s", (aid,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"message": "deleted"})

# ── RUN ───────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
