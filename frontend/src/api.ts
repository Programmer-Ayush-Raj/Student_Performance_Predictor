/**
 * API client for backend communication.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      let message = error.response.data?.detail || error.response.data?.message || error.message;
      
      // Provide more helpful error messages
      if (status === 404) {
        message = `Endpoint not found: ${error.config?.url}. Please check if the backend is running and the endpoint exists.`;
      } else if (status === 401) {
        message = 'Unauthorized. Please check your admin token.';
      } else if (status === 400) {
        message = error.response.data?.detail || error.response.data?.message || 'Bad request. Please check your input.';
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check if the backend is running.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// Types
export interface PredictRequest {
  student_id?: number;
  course_id?: number;
  attendance: number;
  marks: number;
  internal_score: number;
  final_exam_score?: number;
}

export interface ExplanationReason {
  feature: string;
  effect: string;
  contribution: number;
}

export interface ExplanationDetail {
  top_reasons: ExplanationReason[];
  feature_importances: Record<string, number>;
  coefficients: Record<string, number>;
}

export interface PredictResponse {
  predicted_result: 0 | 1;
  probability: number;
  threshold_used: number;
  suspicious_input: boolean;
  suspicious_reasons?: string[];
  explanation: ExplanationDetail;
  final_exam_score?: number;
  feedback?: Array<{
    feature: string;
    current_value: number;
    suggested_change: string;
    estimated_probability_gain: number;
    new_probability_estimate: number;
    priority: 'high' | 'medium' | 'low' | string;
    explanation: string;
  }>;
  notes?: string;
  feedback_paragraph?: string;
}

export interface Student {
  student_id: number;
  name: string;
  dept_id?: number;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  marks?: number;
  attendance?: number;
  internal_score?: number;
  final_exam_score?: number;
  result?: 0 | 1;
}

export interface RetrainResponse {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  model_path: string;
  metadata_path: string;
  timestamp: string;
  samples_used: number;
  class_distribution: Record<string, number>;
  class_counts: Record<string, number>;
  recommended_threshold: number;
  metrics_cv: Record<string, number>;
  user_threshold?: number;
}

export interface PredictBatchResponseItem {
  student_id?: number;
  course_id?: number;
  predicted_result: 0 | 1;
  probability: number;
  threshold_used: number;
  suspicious_input: boolean;
  suspicious_reasons?: string[];
  explanation: ExplanationDetail;
}

export interface PredictBatchResponse {
  predictions: PredictBatchResponseItem[];
  total: number;
}

export interface PaginatedStudents {
  items: Student[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UpdateThresholdResponse {
  threshold: number;
  source: string;
}

// API functions
export const apiClient = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Prediction
  predict: async (data: PredictRequest): Promise<PredictResponse> => {
    const response = await api.post('/api/predict', data);
    return response.data;
  },

  // Batch prediction (admin)
  predictBatch: async (): Promise<PredictBatchResponse> => {
    const response = await api.post('/api/predict_batch');
    return response.data;
  },

  // Retrain (admin)
  retrain: async (): Promise<RetrainResponse> => {
    const response = await api.post('/api/retrain');
    return response.data;
  },

  updateThreshold: async (threshold: number): Promise<UpdateThresholdResponse> => {
    const response = await api.post('/api/settings/threshold', { threshold });
    return response.data;
  },

  getThreshold: async (): Promise<UpdateThresholdResponse> => {
    const response = await api.get('/api/settings/threshold');
    return response.data;
  },

  // Students CRUD
  getStudents: async (page: number = 1, limit: number = 10): Promise<PaginatedStudents> => {
    const response = await api.get(`/api/students?page=${page}&limit=${limit}`);
    return response.data;
  },

  getStudent: async (studentId: number): Promise<Student> => {
    const response = await api.get(`/api/students/${studentId}`);
    return response.data;
  },

  createStudent: async (data: { name: string; dept_id?: number } | { FullName: string; DepartmentID?: number }): Promise<Student> => {
    // Handle both naming conventions
    const payload: { name: string; dept_id?: number } = {
      name: (data as any).FullName || (data as any).name,
      dept_id: (data as any).DepartmentID || (data as any).dept_id,
    };
    const response = await api.post('/api/students', payload);
    return response.data;
  },

  updateStudent: async (
    studentId: number,
    data: { name?: string; dept_id?: number } | { FullName?: string; DepartmentID?: number }
  ): Promise<Student> => {
    // Handle both naming conventions
    const payload: { name?: string; dept_id?: number } = {};
    if ((data as any).FullName !== undefined) {
      payload.name = (data as any).FullName;
    } else if ((data as any).name !== undefined) {
      payload.name = (data as any).name;
    }
    if ((data as any).DepartmentID !== undefined) {
      payload.dept_id = (data as any).DepartmentID;
    } else if ((data as any).dept_id !== undefined) {
      payload.dept_id = (data as any).dept_id;
    }
    const response = await api.put(`/api/students/${studentId}`, payload);
    return response.data;
  },

  deleteStudent: async (studentId: number): Promise<void> => {
    await api.delete(`/api/students/${studentId}`);
  },

  // Export (admin)
  exportData: async (): Promise<Blob> => {
    const response = await api.post('/api/export', {}, { responseType: 'blob' });
    return response.data;
  },
};

export default api;

