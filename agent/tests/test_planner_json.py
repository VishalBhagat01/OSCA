import unittest
from agents.nodes.planner import extract_json


class TestPlannerJSON(unittest.TestCase):

    def test_extract_json_clean(self):
        raw = """
```json
{
  "issue_type": "actionable_bug",
  "summary": "Handle zero division",
  "root_cause_hypothesis": "Missing zero check",
  "likely_files_to_change": [{"path": "calc.py", "reason": "logic"}],
  "implementation_plan": ["Add check"],
  "test_plan": ["Test zero"],
  "difficulty": "easy",
  "confidence": 0.9,
  "needs_human_clarification": false,
  "clarifying_questions": []
}
```
"""
        res = extract_json(raw)
        self.assertEqual(res["issue_type"], "actionable_bug")
        self.assertEqual(res["summary"], "Handle zero division")

    def test_extract_json_trailing_commas(self):
        raw = """
{
  "issue_type": "actionable_bug",
  "summary": "Handle zero division",
  "root_cause_hypothesis": "Missing zero check",
  "likely_files_to_change": [{"path": "calc.py", "reason": "logic"}, ],
  "implementation_plan": ["Add check", ],
  "test_plan": ["Test zero", ],
}
"""
        res = extract_json(raw)
        self.assertEqual(res["issue_type"], "actionable_bug")

    def test_extract_json_malformed_unescaped_quotes_regex_fallback(self):
        # This was the exact cause of "Expecting ',' delimiter"!
        raw = """
{
  "issue_type": "actionable_bug",
  "summary": "Handle division by zero gracefully",
  "root_cause_hypothesis": "Division without checking denominator",
  "likely_files_to_change": [
    {
      "path": "calculator.py",
      "reason": "Contains division function"
    }
  ],
  "implementation_plan": [
    "Check if b == 0 and raise ZeroDivisionError("division by zero")"
  ]
}
"""
        res = extract_json(raw, issue={"title": "Handle division by zero gracefully"})
        self.assertEqual(res["issue_type"], "actionable_bug")
        self.assertEqual(res["summary"], "Handle division by zero gracefully")
        self.assertEqual(len(res["likely_files_to_change"]), 1)
        self.assertEqual(res["likely_files_to_change"][0]["path"], "calculator.py")
        self.assertFalse(res["needs_human_clarification"])


if __name__ == "__main__":
    unittest.main()
