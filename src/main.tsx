import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init, initData, isTMA, mockTelegramEnv } from '@tma.js/sdk';
import App from './App';
import './index.css';

if (!isTMA()) {
  // ponytail: dev/browser fallback so the app runs outside Telegram
  mockTelegramEnv({
    launchParams: {
      tgWebAppVersion: '8.0',
      tgWebAppPlatform: 'tdesktop',
      tgWebAppThemeParams: {},
      tgWebAppData: new URLSearchParams([
        ['user', JSON.stringify({ id: 123, first_name: 'Test', last_name: 'User', username: 'tester', language_code: 'en', is_premium: true })],
        ['hash', 'mock-hash'],
        ['auth_date', String(Math.floor(Date.now() / 1000))],
        ['signature', 'mock-signature'],
      ]),
    },
  });
}

try {
  init();
} catch {
  // outside Telegram: mock data above already provides launch params
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App me={me()} />
  </StrictMode>,
);

function me() {
  const user = initData.user();
  return {
    id: String(user?.id ?? 0),
    firstName: user?.first_name ?? 'Player',
    photoUrl: user?.photo_url,
  };
}
