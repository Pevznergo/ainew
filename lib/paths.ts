export function getUserChannelPath(nickname: string | null | undefined, id: string): string {
  const nick = String(nickname || '').trim();
  return `/u/${encodeURIComponent(nick || id)}`;
}
