/**
 * Fetch and decode file contents from a GitHub repo via the local proxy.
 * Proxy endpoint: GET /api/github/repo?owner=<owner>&repo=<repo>&path=<path>
 */

export interface GitHubFileResult {
  ok: true;
  content: string; // decoded text
}

export interface GitHubFetchError {
  ok: false;
  error: string;
}

export type GitHubFetchResult = GitHubFileResult | GitHubFetchError;

/**
 * Fetch a single file's text content from a GitHub repo via the server proxy.
 * Returns the decoded file content string on success, or an error message.
 */
export async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string,
  timeoutMs = 10000
): Promise<GitHubFetchResult> {
  const url = `/api/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;

  let res: Response;
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e: unknown) {
    clearTimeout(timerId);
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Request timed out fetching from GitHub." };
    }
    return { ok: false, error: "Network error fetching from GitHub." };
  }
  clearTimeout(timerId);

  if (!res.ok) {
    return { ok: false, error: `GitHub API error: ${res.status} ${res.statusText}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Invalid JSON response from GitHub API." };
  }

  // GitHub contents API returns an array for directories
  if (Array.isArray(data)) {
    return { ok: false, error: "Path points to a directory, not a file." };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("content" in data) ||
    typeof (data as Record<string, unknown>).content !== "string"
  ) {
    return { ok: false, error: "Unexpected GitHub API response format." };
  }

  const base64 = ((data as Record<string, unknown>).content as string).replace(/\s/g, "");
  let decoded: string;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return { ok: false, error: "Failed to decode base64 content from GitHub." };
  }

  return { ok: true, content: decoded };
}
