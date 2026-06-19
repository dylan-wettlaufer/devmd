import { parseGithubRepoUrl } from "@/lib/github-url";

export type GithubAnalyzedRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  normalizedUrl: string;
  defaultBranch: string;
  language: string | null;
  fork: boolean;
  stars: number;
  forks: number;
  openIssues: number;
  license: {
    key: string;
    name: string;
    spdxId: string;
  } | null;
  owner: {
    login: string;
    avatarUrl: string;
    url: string;
  };
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  sizeKb: number;
};

export type GithubTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit";
  size: number | null;
};

export type GithubSourceFile = {
  path: string;
  content: string;
};

export type GithubRepositoryAnalysis = {
  repository: GithubAnalyzedRepository;
  readme: string | null;
  tree: {
    sha: string;
    truncated: boolean;
    totalCount: number;
    filteredCount: number;
    ignoredCount: number;
    items: GithubTreeEntry[];
  };
  importantFiles: GithubSourceFile[];
};

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
  type: "blob" | "tree" | "commit";
  size?: number;
};

type GithubTreeResponse = {
  sha: string;
  truncated: boolean;
  tree: GithubTreeItem[];
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

const importantFileNames = new Set([
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vite.config.js",
  "vite.config.ts",
  "README.md",
  "Dockerfile",
  "docker-compose.yml",
]);

const sourceFileExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".cs",
  ".rb",
  ".php",
]);

const maxImportantFiles = 12;
const maxImportantFileBytes = 24_000;

function isIgnoredTreePath(path: string) {
  const segments = path.split("/");
  const fileName = segments.at(-1);

  return (
    segments.some((segment) => ignoredPathSegments.has(segment)) ||
    Boolean(fileName && ignoredFileNames.has(fileName))
  );
}

function getFileExtension(path: string) {
  const fileName = path.split("/").at(-1) ?? "";
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex) : "";
}

function isImportantSourcePath(item: GithubTreeEntry) {
  if (item.type !== "blob") {
    return false;
  }

  if (item.size !== null && item.size > maxImportantFileBytes) {
    return false;
  }

  const fileName = item.path.split("/").at(-1) ?? "";

  return importantFileNames.has(fileName) || sourceFileExtensions.has(getFileExtension(item.path));
}

function compareImportantPaths(left: GithubTreeEntry, right: GithubTreeEntry) {
  const leftName = left.path.split("/").at(-1) ?? "";
  const rightName = right.path.split("/").at(-1) ?? "";
  const leftIsManifest = importantFileNames.has(leftName);
  const rightIsManifest = importantFileNames.has(rightName);

  if (leftIsManifest !== rightIsManifest) {
    return leftIsManifest ? -1 : 1;
  }

  return left.path.localeCompare(right.path);
}

async function getGithubErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
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

async function fetchRawGithubFile(
  owner: string,
  repo: string,
  branch: string,
  path: string
) {
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    {
      cache: "no-store",
      headers: {
        "User-Agent": "devmd-repo-analyzer",
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.text();
}

async function fetchImportantFiles(
  owner: string,
  repo: string,
  branch: string,
  treeItems: GithubTreeEntry[]
) {
  const selectedPaths = treeItems
    .filter(isImportantSourcePath)
    .sort(compareImportantPaths)
    .slice(0, maxImportantFiles);

  const files = await Promise.all(
    selectedPaths.map(async (item) => {
      const content = await fetchRawGithubFile(owner, repo, branch, item.path);

      return content === null
        ? null
        : {
            path: item.path,
            content,
          };
    })
  );

  return files.filter((file): file is GithubSourceFile => file !== null);
}

export async function analyzePublicGithubRepository(repositoryUrl: string) {
  const { owner, repo, normalizedUrl } = parseGithubRepoUrl(repositoryUrl);
  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);
  const repoResult = await fetchGithubJson<GithubRepoResponse>(
    `https://api.github.com/repos/${encodedOwner}/${encodedRepo}`
  );

  if (!repoResult.data) {
    throw new Error(
      repoResult.status === 404
        ? "Repository was not found or is not public."
        : repoResult.error
    );
  }

  if (repoResult.data.private) {
    throw new Error("DevMD only analyzes public GitHub repositories.");
  }

  const treeResult = await fetchGithubJson<GithubTreeResponse>(
    `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/git/trees/${encodeURIComponent(
      repoResult.data.default_branch
    )}?recursive=1`
  );

  if (!treeResult.data) {
    throw new Error(`Could not fetch repository tree: ${treeResult.error}`);
  }

  const readme = await fetchReadme(owner, repo);
  const filteredTree = treeResult.data.tree
    .filter((item) => !isIgnoredTreePath(item.path))
    .map((item) => ({
      path: item.path,
      type: item.type,
      size: item.size ?? null,
    }));
  const importantFiles = await fetchImportantFiles(
    owner,
    repo,
    repoResult.data.default_branch,
    filteredTree
  );

  return {
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
    importantFiles,
  } satisfies GithubRepositoryAnalysis;
}
