import assert from 'node:assert/strict';
import { test } from 'node:test';

const PROJECT_ID = 'roteiroelismar-auth-test';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const API_KEY = `demo-${PROJECT_ID}`;
const EMAIL = 'test-auth@example.invalid';
const OLD_PASSWORD = 'TestPassword-123!';
const NEW_PASSWORD = 'TestPassword-456!';

async function authRequest(operation, body) {
  const response = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json();
  return { response, payload };
}

test('Auth Emulator suporta cadastro, login, troca e novo login', async () => {
  const signup = await authRequest('signUp', {
    email: EMAIL,
    password: OLD_PASSWORD,
    returnSecureToken: true,
  });
  assert.equal(signup.response.ok, true, JSON.stringify(signup.payload));
  assert.equal(signup.payload.email, EMAIL);
  assert.ok(signup.payload.localId);
  assert.ok(signup.payload.idToken);

  const login = await authRequest('signInWithPassword', {
    email: EMAIL,
    password: OLD_PASSWORD,
    returnSecureToken: true,
  });
  assert.equal(login.response.ok, true, JSON.stringify(login.payload));
  assert.equal(login.payload.localId, signup.payload.localId);

  const wrongLogin = await authRequest('signInWithPassword', {
    email: EMAIL,
    password: 'wrong-password',
    returnSecureToken: true,
  });
  assert.equal(wrongLogin.response.ok, false);

  const update = await authRequest('update', {
    idToken: login.payload.idToken,
    password: NEW_PASSWORD,
    returnSecureToken: true,
  });
  assert.equal(update.response.ok, true, JSON.stringify(update.payload));

  const newLogin = await authRequest('signInWithPassword', {
    email: EMAIL,
    password: NEW_PASSWORD,
    returnSecureToken: true,
  });
  assert.equal(newLogin.response.ok, true, JSON.stringify(newLogin.payload));
  assert.equal(newLogin.payload.localId, signup.payload.localId);
});

