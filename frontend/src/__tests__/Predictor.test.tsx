import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient } from '../api';
import Predictor from '../pages/Predictor';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    predict: vi.fn(),
    getStudents: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      pages: 0,
    }),
  },
}));

describe('Predictor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the predictor form', () => {
    render(<Predictor />);
    expect(screen.getByText('Performance Predictor')).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance (%) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Marks (%) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Internal Score (%) *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /predict/i })).toBeInTheDocument();
  });

  it('calls API when form is submitted', async () => {
    const user = userEvent.setup();
    const mockPredict = vi.mocked(apiClient.predict);
    mockPredict.mockResolvedValue({
      predicted_result: 1,
      probability: 0.85,
      threshold_used: 0.6,
      suspicious_input: false,
      explanation: {
        top_reasons: [],
        feature_importances: {},
        coefficients: {},
      },
    });

    render(<Predictor />);

    // Fill form
    const attendanceInput = screen.getByLabelText('Attendance (%) *');
    const marksInput = screen.getByLabelText('Marks (%) *');
    const internalScoreInput = screen.getByLabelText('Internal Score (%) *');
    const submitButton = screen.getByRole('button', { name: /predict/i });

    await act(async () => {
      await user.type(attendanceInput, '82');
      await user.type(marksInput, '75');
      await user.type(internalScoreInput, '20');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockPredict).toHaveBeenCalledWith({
        attendance: 82,
        marks: 75,
        internal_score: 20,
        final_exam_score: undefined,
      });
    });

    expect(await screen.findByText(/prediction result/i)).toBeInTheDocument();
  });

  it('shows suspicious warning when API flags input', async () => {
    const user = userEvent.setup();
    const mockPredict = vi.mocked(apiClient.predict);
    mockPredict.mockResolvedValue({
      predicted_result: 0,
      probability: 0.55,
      threshold_used: 0.6,
      suspicious_input: true,
      suspicious_reasons: ['Marks are zero while internal score is high.'],
      explanation: {
        top_reasons: [
          { feature: 'marks', effect: 'decrease', contribution: -1.2 },
          { feature: 'attendance', effect: 'decrease', contribution: -0.4 },
        ],
        feature_importances: { marks: 0.7, attendance: 0.2, internal_score: 0.1 },
        coefficients: { marks: -1.5, attendance: -0.4, internal_score: 0.3 },
      },
    });

    render(<Predictor />);

    await act(async () => {
      await user.type(screen.getByLabelText('Attendance (%) *'), '56');
      await user.type(screen.getByLabelText('Marks (%) *'), '0');
      await user.type(screen.getByLabelText('Internal Score (%) *'), '70');
      await user.click(screen.getByRole('button', { name: /predict/i }));
    });

    await waitFor(() => {
      expect(mockPredict).toHaveBeenCalled();
    });

    expect(screen.getByText(/suspicious input detected/i)).toBeInTheDocument();
    expect(screen.getByText(/marks are zero while internal score is high/i)).toBeInTheDocument();
    expect(screen.getAllByText(/decision threshold/i)[0]).toBeInTheDocument();
  });
});

