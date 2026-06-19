import { NextResponse } from "next/server";

import { analyzePublicGithubRepository } from "@/lib/github/analyze-repo";

type AnalyzeRepoRequest = {
  url?: unknown;
};

export async function POST(request: Request) {
  let body: AnalyzeRepoRequest;

  try {
    body = (await request.json()) as AnalyzeRepoRequest;
  } catch {
    return NextResponse.json(
      { error: "Send a JSON body like { \"url\": \"https://github.com/owner/repo\" }." },
      { status: 400 }
    );
  }

  if (typeof body.url !== "string") {
    return NextResponse.json(
      { error: "GitHub repository URL is required." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await analyzePublicGithubRepository(body.url));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Use a valid public GitHub repository URL.",
      },
      { status: 400 }
    );
  }
}
