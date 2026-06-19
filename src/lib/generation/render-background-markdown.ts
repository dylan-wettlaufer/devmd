import type { Background } from "@/lib/generation/background";

export function renderBackgroundMarkdown(background: Background) {
  return `# Background

## Summary
${background.summary}

## Technical Focus
${background.technicalFocus}

## Interests
${background.interests}

## Current Direction
${background.currentDirection}

## Strengths
${background.strengths}

## Growth Areas
${background.growthAreas}
`;
}
