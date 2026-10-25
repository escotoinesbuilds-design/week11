import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeRepairRequest,
  detectImplausibleReserve,
  getVerifiedNoticesForZone,
  INITIAL_INCIDENTS,
  reviewIncident,
  validateReserveInput,
} from './domain.js';

test('only authorized human review can confirm an incident', () => {
  const pending = INITIAL_INCIDENTS[0];
  for (const action of ['approve', 'correct', 'reject']) {
    const residentAttempt = reviewIncident(pending, action, 'resident', 'Nota de prueba');
    assert.equal(residentAttempt.ok, false);
  }
  assert.equal(pending.status, 'pending');
  assert.equal(getVerifiedNoticesForZone([pending], 'Centro').length, 0);
  const result = reviewIncident(pending, 'approve', 'authorized-utility-reviewer');
  assert.equal(result.ok, true);
  assert.equal(result.incident.status, 'verified');
  assert.match(result.incident.updates.at(-1), /SIMULADO/);
});

test('unverified incidents never appear as official notices', () => {
  assert.deepEqual(getVerifiedNoticesForZone(INITIAL_INCIDENTS, 'Centro'), []);
  assert.equal(getVerifiedNoticesForZone(INITIAL_INCIDENTS, 'Norte').length, 1);
});

test('review corrections and rejections stay explicit and bounded', () => {
  const pending = INITIAL_INCIDENTS[0];
  assert.equal(reviewIncident(pending, 'correct', 'authorized-utility-reviewer', '').ok, false);
  const corrected = reviewIncident(pending, 'correct', 'authorized-utility-reviewer', 'Zona por verificar');
  assert.equal(corrected.incident.status, 'corrected');
  assert.equal(corrected.incident.correction, 'Zona por verificar');
  assert.equal(reviewIncident(pending, 'reject', 'authorized-utility-reviewer', 'x'.repeat(241)).ok, false);
});

test('reserve validation rejects malformed, long, and out-of-range values', () => {
  for (const value of ['', '-1', '101', '1.5', '1e2', '1234567', '<script>']) {
    assert.equal(validateReserveInput(value).valid, false, `expected ${value} to be rejected`);
  }
  assert.deepEqual(validateReserveInput('0'), { valid: true, value: 0 });
  assert.deepEqual(validateReserveInput('100'), { valid: true, value: 100 });
  assert.equal(validateReserveInput(50).valid, false);
});

test('local kNN flags suspicious changes and accepts a plausible reading', () => {
  assert.equal(detectImplausibleReserve(5, 90).review, true);
  assert.equal(detectImplausibleReserve(52, 55).review, false);
  assert.equal(detectImplausibleReserve(101, 50).review, true);
});

test('repair requests are never authorized by the demo', () => {
  assert.equal(authorizeRepairRequest({ scope: 'public-network' }, 'authorized-utility-reviewer').authorized, false);
});
