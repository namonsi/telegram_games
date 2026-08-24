import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init, initData, isTMA, mockTelegramEnv } from '@tma.js/sdk';
import App from './App';
import Admin from './ui/Admin';
import './index.css';

if (!isTMA()) {
  // ponytail: dev/browser fallback so the app runs outside Telegram.
  // open ?u=2 in a second window to act as the partner; ?username=x spoofs a username.
  const params = new URLSearchParams(window.location.search);
  const alt = params.get('u') === '2';
  const id = alt ? 222 : 123;
  mockTelegramEnv({
    launchParams: {
      tgWebAppVersion: '8.0',
      tgWebAppPlatform: 'tdesktop',
      tgWebAppThemeParams: {},
      tgWebAppData: new URLSearchParams([
        ['user', JSON.stringify({
          id,
          first_name: alt ? 'Partner' : 'Test',
          username: params.get('username') ?? (alt ? 'partner' : 'namon_si'),
          language_code: 'en',
        })],
        ['hash', 'mock-hash'],
        ['auth_date', String(Math.floor(Date.now() / 1000))],
        ['signature', 'mock-signature'],
      ]),
    },
  });
}

try {
  init();
  initData.restore();
} catch {
  // outside Telegram: mock data above already provides launch params
}

// wait a microtask so restore()'s signals settle before first paint reads them
void Promise.resolve().then(() => {
  const isAdmin =
    window.location.pathname === '/admin' || window.location.hash === '#/admin';
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isAdmin ? <Admin /> : <App me={me()} />}
    </StrictMode>,
  );
});

function me() {
  const user = initData.user();
  return {
    id: String(user?.id ?? 0),
    firstName: user?.first_name ?? 'Player',
    photoUrl: user?.photo_url,
    username: user?.username,
  };
}
