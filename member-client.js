import { config } from './member-config.js';
let client;
export const english = document.documentElement.lang === 'en';
export const text = (it, en) => english ? en : it;
export function configured() { return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url) && config.publishableKey.length > 20; }
export async function getClient() {
  if (!configured()) throw new Error(text('La raccolta riservata non è ancora attiva.', 'The private collection is not yet available.'));
  if (!client) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
    client = createClient(config.url, config.publishableKey, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
  }
  return client;
}
export const route = (name) => name + (english ? '-en' : '') + '.html';
export function message(value) { document.getElementById('member-status').textContent = value; }
export function safePath(path) {
  return typeof path === 'string' && /^assets\/[A-Za-z0-9_./-]+$/.test(path) && !path.split('/').includes('..');
}
export async function privateFile(path) {
  if (path !== 'catalogue.json' && !safePath(path)) throw new Error('Invalid image path');
  const api = await getClient();
  const { data, error } = await api.storage.from(config.bucket).download(path);
  if (error) throw new Error(text('Accesso alla raccolta non disponibile. Accedi nuovamente o contattami.', 'Collection access is unavailable. Sign in again or contact me.'));
  return data;
}
