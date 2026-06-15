import { NextResponse } from "next/server";

import { parseGithubRepoUrl } from "@/lib/github-url";

type GithubRepoResponse = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
};

type GithubTreeItem = {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
};

type GithubTreeResponse = {
  sha: string;
  truncated: boolean;
  tree: GithubTreeItem[];
};

type AnalyzeRepoRequest = {
  url?: unknown;
};

const ignoredPathSegments = new Set([
  ".cache",
  ".next",
  ".nuxt",
  ".output",
  ".parcel-cache",
  ".pytest_cache",
  ".turbo",
  ".vercel",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor",
]);

const ignoredFileNames = new Set([
  ".DS_Store",
  "Thumbs.db",
  "npm-debug.log",
  "pnpm-debug.log",
  "yarn-debug.log",
]);

function isIgnoredTreePath(path: string) {
  const segments = path.split("/");
  const fileName = segments.at(-1);

  return (
    segments.some((segment) => ignoredPathSegments.has(segment)) ||
    Boolean(fileName && ignoredFileNames.has(fileName))
  );
}

async function fetchGithubJson<T>(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "devmd-repo-analyzer",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    return {
      data: null,
      error: await getGithubErrorMessage(response),
      status: response.status,
    };
  }

  return {
    data: (await response.json()) as T,
    error: "",
    status: response.status,
  };
}

async function getGithubErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

async function fetchReadme(owner: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.raw",
        "User-Agent": "devmd-repo-analyzer",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await getGithubErrorMessage(response));
  }

  return response.text();
}

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

  let parsedRepo: ReturnType<typeof parseGithubRepoUrl>;

  try {
    parsedRepo = parseGithubRepoUrl(body.url);
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

  const { owner, repo, normalizedUrl } = parsedRepo;
  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);
  const repoResult = await fetchGithubJson<GithubRepoResponse>(
    `https://api.github.com/repos/${encodedOwner}/${encodedRepo}`
  );

  if (!repoResult.data) {
    return NextResponse.json(
      {
        error:
          repoResult.status === 404
            ? "Repository was not found or is not public."
            : repoResult.error,
      },
      { status: repoResult.status === 404 ? 404 : 502 }
    );
  }

  if (repoResult.data.private) {
    return NextResponse.json(
      { error: "DevMD only analyzes public GitHub repositories." },
      { status: 400 }
    );
  }

  const treeResult = await fetchGithubJson<GithubTreeResponse>(
    `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/trees/${encodeURIComponent(
      repoResult.data.default_branch
    )}?recursive=1`
  );

  if (!treeResult.data) {
    return NextResponse.json(
      { error: `Could not fetch repository tree: ${treeResult.error}` },
      { status: 502 }
    );
  }

  let readme: string | null;

  try {
    readme = await fetchReadme(owner, repo);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Could not fetch README: ${
          error instanceof Error ? error.message : "Unknown GitHub API error"
        }`,
      },
      { status: 502 }
    );
  }

  const filteredTree = treeResult.data.tree
    .filter((item) => !isIgnoredTreePath(item.path))
    .map((item) => ({
      path: item.path,
      type: item.type,
      size: item.size ?? null,
    }));

  return NextResponse.json({
    repository: {
      id: repoResult.data.id,
      name: repoResult.data.name,
      fullName: repoResult.data.full_name,
      description: repoResult.data.description,
      url: repoResult.data.html_url,
      normalizedUrl,
      defaultBranch: repoResult.data.default_branch,
      language: repoResult.data.language,
      fork: repoResult.data.fork,
      stars: repoResult.data.stargazers_count,
      forks: repoResult.data.forks_count,
      openIssues: repoResult.data.open_issues_count,
      license: repoResult.data.license
        ? {
            key: repoResult.data.license.key,
            name: repoResult.data.license.name,
            spdxId: repoResult.data.license.spdx_id,
          }
        : null,
      owner: {
        login: repoResult.data.owner.login,
        avatarUrl: repoResult.data.owner.avatar_url,
        url: repoResult.data.owner.html_url,
      },
      createdAt: repoResult.data.created_at,
      updatedAt: repoResult.data.updated_at,
      pushedAt: repoResult.data.pushed_at,
      sizeKb: repoResult.data.size,
    },
    readme,
    tree: {
      sha: treeResult.data.sha,
      truncated: treeResult.data.truncated,
      totalCount: treeResult.data.tree.length,
      filteredCount: filteredTree.length,
      ignoredCount: treeResult.data.tree.length - filteredTree.length,
      items: filteredTree,
    },
  });
}
