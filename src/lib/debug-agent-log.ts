/** Debug session instrumentation — remove after prefs persistence verified. */
export function agentLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix",
): void {
  if (process.env.NODE_ENV !== "development") return;
  // #region agent log
  fetch("http://127.0.0.1:7686/ingest/e78a88d4-a732-4c34-857a-20f65bdd52e7", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "cbceb0",
    },
    body: JSON.stringify({
      sessionId: "cbceb0",
      location,
      message,
      data,
      hypothesisId,
      runId,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function userIdHint(id: string | undefined | null): string {
  return id ? id.slice(0, 8) : "none";
}
