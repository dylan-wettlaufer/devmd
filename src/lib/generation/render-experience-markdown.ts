import type { Experience } from "@/lib/generation/experience";

function renderList(items: string[]) {
  if (items.length === 0) {
    return "- Not provided";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function renderRoles(roles: Experience["roles"]) {
  if (roles.length === 0) {
    return "No roles provided.";
  }

  return roles
    .map((role) => {
      const location = role.location ? `\n**Location:** ${role.location}` : "";

      return `### ${role.title}, ${role.organization}

**Dates:** ${role.dates}${location}

${role.description}

#### Responsibilities

${renderList(role.responsibilities)}

#### Impact

${renderList(role.impact)}

#### Technologies

${renderList(role.technologies)}`;
    })
    .join("\n\n");
}

export function renderExperienceMarkdown(experience: Experience) {
  return `# Experience

## Summary

${experience.summary}

## Roles

${renderRoles(experience.roles)}

## Projects and highlights

${renderList(experience.projectsAndHighlights)}

## Education

${renderList(experience.education)}

## Certifications

${renderList(experience.certifications)}

## Skills

### Languages

${renderList(experience.skills.languages)}

### Frameworks and libraries

${renderList(experience.skills.frameworksAndLibraries)}

### Tools and platforms

${renderList(experience.skills.toolsAndPlatforms)}

## Interview talking points

${renderList(experience.interviewTalkingPoints)}

## Gaps or growth areas

${renderList(experience.gapsOrGrowthAreas)}
`;
}
