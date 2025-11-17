// Simple React AURA Teacher Panel
// Uses React 18 via CDN, no build tools needed.

// 🔧 Change this later to your actual ESP32-S3 IP:
const S3_BASE_URL = "http://192.168.0.150";

const { useState, useEffect } = React;

function App() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [attendance, setAttendance] = useState(null);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");
      const res = await fetch(`${S3_BASE_URL}/api/attendance/today`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAttendance(data);
    } catch (e) {
      setError("Failed to load attendance from device.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const togglePresent = (studentId) => {
    if (!attendance) return;
    const updated = {
      ...attendance,
      students: attendance.students.map((s) =>
        s.student_id === studentId ? { ...s, present: !s.present } : s
      ),
    };
    setAttendance(updated);
  };

  const saveChanges = async () => {
    if (!attendance) return;
    try {
      setSaving(true);
      setError("");
      setInfo("");

      const payload = {
        students: attendance.students.map((s) => ({
          student_id: s.student_id,
          present: s.present,
        })),
      };

      const res = await fetch(`${S3_BASE_URL}/api/attendance/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error("Device update failed");
      setInfo("Changes saved to device.");
    } catch (e) {
      setError("Failed to save changes.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const submitToAura = async () => {
    if (!attendance) return;
    if (!window.confirm("Submit final attendance to Aura? This will lock it.")) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setInfo("");

      const res = await fetch(`${S3_BASE_URL}/api/attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error("Device submit failed");

      setInfo("Attendance submitted to Aura successfully.");
      loadAttendance();
    } catch (e) {
      setError("Failed to submit to Aura.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 md:p-7">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              AURA • Teacher Panel
            </h1>
            <p className="text-sm text-slate-400">
              Class: <span className="font-medium">MCA-II Sigma</span>{" "}
              {attendance && attendance.date && (
                <>
                  • Date:{" "}
                  <span className="font-mono">{attendance.date}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadAttendance}
              className="px-3 py-2 rounded-xl text-sm border border-slate-600 hover:bg-slate-800 disabled:opacity-60"
              disabled={loading || saving || submitting}
            >
              🔄 Refresh
            </button>
            <button
              onClick={saveChanges}
              className="px-4 py-2 rounded-xl text-sm bg-sky-500 hover:bg-sky-600 disabled:opacity-60"
              disabled={loading || saving || submitting || !attendance}
            >
              💾 {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={submitToAura}
              className="px-4 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
              disabled={loading || submitting || !attendance}
            >
              ✅ {submitting ? "Submitting..." : "Submit to Aura"}
            </button>
          </div>
        </header>

        {loading && (
          <p className="text-slate-300 text-sm">Loading attendance…</p>
        )}

        {error && (
          <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800 rounded-xl px-3 py-2">
            {info}
          </div>
        )}

        {attendance && (
          <div className="mt-2 overflow-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-400">Roll</th>
                  <th className="px-3 py-2 text-left text-slate-400">Name</th>
                  <th className="px-3 py-2 text-center text-slate-400">
                    Present
                  </th>
                  <th className="px-3 py-2 text-center text-slate-400">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendance.students.map((s, idx) => (
                  <tr
                    key={s.student_id}
                    className={
                      idx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-900/40"
                    }
                  >
                    <td className="px-3 py-2 font-mono text-slate-200">
                      {s.roll_no}
                    </td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!s.present}
                        onChange={() => togglePresent(s.student_id)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {s.source === "iot" ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700">
                          IoT
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-600">
                          Manual
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {attendance.students.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-400"
                    >
                      No students yet. Tap cards on the IoT device.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!attendance && !loading && !error && (
          <p className="text-slate-400 text-sm">
            No data from device yet. Check if ESP32-S3 is online.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Connected to device: <span className="font-mono">{S3_BASE_URL}</span>
      </p>
    </div>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
