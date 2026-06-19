import type { GithubRepositoryAnalysis } from "@/lib/github/analyze-repo";
import type { ProjectBrain } from "@/lib/generation/project-brain";

function renderList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function renderProjectMarkdown(
  projectBrain: ProjectBrain,
  analysis: GithubRepositoryAnalysis
) {
  return `---
title: ${analysis.repository.name}
repo: ${analysis.repository.fullName}
url: ${analysis.repository.url}
generated_at: ${new Date().toISOString()}
source_tree_sha: ${analysis.tree.sha}
---

# ${analysis.repository.name}

## Project overview

${projectBrain.projectOverview}

## Problem being solved

${projectBrain.problemBeingSolved}

## Key features

${renderList(projectBrain.keyFeatures)}

## Tech stack

${renderList(projectBrain.techStack)}

## Architecture explanation

${projectBrain.architectureExplanation}

## Key components

${renderList(projectBrain.keyComponents)}

## Tradeoffs and design decisions

${renderList(projectBrain.tradeoffsAndDesignDecisions)}

## Challenges

${renderList(projectBrain.challenges)}

## Learnings

${renderList(projectBrain.learnings)}

## Interview explanation

${projectBrain.interviewExplanation}
`;
}
