import assert from 'node:assert/strict';
import test from 'node:test';
import authProvider from './openbalenaAuthProvider';

const installLocalStorage = () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  return values;
};

test('authentication failures clear the stored token and reject', async () => {
  const values = installLocalStorage();
  values.set('auth', 'expired-token');

  await assert.rejects(authProvider.checkError({ status: 401 }));
  assert.equal(values.has('auth'), false);
});

test('administrator authorization denials preserve the stored token', async () => {
  const values = installLocalStorage();
  values.set('auth', 'valid-token');

  await authProvider.checkError({ status: 403, body: { code: 'ADMIN_DB_FORBIDDEN' } });
  assert.equal(values.get('auth'), 'valid-token');
});
