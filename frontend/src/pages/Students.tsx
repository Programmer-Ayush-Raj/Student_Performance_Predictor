import { useState, useEffect } from "react";
import { apiClient } from "../api";

function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [formData, setFormData] = useState({ FullName: "", DepartmentID: "" });
  const [batchPredictions, setBatchPredictions] = useState<any | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Load students
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getStudents(page, 10);
      setStudents(response.items ?? response);
      setTotal(response.total ?? response.length);
      setPages(response.pages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page]);

  const handleOpenModal = (student?: any) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        FullName: student.name || student.FullName || "",
        DepartmentID: (student.dept_id || student.DepartmentID)?.toString() || "",
      });
    } else {
      setEditingStudent(null);
      setFormData({ FullName: "", DepartmentID: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({ FullName: "", DepartmentID: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingStudent) {
        await apiClient.updateStudent(editingStudent.student_id || editingStudent.StudentID, {
          FullName: formData.FullName,
          DepartmentID: formData.DepartmentID
            ? parseInt(formData.DepartmentID)
            : undefined,
        });
      } else {
        await apiClient.createStudent({
          FullName: formData.FullName,
          DepartmentID: formData.DepartmentID
            ? parseInt(formData.DepartmentID)
            : undefined,
        });
      }
      handleCloseModal();
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await apiClient.deleteStudent(studentId);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
    }
  };

  const handleBatchPredict = async () => {
    setBatchLoading(true);
    try {
      const response = await apiClient.predictBatch();
      setBatchPredictions(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run prediction");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Student Management
            </h1>
            <p className="text-white/60 text-sm">Manage records, analytics & predictions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBatchPredict}
              disabled={batchLoading}
              className="px-5 py-2.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
            >
              {batchLoading ? "Running..." : "Batch Predict"}
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 rounded-md bg-gradient-to-r from-cyan-500 to-green-400 hover:scale-105 transition-transform shadow-lg"
            >
              Add Student
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}
        {batchPredictions && (
          <div className="p-4 bg-green-500/10 border border-green-400/40 rounded-md text-green-300 text-sm">
            ✅ Batch Prediction Complete: {batchPredictions.total} predictions generated.
          </div>
        )}

        {/* Student Table */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/70">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-white/50">No students found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/10 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-cyan-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-cyan-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-cyan-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-cyan-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {students.map((s) => (
                    <tr
                      key={s.student_id || s.StudentID}
                      className="hover:bg-white/10 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">{s.student_id || s.StudentID}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {s.name || s.FullName}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {s.DepartmentName || s.dept_id || s.DepartmentID || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(s)}
                          className="text-indigo-400 hover:text-indigo-300 mr-3 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.student_id || s.StudentID)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-t border-white/10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-md bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-white/60">
              Page <span className="text-white">{page}</span> of {pages}
            </p>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 text-sm rounded-md bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/10 border border-white/20 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-cyan-300">
              {editingStudent ? "Edit Student" : "Add Student"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/80">Full Name *</label>
                <input
                  type="text"
                  value={formData.FullName}
                  onChange={(e) =>
                    setFormData({ ...formData, FullName: e.target.value })
                  }
                  required
                  className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 text-white px-3 py-2 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-white/80">Department ID</label>
                <input
                  type="number"
                  value={formData.DepartmentID}
                  onChange={(e) =>
                    setFormData({ ...formData, DepartmentID: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 text-white px-3 py-2 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-semibold hover:scale-105 transition-transform"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
