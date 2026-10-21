import { getClient, configured, english, text, route, message } from './member-client.js';
const form = document.getElementById('member-form');
const button = form.querySelector('button');
async function start() {
  if (!configured()) { message(text('La raccolta riservata non è ancora attiva.', 'The private collection is not yet available.')); button.disabled = true; return; }
  try {
    const api = await getClient();
    const params = new URLSearchParams(location.search);
    const token_hash = params.get('token_hash');
    // A token hash in the email link works even when the email opens on another device.
    if (token_hash) {
      const { error } = await api.auth.verifyOtp({ token_hash, type: 'email' });
      history.replaceState(null, '', route('accesso'));
      if (error) throw new Error(text('Il link è scaduto o è già stato usato. Richiedine uno nuovo.', 'This link expired or was already used. Request a new one.'));
    }
    const { data: { user } } = await api.auth.getUser();
    if (user && user.email_confirmed_at) { location.replace(route('raccolta')); return; }
    message('');
  } catch (error) { message(error.message); }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault(); button.disabled = true;
  try {
    const api = await getClient();
    const email = form.elements.email.value.trim();
    const { error } = await api.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: new URL(route('accesso'), location.href).href, data: { language: english ? 'en' : 'it' } } });
    if (error) throw new Error(text('Non riesco a inviare il link. Riprova tra poco.', 'Unable to send the link. Please try again shortly.'));
    message(text('Controlla la tua email: trovi un link personale per entrare. Se non arriva, controlla anche la posta indesiderata.', 'Check your email for your personal sign-in link. If it does not arrive, check your spam folder.'));
  } catch (error) { message(error.message); }
  finally { button.disabled = false; }
});
start();
