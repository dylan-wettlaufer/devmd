import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const backgroundAnswersSchema = z.object({
  currentDescription: z.string().trim().min(1),
  targetRoles: z.string().trim().min(1),
  comfortableTechnologies: z.string().trim().min(1),
  enjoyedProblems: z.string().trim().min(1),
  currentImprovement: z.string().trim().min(1),
});

export const backgroundSchema = z.object({
  summary: z.string().min(1),
  technicalFocus: z.string().min(1),
  interests: z.string().min(1),
  currentDirection: z.string().min(1),
  strengths: z.string().min(1),
  growthAreas: z.string().min(1),
});

export type BackgroundAnswers = z.infer<typeof backgroundAnswersSchema>;
export type Background = z.infer<typeof backgroundSchema>;

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

function buildBackgroundPrompt(answers: BackgroundAnswers) {
  return `You are generating a DevMD background.md source object for a developer profile.

Return only valid JSON matching this exact TypeScript shape:
{
  "summary": string,
  "technicalFocus": string,
  "interests": string,
  "currentDirection": string,
  "strengths": string,
  "growthAreas": string
}

Write clearly for recruiters, interviewers, and AI tools. Use only the user's answers as source material. Do not invent credentials, employment history, education, metrics, or private context.

User answers:
${JSON.stringify(answers, null, 2)}
`;
}

function parseJsonResponse(text: string) {
  const trimmedText = text.trim();
  const fencedJsonMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmedText);
  const jsonText = fencedJsonMatch ? fencedJsonMatch[1] : trimmedText;

  return JSON.parse(jsonText) as unknown;
}

export async function generateBackground(answers: BackgroundAnswers) {
  const { apiKey, model } = getGeminiConfig();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: buildBackgroundPrompt(answers),
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return backgroundSchema.parse(parseJsonResponse(text));
}
