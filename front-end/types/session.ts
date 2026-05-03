export interface AnalysisResult {
  name: string;
  value: string;
  range: string;
  status: "normal" | "low" | "high";
  what_it_means: string;
  what_to_do: string;
}

export interface StructuredAnalysis {
  summary: string;
  results: AnalysisResult[];
  key_findings: string[];
  next_steps: string[];
  encouragement: string;
}

export interface Session {
  id: string;
  userId: string;
  fileName: string;
  storageUrl: string;
  storagePath: string;
  createdAt: number;
  status: "uploaded" | "analyzing" | "done" | "error";
  analysis?: StructuredAnalysis;
  analysisRaw?: string;
  reportText?: string;
  modelUsed?: string;
  sessionTitle?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
}
