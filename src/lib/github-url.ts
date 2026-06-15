const githubOwnerPattern = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const githubRepoPattern = /^(?!\.{1,2}$)[a-z\d._-]{1,100}$/i;

export type ParsedGithubRepoUrl = {
  owner: string;
  repo: string;
  normalizedUrl: string;
};

export function parseGithubRepoUrl(value: string): ParsedGithubRepoUrl {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Enter a public GitHub repository URL.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error("Use a full URL like https://github.com/owner/repo.");
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "github.com") {
    throw new Error("Use a public GitHub URL starting with https://github.com/.");
  }

  if (parsedUrl.search || parsedUrl.hash) {
    throw new Error("Remove query strings or anchors from the repository URL.");
  }

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  if (pathParts.length !== 2) {
    throw new Error(
      "Use the repository root URL, for example https://github.com/owner/repo."
    );
  }

  const [owner, rawRepo] = pathParts;
  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;

  if (!githubOwnerPattern.test(owner) || !githubRepoPattern.test(repo)) {
    throw new Error("Use a valid GitHub owner and repository name.");
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}

export function validateGithubRepoUrl(value: string) {
  try {
    parseGithubRepoUrl(value);
    return "";
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Use a valid public GitHub repository URL.";
  }
}
