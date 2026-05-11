const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
