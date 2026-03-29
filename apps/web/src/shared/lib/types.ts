import type { SimulationNodeDatum } from "d3-force";

export interface CanvasKeyword {
  id: string;
  text: string;
  hierarchy: "main" | "sub";
  parentId?: string;
  hitCount?: number;
  createdAt?: string;
}

export interface ForceNode extends SimulationNodeDatum {
  id: string;
  text: string;
  hitCount: number;
}

export interface SimilarityRelation {
  sourceId: string;
  targetId: string;
  score: number;
}

export interface InitialMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

export interface ProfileData {
  interests: string;
  patterns: string;
  threshold: string;
  assets: string;
}
