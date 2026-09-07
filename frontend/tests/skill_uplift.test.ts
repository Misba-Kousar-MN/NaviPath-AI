import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_SCENARIOS } from '../src/mocks/scenarios';

test('Skill Uplift Pipeline — Scenario Mock Data Verification', async (t) => {
  await t.test('All 4 demo scenarios have valid skill_bridge populated', () => {
    assert.equal(DEMO_SCENARIOS.length, 4, 'Should have exactly 4 demo scenarios');

    for (const scenario of DEMO_SCENARIOS) {
      assert.ok(scenario.response.skill_bridge, `Scenario ${scenario.id} must have skill_bridge defined`);
      const bridge = scenario.response.skill_bridge!;
      assert.ok(Array.isArray(bridge.pathways), `Scenario ${scenario.id} pathways must be an array`);
      assert.ok(bridge.pathways.length >= 1, `Scenario ${scenario.id} must have at least 1 pathway`);
    }
  });

  await t.test('Primary pathways contain all 12-step pipeline attributes', () => {
    for (const scenario of DEMO_SCENARIOS) {
      const pathway = scenario.response.skill_bridge!.pathways[0];
      assert.ok(pathway.transition_id, 'Must have transition_id');
      assert.ok(pathway.target_skill?.name_en, 'Must have target_skill');
      assert.ok(pathway.skill_overlap, 'Must have skill_overlap');
      assert.ok(pathway.skill_overlap.overlap_percentage >= 0, 'Overlap percentage must be valid');
      assert.ok(Array.isArray(pathway.skill_gaps), 'Must have skill_gaps array');
      assert.ok(Array.isArray(pathway.courses), 'Must have courses array');
      assert.ok(Array.isArray(pathway.nearby_centres), 'Must have nearby_centres array');
      assert.ok(pathway.scheme, 'Must have scheme');
      assert.ok(pathway.eligibility, 'Must have eligibility');
      assert.ok(pathway.certification_status, 'Must have certification_status');
      assert.ok(pathway.wage_lift, 'Must have wage_lift');
      assert.ok(pathway.pathway_score, 'Must have pathway_score');
      assert.ok(pathway.next_action, 'Must have next_action');
    }
  });

  await t.test('Wage lift numbers strictly align with hackathon benchmark values', () => {
    const delivery = DEMO_SCENARIOS.find(s => s.id === 'delivery-to-electrician')!;
    const domestic = DEMO_SCENARIOS.find(s => s.id === 'domestic-worker-to-tailoring')!;
    const construction = DEMO_SCENARIOS.find(s => s.id === 'construction-to-fitter')!;
    const auto = DEMO_SCENARIOS.find(s => s.id === 'autorickshaw-to-ev')!;

    // Delivery: 18000 -> 30000 (+12000, 66.7%)
    const pDelivery = delivery.response.skill_bridge!.pathways[0];
    assert.equal(pDelivery.wage_lift.current?.monthly_wage_inr, 18000);
    assert.equal(pDelivery.wage_lift.target?.monthly_wage_inr, 30000);
    assert.equal(pDelivery.wage_lift.absolute_difference_inr, 12000);
    assert.equal(pDelivery.wage_lift.percentage_difference, 66.7);
    assert.equal(pDelivery.wage_lift.data_status, 'mock');

    // Domestic: 8000 -> 16000 (+8000, 100%)
    const pDomestic = domestic.response.skill_bridge!.pathways[0];
    assert.equal(pDomestic.wage_lift.current?.monthly_wage_inr, 8000);
    assert.equal(pDomestic.wage_lift.target?.monthly_wage_inr, 16000);
    assert.equal(pDomestic.wage_lift.absolute_difference_inr, 8000);
    assert.equal(pDomestic.wage_lift.percentage_difference, 100.0);
    assert.equal(pDomestic.wage_lift.data_status, 'mock');

    // Construction: 12000 -> 29000 (+17000, 141.7%)
    const pConstruction = construction.response.skill_bridge!.pathways[0];
    assert.equal(pConstruction.wage_lift.current?.monthly_wage_inr, 12000);
    assert.equal(pConstruction.wage_lift.target?.monthly_wage_inr, 29000);
    assert.equal(pConstruction.wage_lift.absolute_difference_inr, 17000);
    assert.equal(pConstruction.wage_lift.percentage_difference, 141.7);
    assert.equal(pConstruction.wage_lift.data_status, 'mock');

    // Auto: 18000 -> 32000 (+14000, 77.8%)
    const pAuto = auto.response.skill_bridge!.pathways[0];
    assert.equal(pAuto.wage_lift.current?.monthly_wage_inr, 18000);
    assert.equal(pAuto.wage_lift.target?.monthly_wage_inr, 32000);
    assert.equal(pAuto.wage_lift.absolute_difference_inr, 14000);
    assert.equal(pAuto.wage_lift.percentage_difference, 77.8);
    assert.equal(pAuto.wage_lift.data_status, 'mock');
  });

  await t.test('All pathways carry mandatory illustrative disclaimer', () => {
    for (const scenario of DEMO_SCENARIOS) {
      for (const pathway of scenario.response.skill_bridge!.pathways) {
        assert.ok(
          pathway.wage_lift.disclaimer && pathway.wage_lift.disclaimer.length > 10,
          'Must have descriptive wage disclaimer'
        );
      }
    }
  });
});
