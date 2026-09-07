import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceAssistantService } from '../src/services/voiceAssistantService.ts';
import { DEMO_SCENARIOS } from '../src/mocks/scenarios.ts';

test('1. Initial state has safe defaults and strictly null coordinates', () => {
  const service = new VoiceAssistantService('en');
  const state = service.getState();

  assert.equal(state.voiceState, 'IDLE');
  assert.equal(state.dialogueStep, 'WELCOME');
  assert.equal(state.profile.latitude, null, 'Latitude must strictly be null');
  assert.equal(state.profile.longitude, null, 'Longitude must strictly be null');
  assert.ok(state.profile.session_id, 'Session ID must be generated');
});

test('2. Step-by-step dialogue progression: Delivery Rider Scenario', async () => {
  const service = new VoiceAssistantService('en');
  service.startConversation();

  let state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION');

  // Worker speaks occupation naturally
  await service.handleUserInput('I work as a delivery rider');
  state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION_CONFIRM');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /delivery.*rider/);

  // Worker confirms occupation
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'GOAL');
  assert.match(state.profile.occupation.toLowerCase(), /delivery/);

  // Worker speaks goal naturally
  await service.handleUserInput('I want to learn electrician work');
  state = service.getState();
  assert.equal(state.dialogueStep, 'GOAL_CONFIRM');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /electrician/);

  // Worker confirms goal
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'DISTRICT');
  assert.match(state.profile.career_goal_text.toLowerCase(), /electrician/);

  // Worker provides district
  await service.handleUserInput('Bengaluru Urban');
  state = service.getState();
  assert.equal(state.dialogueStep, 'DISTRICT_CONFIRM');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /bengaluru urban/);

  // Worker confirms district
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'REVIEW');
  assert.equal(state.profile.district, 'Bengaluru Urban');

  // Strict non-fabrication check
  assert.equal(state.profile.latitude, null);
  assert.equal(state.profile.longitude, null);
});

test('3. "I don\'t know" handling: Auto Driver Scenario', async () => {
  const service = new VoiceAssistantService('en');
  service.startConversation();

  // Worker provides occupation
  await service.handleUserInput('I drive an auto');
  await service.handleUserInput('Yes');

  let state = service.getState();
  assert.equal(state.dialogueStep, 'GOAL');

  // Worker says "I don't know what to learn"
  await service.handleUserInput("I don't know what to learn");
  state = service.getState();

  // Must not treat as invalid or error; should accept and guide to district
  assert.equal(state.dialogueStep, 'DISTRICT');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /that's okay|suggest options/);
  assert.ok(state.profile.career_goal_text.length > 0);
});

test('4. Language switching preserves profile and session ID', async () => {
  const service = new VoiceAssistantService('en', {
    occupation: 'Domestic Worker',
    session_id: 'test-sess-preserve-1',
  });

  let state = service.getState();
  assert.equal(service.getLanguage(), 'en');
  assert.equal(state.profile.occupation, 'Domestic Worker');
  assert.equal(state.profile.session_id, 'test-sess-preserve-1');

  // Switch to Kannada in-flow
  await service.handleUserInput('Speak Kannada');
  state = service.getState();
  assert.equal(service.getLanguage(), 'kn');
  assert.equal(state.profile.occupation, 'Domestic Worker', 'Occupation must be preserved across language switch');
  assert.equal(state.profile.session_id, 'test-sess-preserve-1', 'Session ID must be preserved');

  // Switch back to English
  await service.handleUserInput('Speak English');
  state = service.getState();
  assert.equal(service.getLanguage(), 'en');
  assert.equal(state.profile.occupation, 'Domestic Worker');
});

test('5. Go back and correction handling', async () => {
  const service = new VoiceAssistantService('en');
  service.startConversation();

  await service.handleUserInput('Auto driver');
  let state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION_CONFIRM');

  // Worker says "No" during confirmation
  await service.handleUserInput('No');
  state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION', 'Should return to occupation prompt on negation');

  // Worker provides corrected occupation
  await service.handleUserInput('Delivery rider');
  state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION_CONFIRM');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /delivery.*rider/);

  // Worker says "Go back"
  await service.handleUserInput('Go back');
  state = service.getState();
  assert.equal(state.dialogueStep, 'OCCUPATION');
});

test('6. Stop / Exit command pauses gracefully', async () => {
  const service = new VoiceAssistantService('en');
  service.startConversation();

  await service.handleUserInput('Stop');
  const state = service.getState();
  assert.equal(state.dialogueStep, 'STOPPED');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /pause|ready/);
});

test('7. Progressive recommendation explanation walkthrough', async () => {
  const service = new VoiceAssistantService('en');
  const demoRec = DEMO_SCENARIOS.find((s) => s.id === 'delivery-to-electrician')!.response;

  service.startProgressiveExplanation(demoRec);
  let state = service.getState();

  // Step 1: Overview
  assert.equal(state.dialogueStep, 'PROGRESSIVE_OVERVIEW');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /electrician/);

  // Step 2: Course
  await service.handleUserInput('Yes, tell me about course');
  state = service.getState();
  assert.equal(state.dialogueStep, 'PROGRESSIVE_COURSE');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /course/);

  // Step 3: Centre
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'PROGRESSIVE_CENTRE');
  assert.match(state.lastAssistantSpeech.toLowerCase(), /train|centre/);

  // Step 4: Scheme
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'PROGRESSIVE_SCHEME');

  // Step 5: Next steps
  await service.handleUserInput('Yes');
  state = service.getState();
  assert.equal(state.dialogueStep, 'PROGRESSIVE_NEXT_STEPS');
});
