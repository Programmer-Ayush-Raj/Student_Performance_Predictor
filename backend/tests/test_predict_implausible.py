"""Tests to ensure implausible scenarios are handled conservatively."""

from app.ml.predictor import Predictor


def test_implausible_low_marks_prediction_is_fail(trained_model_env):
    predictor = Predictor(
        model_path=trained_model_env["model_path"],
        metadata_path=trained_model_env["metadata_path"],
    )

    scenario = {
        "attendance": 56,
        "marks": 0,
        "internal_score": 70,
        "final_exam_score": 0,
    }

    result = predictor.predict(**scenario)

    assert result["predicted_result"] == 0, "Implausible case should not be predicted as pass"
    assert result["probability"] < result["threshold_used"], "Probability must stay below threshold"
    assert result["suspicious_input"], "Suspicious scenarios should be flagged"
    assert any(
        reason["feature"] == "marks"
        for reason in result["explanation"]["top_reasons"]
    ), "Marks should be highlighted in explanation"

