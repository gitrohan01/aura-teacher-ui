// Simple AURA Teacher Panel (React 18 via CDN)

const S3_BASE_URL = "http://10.112.171.2"; // ⭐ YOUR ESP32-S3 IP

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAttendance(); }, []);

  const togglePresent = (id) => {
    const updated = {
      ...attendance,
      students: attendance.students.map((s) =>
        s.student_id === id ? { ...s, present: !s.present } : s
      ),
    };
    setAttendance(updated);
  };

  const saveChanges = async () => {
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

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.ok) throw new Error();

      setInfo("Changes saved to device.");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const submitToAura = async () => {
    if (!window.confirm("Submit to Aura? This will lock it.")) return;
    try {
      setSubmitting(true);
      setError("");
      setInfo("");

      const res =
        await fetch(`${S3_BASE_URL}/api/attendance/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });

      const data = await res.json();
      if (!data.ok) throw new Error();

      setInfo("Submitted to Aura.");
      loadAttendance();
    } catch {
      setError("Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 md:p-7">

        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">AURA • Teacher Panel</h1>
            <p className="text-sm text-slate-400">
              Class: <span className="font-medium">MCA-II Sigma</span>{" "}
              {attendance && (
                <> • Date: <span className="font-mono">{attendance.date}</span></>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadAttendance}
              className="px-3 py-2 rounded-xl text-sm border border-slate-600 hover:bg-slate-800">
              🔄 Refresh
            </button>

            <button
              onClick={saveChanges}
              className="px-4 py-2 rounded-xl text-sm bg-sky-500 hover:bg-sky-600">
              💾 {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={submitToAura}
              className="px-4 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600">
              ✅ {submitting ? "Submitting..." : "Submit to Aura"}
            </button>
          </div>
        </header>

        {loading && <p className="text-slate-300">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {info && <p className="text-emerald-400">{info}</p>}

        {attendance && (
          <table className="min-w-full text-sm border border-slate-700 rounded-xl overflow-hidden">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-3 py-2">Roll</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Present</th>
                <th className="px-3 py-2">Source</th>
              </tr>
            </thead>

            <tbody>
              {attendance.students.map((s, i) =>
                <tr key={s.student_id} className={i % 2 ? "bg-slate-900" : "bg-slate-950"}>
                  <td className="px-3 py-2 font-mono">{s.roll_no}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox"
                      checked={s.present}
                      onChange={() => togglePresent(s.student_id)}
                      className="h-4 w-4 accent-emerald-500" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.source === "iot" ?
                      <span className="px-2 py-1 bg-emerald-800 rounded-full text-emerald-200">IoT</span> :
                      <span className="px-2 py-1 bg-slate-700 rounded-full">Manual</span>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

      </div>

      <p className="mt-3 text-xs text-slate-500">
        Connected to device: <span className="font-mono">{S3_BASE_URL}</span>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

                                                            
