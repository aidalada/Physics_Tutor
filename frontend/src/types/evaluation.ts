/** Mirrors the backend Pydantic schemas exactly. */

export interface RubricBreakdown {
  si_units_and_given: number;
  physics_laws_setup: number;
  math_derivations: number;
  calculation_units: number;
}

export interface SolutionFeedback {
  total_score: number;
  rubric: RubricBreakdown;
  strong_points: string[];
  socratic_hints: string[];
  error_area: string;
}
