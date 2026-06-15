# DevMD — Product Requirements Document (PRD)

## 1. Overview

DevMD is a micro SaaS tool that transforms GitHub repositories into structured, AI-ready “Project Brains” that clearly explain a developer’s work in clean, standardized Markdown.

The goal is to help job seekers (students, bootcamp grads, junior developers) communicate their projects clearly in portfolios, resumes, and interviews by converting raw code into high-quality, structured explanations.

Instead of vague or inconsistent READMEs, users receive a standardized, recruiter-ready project narrative that can be continuously improved and reused across job applications.

---

## 2. Problem Statement

Developers struggle to present projects effectively:

- GitHub repos lack clear or consistent documentation
- Recruiters cannot quickly understand project context
- Candidates struggle to explain technical decisions in interviews
- Portfolio descriptions are often incomplete or overly technical
- Strong projects fail to communicate their value clearly

---

## 3. Solution

Generate a structured “Project Brain” from a GitHub repository + optional user context, formatted in clean Markdown.

Each Project Brain becomes a living, editable career artifact that can be reused across:

- Portfolios  
- Resumes  
- Interviews  
- Applications  

### Key Upgrade (IMPORTANT)

DevMD is not a one-time generator — it is a continuously refinable project understanding layer.

Users can:
- Regenerate improved versions  
- Simplify explanations for recruiters  
- Generate resume bullets  
- Simulate interview explanations  

---

## 4. MVP Goals

- Paste GitHub repo URL  
- Answer 2–3 contextual questions  
- Generate structured Project Brain Markdown  
- Allow editing + regeneration of sections  
- Copy / download / share output  
- Validate willingness to pay and repeated usage  

---

## 5. Non-Goals (MVP)

- No GitHub OAuth  
- No private repos  
- No full portfolio hosting platform  
- No browser extension  
- No full chat system over repos  
- No CI/CD or DevOps tooling  

---

## 6. Target Users

- CS students building portfolios  
- Bootcamp graduates  
- Junior developers applying for jobs  
- Career switchers entering tech  
- Hackathon participants  

---

## 7. User Flow

### Core Flow

1. Paste GitHub URL  
2. Fetch repo structure + key files  
3. Ask 2–3 clarifying questions  
4. Generate Project Brain (Markdown output)  
5. User reviews + edits output  
6. User regenerates sections or exports  

---

## 8. Functional Requirements

### 8.1 GitHub Integration

- Public repo URL input  
- Extract:
  - file tree  
  - README (if exists)  
  - key source files  
- Ignore irrelevant files:
  - node_modules  
  - dist  
  - build  

---

### 8.2 AI Generation Pipeline (Improved)

Multi-step structured generation:

1. Repo analysis (structure + tech detection)  
2. File-level summarization (key modules only)  
3. Section-by-section synthesis  
4. Final Project Brain Markdown rendering  

---

### 8.3 Output Format (STRICT STRUCTURE)

Each Project Brain must include:

- Project Overview (1–3 sentences, non-technical)  
- Problem Being Solved  
- Key Features  
- Tech Stack  
- Architecture Explanation (simple, visual-first language)  
- Key Components / Modules  
- Tradeoffs & Design Decisions  
- Challenges (user input + inferred)  
- Learnings  
- Interview Explanation (how to talk about it)  

---

### 8.4 “Living Project Brain” Layer (NEW)

Each generated Project Brain can be:

- Regenerated with improvements  
- Simplified for non-technical audiences  
- Rewritten for recruiters  
- Converted into resume bullets  
- Converted into interview answers  

---

### 8.5 Export Options

- Markdown download  
- Copy to clipboard  
- Shareable public link  
- (Future) portfolio embed widget  

---

## 9. UX / UI Requirements

### Core UX Principle

“Instant clarity from complexity”

---

### UI Flow

- Landing page → GitHub URL input  
- Loading state → “Analyzing repository…”  
- Results page with structured sections  

---

### Results Page Sections

- Overview (top-level clarity first)  
- Problem & Features  
- Architecture  
- Technical breakdown  
- Tradeoffs & learnings  
- Interview narrative  

---

### Editing UX (IMPORTANT ADDITION)

- Each section is editable  
- “Regenerate section” button  
- “Simplify / More technical / Recruiter mode” toggles  

---

## 10. Technical Requirements

### Backend

- GitHub API integration  
- Repo parsing + file filtering  
- LLM orchestration pipeline  
- Chunking system for large repos  

---

### AI Pipeline (Improved Design)

1. Stage 1: Repo structure understanding  
2. Stage 2: selective file summarization  
3. Stage 3: structured JSON schema generation  
4. Stage 4: Markdown rendering layer  

---

### Frontend

- Next.js / React  
- Streaming generation UI (recommended)  
- Markdown renderer with section components  
- Editable sections UI  

---

### Storage

- Save Project Brains per user  
- Enable regeneration history  
- Shareable public URLs  

---

## 11. Success Metrics (Improved)

### Activation Metrics

- % users completing generation (>40%)  
- Time to first output (<60 seconds target)  

---

### Engagement Metrics (IMPORTANT ADDITION)

- % users editing output  
- % users regenerating sections  
- average sessions per user  
- repeat repo usage  

---

### Value Metrics

- % users using output in portfolio/resume  
- share/export rate  
- willingness to pay conversion  

---

## 12. Monetization

### Freemium Model

- Free: 1–2 Project Brains  
- Paid: subscription or credits  

---

### Suggested Paid Tier ($10–$15/month)

- unlimited or high-volume generation  
- regeneration features  
- export + share links  
- recruiter mode + resume bullets  

---

## 13. Risks & Mitigations

### Risk 1: Generic AI outputs

Mitigation:
- strict output schema per section  
- tone constraints (simple, recruiter-friendly)  
- structured multi-stage generation  

---

### Risk 2: One-time usage problem

Mitigation:
- editable + regenerable sections  
- resume/interview transformations  
- “living project profile” concept  

---

### Risk 3: Large repo complexity

Mitigation:
- smart file sampling  
- focus detection (core modules only)  
- token-efficient summarization  

---

### Risk 4: Competition (Copilot / Cody)

Mitigation:
- focus on career storytelling, not code chat  
- outputs designed for humans, not developers  

---

## 14. Differentiation

DevMD is NOT:
- a code assistant  
- a repo chatbot  
- a README generator  

DevMD IS:
- a career storytelling layer that translates code into recruiter-ready understanding in Markdown format  

---

## 15. Future Vision

DevMD evolves into:

- AI portfolio system  
- Resume generator from real projects  
- Interview simulation engine  
- Personal dev knowledge base  
- “Explain any codebase instantly” platform  