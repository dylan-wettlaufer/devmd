import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const experienceInputSchema = z.discriminatedUnion("sourceType", [
  z.object({
    sourceType: z.literal("resume"),
    resumeText: z.string().trim().min(50).max(50_000),
    fileName: z.string().trim().min(1).max(255),
  }),
  z.object({
    sourceType: z.literal("manual"),
    manualExperience: z.string().trim().min(50).max(50_000),
  }),
]);

export const experienceSchema = z.object({
  summary: z.string().min(1),
  roles: z.array(
    z.object({
      title: z.string().min(1),
      organization: z.string().min(1),
      dates: z.string().min(1),
      location: z.string().min(1).optional(),
      description: z.string().min(1),
      responsibilities: z.array(z.string().min(1)).min(1),
      impact: z.array(z.string().min(1)).default([]),
      technologies: z.array(z.string().min(1)).default([]),
    })
  ),
  projectsAndHighlights: z.array(z.string().min(1)).default([]),
  education: z.array(z.string().min(1)).default([]),
  certifications: z.array(z.string().min(1)).default([]),
  skills: z.object({
    languages: z.array(z.string().min(1)).default([]),
    frameworksAndLibraries: z.array(z.string().min(1)).default([]),
    toolsAndPlatforms: z.array(z.string().min(1)).default([]),
  }),
  interviewTalkingPoints: z.array(z.string().min(1)).min(1),
  gapsOrGrowthAreas: z.array(z.string().min(1)).default([]),
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
export type Experience = z.infer<typeof experienceSchema>;

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

function formatExperienceSource(input: ExperienceInput) {
  if (input.sourceType === "resume") {
    return `Source type: resume upload
File name: ${input.fileName}

Resume text:
${input.resumeText}`;
  }

  return `Source type: manual experience entry

Manual experience:
${input.manualExperience}`;
}

function buildExperiencePrompt(input: ExperienceInput) {
  return `You are generating a DevMD experience.md source object for a developer profile.

Return only valid JSON matching this exact TypeScript shape:
{
  "summary": string,
  "roles": [
    {
      "title": string,
      "organization": string,
      "dates": string,
      "location"?: string,
      "description": string,
      "responsibilities": string[],
      "impact": string[],
      "technologies": string[]
    }
  ],
  "projectsAndHighlights": string[],
  "education": string[],
  "certifications": string[],
  "skills": {
    "languages": string[],
    "frameworksAndLibraries": string[],
    "toolsAndPlatforms": string[]
  },
  "interviewTalkingPoints": string[],
  "gapsOrGrowthAreas": string[]
}

Write clearly for recruiters, interviewers, and AI tools. Use only the user's provided resume or manual experience as source material. Do not invent employers, dates, education, certifications, metrics, responsibilities, or technologies. If a detail is unclear, phrase it conservatively or omit it.

${formatExperienceSource(input)}
`;
}

function parseJsonResponse(text: string) {
  const trimmedText = text.trim();
  const fencedJsonMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmedText);
  const jsonText = fencedJsonMatch ? fencedJsonMatch[1] : trimmedText;

  return JSON.parse(jsonText) as unknown;
}

export async function generateExperience(input: ExperienceInput) {
  const { apiKey, model } = getGeminiConfig();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: buildExperiencePrompt(input),
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return experienceSchema.parse(parseJsonResponse(text));
}
