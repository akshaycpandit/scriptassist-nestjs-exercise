export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.message} ${err.stack ? `\n${err.stack}` : ''}`;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}