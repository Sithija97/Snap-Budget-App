// Placeholder id for optimistically-inserted rows, replaced by the server's
// real id once the create request resolves (or removed entirely on failure).
// Never sent to the API — purely a local React key until then.
export function tempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
