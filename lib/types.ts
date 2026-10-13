export type SetId = "set-1" | "set-2" | "set-3" | "set-4";

export type Question = {
  id: string;
  unit: 1 | 2 | 3;
  text: string;
  options: [string, string, string, string];
  answer: number;
};

export type PublicQuestion = Omit<Question, "answer">;

export type ExamResult = {
  id: string;
  setId: SetId;
  setName: string;
  enrollmentNumber: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  answeredCount: number;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  responses: Array<{ questionId: string; selected: number | null; correct: boolean }>;
};
