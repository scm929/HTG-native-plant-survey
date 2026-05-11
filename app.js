const SUPABASE_URL = 'https://kuxojpkuwijnpumovdnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tb5MC4fcKSWFTKhhpryaGA_EcXjR9EU';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView   = document.getElementById('login-view');
const fieldView   = document.getElementById('field-view');
const signInBtn   = document.getElementById('sign-in-btn');
const signOutBtn  = document.getElementById('sign-out-btn');
const userEmailEl = document.getElementById('user-email');
const loginError  = document.getElementById('login-error');

function showLogin() {
  loginView.classList.remove('hidden');
  fieldView.classList.add('hidden');
}

function showField(session) {
  userEmailEl.textContent = session.user.email;
  fieldView.classList.remove('hidden');
  loginView.classList.add('hidden');
}

signInBtn.addEventListener('click', async () => {
  signInBtn.disabled = true;
  signInBtn.textContent = 'Signing in…';
  loginError.textContent = '';
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) {
    loginError.textContent = 'Sign-in failed. Please try again.';
    signInBtn.disabled = false;
    signInBtn.textContent = 'Sign in with Google';
  }
});

signOutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
});

client.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showField(session);
  } else {
    showLogin();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
