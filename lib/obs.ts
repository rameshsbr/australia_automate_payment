// lib/obs.ts
type Fields = Record<string, unknown>;

export function logEvent(event: string, fields: Fields = {}) {
  console.log(JSON.stringify({ level: "info", event, ...fields, ts: new Date().toISOString() }));
}
export function logWarn(event: string, fields: Fields = {}) {
  console.warn(JSON.stringify({ level: "warn", event, ...fields, ts: new Date().toISOString() }));
}
export function logError(event: string, fields: Fields = {}) {
  console.error(JSON.stringify({ level: "error", event, ...fields, ts: new Date().toISOString() }));
}
