import test from 'node:test';
import assert from 'node:assert/strict';
import { isMockMode, getApiMode, recommendationsApi, ApiError } from '../src/services/api.ts';
import { DEMO_SCENARIOS } from '../src/mocks/scenarios.ts';

test('1. isMockMode returns true when VITE_API_MODE=mock', () => {
  process.env.VITE_API_MODE = 'mock';
  assert.equal(getApiMode(), 'mock');
  assert.equal(isMockMode(), true);
});

test('2. isMockMode returns true when VITE_API_MODE is undefined or empty', () => {
  delete process.env.VITE_API_MODE;
  assert.equal(isMockMode(), true);
  process.env.VITE_API_MODE = '';
  assert.equal(isMockMode(), true);
});

test('3. isMockMode returns false when VITE_API_MODE=real', () => {
  process.env.VITE_API_MODE = 'real';
  assert.equal(getApiMode(), 'real');
  assert.equal(isMockMode(), false);
  // Restore mock mode
  process.env.VITE_API_MODE = 'mock';
});

test('4. getRecommendations returns delivery-to-electrician for delivery worker in mock mode', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profile = {
    occupation: 'Delivery / Courier Rider',
    district: 'Bengaluru Urban',
    career_goal_text: 'Electrician',
    education: '10th Pass',
    pincode: '560001',
    age: 25,
    gender: 'Male',
    latitude: null,
    longitude: null,
    session_id: 'test-sess-1',
  };
  const res = await recommendationsApi.getRecommendations(profile);
  assert.ok(res);
  assert.equal(res.profile.occupation, 'Delivery / Courier Rider');
  assert.ok(res.recommended_pathways.length > 0);
  assert.match(res.recommended_pathways[0].target_skill.name_en, /Electrician/i);
});

test('5. getRecommendations returns domestic-worker scenario for domestic worker in mock mode', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profile = {
    occupation: 'Domestic Worker / Housekeeper',
    district: 'Mysuru',
    career_goal_text: 'Tailoring',
    education: '8th Pass',
    pincode: '570001',
    age: 32,
    gender: 'Female',
    latitude: null,
    longitude: null,
    session_id: 'test-sess-2',
  };
  const res = await recommendationsApi.getRecommendations(profile);
  assert.ok(res);
  assert.equal(res.profile.occupation, 'Domestic Worker / Housekeeper');
  assert.ok(res.recommended_pathways.length > 0);
  assert.match(res.recommended_pathways[0].target_skill.name_en, /Tailor/i);
});

test('6. getRecommendations returns construction-to-fitter scenario for construction worker in mock mode', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profile = {
    occupation: 'Construction Labourer',
    district: 'Belagavi',
    career_goal_text: 'Factory Fitter',
    education: 'No Formal Education',
    pincode: '590001',
    age: 28,
    gender: 'Male',
    latitude: null,
    longitude: null,
    session_id: 'test-sess-3',
  };
  const res = await recommendationsApi.getRecommendations(profile);
  assert.ok(res);
  assert.equal(res.profile.occupation, 'Construction Labourer');
  assert.ok(res.recommended_pathways.length > 0);
  assert.match(res.recommended_pathways[0].target_skill.name_en, /Fitter/i);
});

test('7. getRecommendations returns autorickshaw-to-ev scenario for auto driver in mock mode', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profile = {
    occupation: 'Auto-Rickshaw Driver',
    district: 'Dharwad',
    career_goal_text: 'EV Technician',
    education: '12th Pass',
    pincode: '580020',
    age: 34,
    gender: 'Male',
    latitude: null,
    longitude: null,
    session_id: 'test-sess-4',
  };
  const res = await recommendationsApi.getRecommendations(profile);
  assert.ok(res);
  assert.equal(res.profile.occupation, 'Auto-Rickshaw Driver');
  assert.ok(res.recommended_pathways.length > 0);
  assert.match(res.recommended_pathways[0].target_skill.name_en, /Electric Vehicle|EV/i);
});

test('8. getRecommendations with explicit scenarioId returns that specific scenario', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profile = {
    occupation: 'Random Occupation',
    district: 'Bengaluru Urban',
    career_goal_text: 'Goal',
    education: null,
    pincode: null,
    age: null,
    gender: null,
    latitude: null,
    longitude: null,
    session_id: 'test-sess-5',
  };
  const res = await recommendationsApi.getRecommendations(profile, 'domestic-worker-to-tailoring');
  assert.ok(res);
  assert.equal(res.matched_occupation.name_en, 'Domestic Worker / Household Assistant');
});

test('9. session_id is preserved or generated in returned recommendation profile', async () => {
  process.env.VITE_API_MODE = 'mock';
  const profileWithSession = {
    occupation: 'Delivery / Courier Rider',
    district: 'Bengaluru Urban',
    career_goal_text: 'Electrician',
    education: null,
    pincode: null,
    age: null,
    gender: null,
    latitude: null,
    longitude: null,
    session_id: 'custom-session-12345',
  };
  const res1 = await recommendationsApi.getRecommendations(profileWithSession);
  assert.equal(res1.profile.session_id, 'custom-session-12345');

  const profileWithoutSession = {
    occupation: 'Delivery / Courier Rider',
    district: 'Bengaluru Urban',
    career_goal_text: 'Electrician',
    education: null,
    pincode: null,
    age: null,
    gender: null,
    latitude: null,
    longitude: null,
  };
  const res2 = await recommendationsApi.getRecommendations(profileWithoutSession);
  assert.ok(res2.profile.session_id);
  assert.match(res2.profile.session_id, /^sess_/);
});

test('10. In real mode with unreachable backend / network failure, throws clear, descriptive error message (not raw "Failed to fetch")', async () => {
  process.env.VITE_API_MODE = 'real';
  process.env.VITE_API_BASE_URL = 'http://127.0.0.1:59999'; // Unreachable port
  const profile = {
    occupation: 'Delivery / Courier Rider',
    district: 'Bengaluru Urban',
    career_goal_text: 'Electrician',
    education: null,
    pincode: null,
    age: null,
    gender: null,
    latitude: null,
    longitude: null,
    session_id: 'test-sess-err',
  };

  try {
    await recommendationsApi.getRecommendations(profile);
    assert.fail('Expected ApiError to be thrown');
  } catch (err) {
    assert.ok(err instanceof ApiError);
    assert.notEqual(err.message, 'Failed to fetch');
    assert.match(err.message, /Backend service unavailable/i);
    assert.match(err.message, /59999/);
  } finally {
    process.env.VITE_API_MODE = 'mock';
    process.env.VITE_API_BASE_URL = 'http://localhost:8001';
  }
});
