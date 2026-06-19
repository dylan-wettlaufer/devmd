import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type { GithubRepositoryAnalysis } from "@/lib/github/analyze-repo";

export const projectBrainSchema = z.object({
  projectOverview: z.string().min(1),
  problemBeingSolved: z.string().min(1),
  keyFeatures: z.array(z.string().min(1)).min(1),
  techStack: z.array(z.string().min(1)).min(1),
  architectureExplanation: z.string().min(1),
  keyComponents: z.array(z.string().min(1)).min(1),
  tradeoffsAndDesignDecisions: z.array(z.string().min(1)).min(1),
  challenges: z.array(z.string().min(1)).min(1),
  learnings: z.array(z.string().min(1)).min(1),
  interviewExplanation: z.string().min(1),
});

export type ProjectBrain = z.infer<typeof projectBrainSchema>;

type GeminiConfig = {
  apiKey: string;
  model: string;
};

function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  return {
    apiKey,
    model,
  };
}

function formatTreeItems(analysis: GithubRepositoryAnalysis) {
  return analysis.tree.items
    .slice(0, 120)
    .map((item) => `- ${item.path}${item.size === null ? "" : ` (${item.size} bytes)`}`)
    .join("\n");
}

function formatImportantFiles(analysis: GithubRepositoryAnalysis) {
  return analysis.importantFiles
    .map(
      (file) => `### ${file.path}
\`\`\`
${file.content.slice(0, 6000)}
\`\`\``
    )
    .join("\n\n");
}

function buildProjectBrainPrompt(analysis: GithubRepositoryAnalysis) {
  return `You are generating a DevMD Project Brain Markdown source object for a developer profile.

Return only valid JSON matching this exact TypeScript shape:
{
  "projectOverview": string,
  "problemBeingSolved": string,
  "keyFeatures": string[],
  "techStack": string[],
  "architectureExplanation": string,
  "keyComponents": string[],
  "tradeoffsAndDesignDecisions": string[],
  "challenges": string[],
  "learnings": string[],
  "interviewExplanation": string
}

Write clearly for recruiters, interviewers, and AI tools. Do not invent private context. If a detail is inferred, phrase it conservatively.

Repository metadata:
${JSON.stringify(analysis.repository, null, 2)}

README:
${analysis.readme ?? "No README found."}

Repository tree sample:
${formatTreeItems(analysis)}

Selected source and manifest files:
${formatImportantFiles(analysis) || "No source files selected."}
`;
}

function parseJsonResponse(text: string) {
  const trimmedText = text.trim();
  const fencedJsonMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmedText);
  const jsonText = fencedJsonMatch ? fencedJsonMatch[1] : trimmedText;

  return JSON.parse(jsonText) as unknown;
}

export async function generateProjectBrain(analysis: GithubRepositoryAnalysis) {
  const { apiKey, model } = getGeminiConfig();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: buildProjectBrainPrompt(analysis),
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return projectBrainSchema.parse(parseJsonResponse(text));
}
