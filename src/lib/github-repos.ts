export type GithubRepositorySummary = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string | null;
  updatedAt: string;
};

type GithubApiRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  pushed_at: string | null;
  updated_at: string;
};

const githubReposPerPage = "100";

async function getGithubErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function toRepositorySummary(repo: GithubApiRepository): GithubRepositorySummary {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    defaultBranch: repo.default_branch,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
  };
}

async function fetchGithubReposPage(accessToken: string, page: number) {
  const url = new URL("https://api.github.com/user/repos");
  url.searchParams.set("affiliation", "owner");
  url.searchParams.set("per_page", githubReposPerPage);
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "pushed");
  url.searchParams.set("direction", "desc");
  url.searchParams.set("visibility", "public");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "devmd-repo-selector",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(await getGithubErrorMessage(response));
  }

  return (await response.json()) as GithubApiRepository[];
}

export async function listSelectableGithubRepositories(accessToken: string) {
  const repositories: GithubRepositorySummary[] = [];
  let page = 1;

  while (true) {
    const pageRepositories = await fetchGithubReposPage(accessToken, page);

    repositories.push(
      ...pageRepositories
        .filter((repo) => !repo.private && !repo.fork && !repo.archived)
        .map(toRepositorySummary)
    );

    if (pageRepositories.length < Number(githubReposPerPage)) {
      break;
    }

    page += 1;
  }

  return repositories;
}
