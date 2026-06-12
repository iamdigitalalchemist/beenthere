export const DEMO_JOIN_TOKEN = "demo-join-token";

export function getJoinPath(token = DEMO_JOIN_TOKEN) {
  return `/join/${token}`;
}

export function getJoinUrl(origin: string, token = DEMO_JOIN_TOKEN) {
  return `${origin}${getJoinPath(token)}`;
}
