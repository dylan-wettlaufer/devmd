# DevMD — Product Requirements Document (PRD) v2

---

# 1. Overview

DevMD creates a canonical developer profile from GitHub repositories, experience, and background.

The profile is represented as structured Markdown documents that are readable by both humans and AI tools. Instead of repeatedly explaining projects, technical decisions, and experience to recruiters and every new AI assistant, developers maintain a single source of truth that can be queried and reused everywhere.

DevMD aims to become the persistent context layer for developers.

---

# 2. Problem Statement

Developers struggle to communicate their work consistently.

- GitHub repositories often lack clear documentation.
- Recruiters and interviewers cannot quickly understand project context.
- Developers struggle to explain technical decisions and tradeoffs.
- Every new AI tool requires developers to repeatedly explain their projects, experience, and background.
- There is no standardized, portable profile that both humans and AI systems can consume.

---

# 3. Solution

DevMD generates a structured developer profile composed of modular Markdown files:

- `background.md`
- `experience.md`
- `projects/<repo-name>.md`

These documents form a canonical profile that:

- can be edited and improved over time;
- is useful for humans (recruiters, interviews, portfolios);
- is queryable by AI tools through a read-only MCP server;
- provides persistent context across multiple AI systems.

---

# 4. MVP Goals

## GitHub Integration

- GitHub OAuth sign-up
- Public repositories only
- Repository selection screen
- Default filtering of forks and archived repositories

## Project Generation

- Async Project Brain generation per repository
- Editable project documents
- Manual refresh from GitHub

## Profile Generation

Guided AI Q&A to generate:

- `background.md`

User uploads resume or adds experince maually to generate:

- `experience.md`

## Profile Activation

Users can activate their profile after:

- at least one completed project;
- completed background section.

## MCP Support

Read-only remote MCP server with:

- `list_sections()`
- `get_section(section_id)`
- `get_profile_summary()`

## Export

- Markdown download
- Copy to clipboard
- Shareable public link

---

# 5. Non-Goals (v0)

## Deferred to Future Versions

- Automatic GitHub webhooks
- AI observation write-back
- Embeddings
- RAG
- Vector databases
- Semantic search
- Per-section MCP permissions
- Multi-tier pricing
- Private repositories
- Browser extensions
- Portfolio hosting platform
- CI/CD tooling
- Connector-directory listings
- Regenerate modes
- Recruiter mode
- Simplify mode

---

# 6. Target Users

- Computer science students
- Bootcamp graduates
- Junior developers
- Career switchers
- Hackathon participants
- Developers who want a persistent source of truth for both humans and AI tools

---

# 7. User Flow

## 7.1 Onboarding

1. Sign in with GitHub.
2. Select repositories.
3. Background jobs generate Project Brains.
4. Answer Q&A for background.md
5. Upload resume or manually add experince for expereince.md
6. Review and edit generated documents.
7. Activate profile.

---

## 7.2 Connect AI Tools

After activation:

1. User receives the DevMD MCP server URL.
2. User connects an AI tool.
3. Tool receives read-only access.
4. Connections appear inside the dashboard.

---

## 7.3 Ongoing Use

Connected AI tools may query the profile at any time.

Users may:

- refresh projects manually;
- edit profile documents;
- revoke connected tools.

---

# 8. Functional Requirements

---

## 8.1 GitHub Integration

For each selected repository:

Collect:

- README
- repository metadata
- dependency manifests
- file tree (2–3 levels)
- selected source files (token budget)
- commit metadata
- contextual-question responses

Ignore:

- node_modules
- dist
- build
- lock files

---

## 8.2 AI Generation Pipeline

### Stage 1

Repository analysis

- structure detection
- tech stack detection

### Stage 2

Incorporate user context.

### Stage 3

Summarize important files.

### Stage 4

Generate Project Brain sections.

### Stage 5

Render Markdown with metadata.

---

## 8.3 Project Brain Structure

Each project document contains:

### Project Overview

1–3 sentence non-technical summary.

### Problem Being Solved

### Key Features

### Tech Stack

### Architecture Explanation

Simple and visual-first.

### Key Components

### Tradeoffs and Design Decisions

### Challenges

Based on user answers and inferred information.

### Learnings

### Interview Explanation

How to explain the project verbally.

---

## 8.4 Background and Experience

Guided AI conversation generate:

- `background.md`

Uplaoded resume generates:
- `experience.md`

Both remain fully editable.

---

## 8.5 Profile Lifecycle

```
Draft
↓
Generated
↓
Reviewed
↓
Activated
↓
Connected
```

Only activated profiles are accessible through MCP.

---

## 8.6 MCP Server

Remote HTTPS server.

### Tools

#### list_sections()

Returns available sections.

#### get_section(section_id)

Returns a section's contents.

#### get_profile_summary()

Returns a high-level overview.

### Characteristics

- read-only;
- secure authentication;
- single permission scope.

---

## 8.7 Connected Tools

Dashboard displays:

- tool name;
- connection date;
- last access time;
- revoke button.

---

## 8.8 Manual Refresh

Users can refresh a project manually.

Generation reruns using the current repository state.

Refreshes are rate limited.

---

## 8.9 Export

- Markdown download
- Copy to clipboard
- Public share link

---

# 9. UX Principles

Core principle:

> Instant clarity from complexity.

The interface should feel:

- minimal;
- content-first;
- Markdown-centric;
- simple and approachable.

---

# 10. Technical Architecture

## Frontend

### Next.js

Responsible for:

- UI
- authentication flow
- lightweight API routes

---

## Backend

### Node.js + TypeScript

Responsible for:

- GitHub integration
- repository analysis
- LLM pipeline
- Project Brain generation
- MCP server

Libraries:

- Octokit
- Official MCP TypeScript SDK

Direct LLM API calls are preferred.

Heavy orchestration frameworks are intentionally avoided.

---

## Database

### Supabase Postgres

Stores:

- users
- projects
- project versions
- background
- experience
- generation jobs
- connected tools
- billing state

Simple version history is maintained through database records.

---

## Async Processing

Generation runs as background jobs.

A Postgres-backed job table is sufficient for v0.

Redis and external queue systems are deferred until scale requires them.

---

# 11. Success Metrics

## Activation

- onboarding completion rate;
- time to first Project Brain.

## Engagement

- activated profiles;
- connected tools per user;
- MCP calls per active user;
- manual refresh usage.

## Revenue

- free-to-paid conversion;
- retention.

---

# 12. Monetization

## Free Tier

- one Project Brain;
- onboarding access.

No MCP access.

---

## Paid Tier

$8–15/month

Includes:

- multiple projects;
- MCP access;
- manual refresh;
- ongoing profile updates.

Pricing should be validated through user feedback.

---

# 13. Risks

| Risk | Mitigation |
|--------|------------|
| Generic outputs | Strict schema and contextual questions |
| One-time usage | MCP-driven recurring value |
| Large repositories | Token-budgeted file selection |
| LLM costs | Project limits and refresh rate limiting |
| Stale information | Manual refresh |
| Competition | Canonical developer profile positioning |

---

# 14. Differentiation

DevMD is not:

- a code assistant;
- a repo chatbot;
- a resume generator.

DevMD is:

> A canonical developer profile that both humans and AI tools can consume.

Its value comes from transforming real GitHub repositories and developer experience into persistent, reusable context.

---

# 15. Long-Term Vision

Future versions may introduce:

- GitHub webhook sync;
- AI observation write-back;
- per-section permissions;
- embeddings and semantic search;
- one-click connectors;
- multiple pricing tiers;
- richer agent integrations.

The long-term vision is:

> Build the persistent memory layer that developers and AI systems share.