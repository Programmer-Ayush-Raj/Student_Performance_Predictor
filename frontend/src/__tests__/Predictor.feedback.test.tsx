import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient } from '../api';
import Predictor from '../pages/Predictor';

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

describe('Predictor Feedback', () => {
  it('renders feedback and simulates suggestion', async () => {
    const user = userEvent.setup();
    const mockPredict = vi.mocked(apiClient.predict);

    mockPredict.mockResolvedValue({
      predicted_result: 0,
      probability: 0.42,
      threshold_used: 0.6,
      suspicious_input: false,
      explanation: { top_reasons: [], feature_importances: {}, coefficients: {} },
      feedback: [
        {
          feature: 'marks',
          current_value: 50,
          suggested_change: 'Increase marks by 10 points (50 → 60)',
          estimated_probability_gain: 0.08,
          new_probability_estimate: 0.50,
          priority: 'medium',
          explanation: 'Marks improvement helps.',
        },
      ],
    });

    render(<Predictor />);

    await act(async () => {
      await user.type(screen.getByLabelText('Attendance (%) *'), '70');
      await user.type(screen.getByLabelText('Marks (%) *'), '50');
      await user.type(screen.getByLabelText('Internal Score (%) *'), '60');
      await user.click(screen.getByRole('button', { name: /predict/i }));
    });

    await waitFor(() => {
      expect(mockPredict).toHaveBeenCalled();
    });

    expect(screen.getByText(/feedback & improvements/i)).toBeInTheDocument();
    expect(screen.getByText(/increase marks by 10 points/i)).toBeInTheDocument();

    // Simulate suggestion updates the displayed probability
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /simulate/i }));
    });

    // two 50.0% outputs (headline and arrow). Accept at least one rendered.
    expect(screen.getAllByText(/50.0%/i).length).toBeGreaterThan(0);
  });
});


