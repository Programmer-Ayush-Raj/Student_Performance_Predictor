import React, { useEffect, useState } from 'react';
import { apiClient, PredictResponse, Student } from '../api';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts';

const formatPercentage = (v: number) => `${(v * 100).toFixed(1)}%`;

type FormData = {
  attendance: string;
  marks: string;
  internal_score: string;
  final_exam_score: string;
};

function Predictor(): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    attendance: '',
    marks: '',
    internal_score: '',
    final_exam_score: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedProb, setSimulatedProb] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const response = await apiClient.getStudents(1, 100);
        const studentsList = response.items || [];
        setStudents(studentsList);
        if (studentsList.length === 0) {
          console.warn('No students found in database');
        }
      } catch (err) {
        console.error('Failed to load students', err);
        setError('Failed to load students. Please check if the backend is running.');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = (): boolean => {
    const a = parseFloat(formData.attendance);
    const m = parseFloat(formData.marks);
    const i = parseFloat(formData.internal_score);
    if (isNaN(a) || a < 0 || a > 100) return setError('Attendance must be 0–100'), false;
    if (isNaN(m) || m < 0 || m > 100) return setError('Marks must be 0–100'), false;
    if (isNaN(i) || i < 0 || i > 100) return setError('Internal score must be 0–100'), false;
    if (formData.final_exam_score) {
      const f = parseFloat(formData.final_exam_score);
      if (isNaN(f) || f < 0 || f > 100)
        return setError('Final exam score must be 0–100'), false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await apiClient.predict({
        student_id: selectedStudentId === '' ? undefined : Number(selectedStudentId),
        attendance: parseFloat(formData.attendance),
        marks: parseFloat(formData.marks),
        internal_score: parseFloat(formData.internal_score),
        final_exam_score: formData.final_exam_score
          ? parseFloat(formData.final_exam_score)
          : undefined,
      });
      setResult(res);
      setSimulatedProb(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const neonColor = (p: number, t: number) => {
    if (p >= t + 0.15) return '#00F5A0';
    if (p >= t) return '#7CFFFB';
    if (p >= t - 0.1) return '#FFD166';
    return '#FF6B6B';
  };

  const renderResult = (prediction: PredictResponse) => {
    const prob = simulatedProb ?? prediction.probability;
    const pass = prob >= prediction.threshold_used;
    const neon = neonColor(prob, prediction.threshold_used);
    const gauge = [
      { name: 'prob', value: Math.round(prob * 100) },
      { name: 'rest', value: Math.round((1 - prob) * 100) },
    ];
    const features = Object.entries(prediction.explanation.feature_importances || {});
    const barData = features.map(([k, v]) => ({ feature: k, value: (v as number) * 100 }));

    return (
      <div className="mt-6 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card">
            <h3 className="card-title">Prediction Summary</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Predicted Result</p>
                <p
                  className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                    pass ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                  }`}
                >
                  {pass ? 'PASS' : 'FAIL'}
                </p>
                <p className="mt-2 text-xs text-white/70">
                  Probability: {formatPercentage(prob)} (Threshold:{' '}
                  {formatPercentage(prediction.threshold_used)})
                </p>
              </div>
              <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer>
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={gauge}
                    startAngle={180}
                    endAngle={-180}
                  >
                    <RadialBar
                      minAngle={15}
                      dataKey="value"
                      cornerRadius={20}
                      background
                      clockWise
                      fill={neon}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card lg:col-span-2">
            <h3 className="card-title">AI Insights & Explanation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 uppercase mb-2">Top Reasons</p>
                <div className="space-y-2">
                  {prediction.explanation.top_reasons?.map((r, i) => (
                    <div key={i} className="reason-box">
                      <p className="text-sm font-medium text-white">{r.feature}</p>
                      <p className="text-xs text-white/70 mt-1">
                        {r.effect === 'increase'
                          ? '↑ Increased'
                          : r.effect === 'decrease'
                          ? '↓ Decreased'
                          : '• Neutral'}{' '}
                        impact ({r.contribution.toFixed(2)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase mb-2">Feature Importance</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart layout="vertical" data={barData}>
                    <XAxis type="number" hide domain={[0, 'dataMax']} />
                    <Tooltip
                      wrapperStyle={{
                        background: '#0b1220',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      contentStyle={{
                        background: '#071019',
                        borderRadius: 6,
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="value" barSize={12} radius={[6, 6, 6, 6]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={i % 2 ? '#A78BFA' : '#7CFFFB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Feedback Paragraph */}
        {prediction.feedback_paragraph && (
          <div className="glass-card">
            <h3 className="card-title">Detailed Feedback</h3>
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
              {prediction.feedback_paragraph}
            </p>
          </div>
        )}

        {/* Feedback */}
        {prediction.feedback && prediction.feedback.length > 0 && (
          <div className="glass-card">
            <h3 className="card-title">Feedback & Improvements</h3>
            <div className="space-y-3">
              {prediction.feedback.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 pb-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{f.feature}</p>
                    <p className="text-xs text-white/60">{f.explanation}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <p className="text-sm text-green-300">
                      +{formatPercentage(f.estimated_probability_gain)}
                    </p>
                    <button
                      type="button"
                      className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setSimulatedProb(f.new_probability_estimate)}
                    >
                      Simulate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#071021] text-white relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Student Performance Predictor
          </h1>
          <p className="text-sm text-white/70 mt-2">
            AI-driven analytics · Futuristic Neon Dashboard
          </p>
        </header>

        <form onSubmit={handleSubmit} className="glass-card mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="z-50 relative">
              <label className="text-xs text-white/70">Student (optional)</label>
              <select
                value={selectedStudentId}
                onChange={(e) =>
                  setSelectedStudentId(e.target.value ? Number(e.target.value) : '')
                }
                className="neon-input cursor-pointer"
                disabled={studentsLoading}
              >
                <option value="">
                  {studentsLoading ? 'Loading students...' : students.length === 0 ? 'No students available' : 'Select student'}
                </option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name || `Student ${s.student_id}`}
                  </option>
                ))}
              </select>
            </div>

            {['attendance', 'marks', 'internal_score', 'final_exam_score'].map((f) => (
              <div key={f}>
                <label className="text-xs text-white/70 capitalize">
                  {f.replace('_', ' ')} {f !== 'final_exam_score' && '*'}
                </label>
                <input
                  name={f}
                  value={(formData as any)[f]}
                  onChange={handleChange}
                  type="number"
                  min={0}
                  max={100}
                  className="neon-input"
                  required={f !== 'final_exam_score'}
                />
              </div>
            ))}
          </div>

          {error && <div className="mt-4 p-3 rounded bg-red-900/40 text-sm">{error}</div>}

          <div className="mt-6 text-right">
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient"
            >
              {loading ? 'Predicting...' : 'Predict Performance'}
            </button>
          </div>
        </form>

        {result ? renderResult(result) : (
          <div className="text-center text-white/60 p-6">
            Fill inputs and click Predict to see AI insights
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-card {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          pointer-events: auto;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 1rem;
        }

        .neon-input {
          margin-top: 6px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white !important;
          transition: all 0.3s ease;
        }
        .neon-input:focus {
          border-color: #7cfffb;
          box-shadow: 0 0 12px #7cfffb88;
          outline: none;
        }
        .neon-input option {
          background: #0b1220 !important;
          color: white !important;
          padding: 8px;
        }
        .neon-input option:checked {
          background: rgba(124, 255, 251, 0.3) !important;
          color: white !important;
        }
        .neon-input option:hover {
          background: rgba(124, 255, 251, 0.2) !important;
        }
        select.neon-input {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        select.neon-input::-ms-expand {
          display: block;
        }

        .reason-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
        }

        .btn-gradient {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          background: linear-gradient(90deg, #00f5a0, #00d9f5, #a78bfa);
          color: #000;
          transition: 0.3s;
        }
        .btn-gradient:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px #7cfffb66;
        }
      `}</style>
    </div>
  );
}

export default Predictor;
  