const SUPABASE_URL = 'https://kuxojpkuwijnpumovdnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tb5MC4fcKSWFTKhhpryaGA_EcXjR9EU';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView      = document.getElementById('login-view');
const fieldView      = document.getElementById('field-view');
const signInBtn      = document.getElementById('sign-in-btn');
const signOutBtn     = document.getElementById('sign-out-btn');
const userEmailEl    = document.getElementById('user-email');
const loginError     = document.getElementById('login-error');
const addressDisplay = document.getElementById('address-display');
const yesBtn         = document.getElementById('yes-btn');
const noBtn          = document.getElementById('no-btn');
const saveError      = document.getElementById('save-error');
const saveToast      = document.getElementById('save-toast');
const coordsDisplay  = document.getElementById('coords-display');

// GPS state
let currentLat     = null;
let currentLng     = null;
let currentAddress = null;
let lastGeocodedLat = null;
let lastGeocodedLng = null;
let watchId = null;

// Auth state
let currentSession = null;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address;
    return addr?.house_number
      ? `${addr.house_number} ${addr.road}`
      : data.display_name;
  } catch {
    return null;
  }
}

function startGPS() {
  if (!('geolocation' in navigator)) {
    addressDisplay.textContent = 'Location unavailable — check GPS permissions';
    return;
  }
  watchId = navigator.geolocation.watchPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      currentLat = latitude;
      currentLng = longitude;
      coordsDisplay.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const needsGeocode = lastGeocodedLat === null
        || haversineMeters(lastGeocodedLat, lastGeocodedLng, latitude, longitude) >= 5;

      if (needsGeocode) {
        lastGeocodedLat = latitude;
        lastGeocodedLng = longitude;
        const address = await reverseGeocode(latitude, longitude);
        // Only update if coordinates haven't drifted to a new geocode request
        if (lastGeocodedLat === latitude && lastGeocodedLng === longitude) {
          currentAddress = address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          addressDisplay.textContent = currentAddress;
        }
      }

      yesBtn.disabled = false;
      noBtn.disabled = false;
    },
    _err => {
      addressDisplay.textContent = 'Location unavailable — check GPS permissions';
    },
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

function stopGPS() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  currentLat = null;
  currentLng = null;
  currentAddress = null;
  lastGeocodedLat = null;
  lastGeocodedLng = null;
  yesBtn.disabled = true;
  noBtn.disabled = true;
  addressDisplay.textContent = 'Getting location…';
  saveError.classList.add('hidden');
  saveError.textContent = '';
}

let toastTimer = null;

async function saveObservation(hasNatives) {
  yesBtn.disabled = true;
  noBtn.disabled = true;
  saveError.classList.add('hidden');
  saveError.textContent = '';

  const { error } = await client.from('observations').insert({
    has_natives: hasNatives,
    latitude:    currentLat,
    longitude:   currentLng,
    address:     currentAddress,
    user_id:     currentSession.user.id
  });

  if (error) {
    saveError.textContent = 'Save failed — tap again to retry.';
    saveError.classList.remove('hidden');
    yesBtn.disabled = false;
    noBtn.disabled = false;
    return;
  }

  // Success toast
  clearTimeout(toastTimer);
  saveToast.classList.remove('hidden');
  toastTimer = setTimeout(() => saveToast.classList.add('hidden'), 1500);
  yesBtn.disabled = false;
  noBtn.disabled = false;
}

function showLogin() {
  loginView.classList.remove('hidden');
  fieldView.classList.add('hidden');
}

function showField(session) {
  currentSession = session;
  userEmailEl.textContent = session.user.email;
  fieldView.classList.remove('hidden');
  loginView.classList.add('hidden');
  startGPS();
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

yesBtn.addEventListener('click', () => saveObservation(true));
noBtn.addEventListener('click', () => saveObservation(false));

signOutBtn.addEventListener('click', async () => {
  stopGPS();
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
