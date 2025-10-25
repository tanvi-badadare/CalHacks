export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  category: string;
  hints: {
    level1: string;
    level2: string;
    level3: string;
  };
  solution: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface Session {
  _id: string;
  sessionId: string;
  problemId: string;
  currentHintLevel: 1 | 2 | 3;
  hintsUsed: Array<{
    level: number;
    timestamp: Date;
  }>;
  userAttempts: Array<{
    code: string;
    timestamp: Date;
    isCorrect: boolean;
  }>;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface HintResponse {
  level: number;
  hint: string;
  message: string;
}

export interface SessionUpdate {
  hintLevel?: number;
  userCode?: string;
  isCorrect?: boolean;
  completed?: boolean;
}
