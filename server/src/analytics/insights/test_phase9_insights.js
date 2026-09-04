const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
};

async function runPhase9Tests() {
  console.log('====================================================');
  console.log('  STARTING PHASE 9 INSIGHTS & RECOMMENDATIONS TEST  ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    await sleep(100);
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  };

  // Test 1: GET /api/insights/summary returns valid KPI metrics
  await test('GET /api/insights/summary returns 5 categories & data support counts', async () => {
    const res = await fetchJson(`${BASE_URL}/insights/summary`);
    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;
    assert(data.totalInsights > 0, 'Total insights should be > 0');
    assert(data.byCategory.Heat !== undefined, 'Heat category count missing');
    assert(data.byCategory.Environment !== undefined, 'Environment category count missing');
    assert(data.byCategory['Human Activity'] !== undefined, 'Human Activity category count missing');
    assert(data.byCategory.Risk !== undefined, 'Risk category count missing');
    assert(data.byCategory['Data Quality'] !== undefined, 'Data Quality category count missing');
    assert(data.byDataSupport['Strong Data Support'] !== undefined, 'Data Support counts missing');
  });

  // Test 2: GET /api/insights returns array of categorized, prioritized insights
  await test('GET /api/insights returns valid insight schema with evidence & metrics', async () => {
    const res = await fetchJson(`${BASE_URL}/insights`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data), 'Expected data to be array of insights');
    assert(res.data.data.length > 0, 'Should have at least 1 insight');

    const first = res.data.data[0];
    assert(first.id, 'Insight id missing');
    assert(first.category, 'Insight category missing');
    assert(first.severity, 'Insight severity missing');
    assert(first.title, 'Insight title missing');
    assert(first.summary, 'Insight summary missing');
    assert(first.confidence, 'Insight confidence/support missing');
    assert(first.evidence, 'Insight evidence object missing');
    assert(first.whyItMatters, 'Insight whyItMatters missing');
  });

  // Test 3: Filtering GET /api/insights by category
  await test('GET /api/insights?category=Heat filters correctly', async () => {
    const res = await fetchJson(`${BASE_URL}/insights?category=Heat`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    res.data.data.forEach((item) => {
      assert.strictEqual(item.category, 'Heat', `Expected category Heat, got ${item.category}`);
    });
  });

  // Test 4: Free-text search on /api/insights
  await test('GET /api/insights?search=Industrial performs keyword search', async () => {
    const res = await fetchJson(`${BASE_URL}/insights?search=Industrial`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.length > 0, 'Search should find Industrial insights');
  });

  // Test 5: GET /api/insights/:id returns specific insight
  await test('GET /api/insights/:id returns matching document', async () => {
    const listRes = await fetchJson(`${BASE_URL}/insights`);
    const targetId = listRes.data.data[0].id;
    const res = await fetchJson(`${BASE_URL}/insights/${targetId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.id, targetId);
  });

  // Test 6: POST /api/insights/refresh recaches without crashing
  await test('POST /api/insights/refresh resets and recalculates insights', async () => {
    const res = await fetchJson(`${BASE_URL}/insights/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.count > 0, 'Recalculated count should be > 0');
  });

  // Test 7: GET /api/recommendations/summary returns valid summary
  await test('GET /api/recommendations/summary returns 5 planning categories', async () => {
    const res = await fetchJson(`${BASE_URL}/recommendations/summary`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;
    assert(data.totalRecommendations > 0, 'Total recommendations should be > 0');
    assert(data.byCategory.Vegetation !== undefined, 'Vegetation category count missing');
    assert(data.byCategory['Urban Density'] !== undefined, 'Urban Density category count missing');
    assert(data.byCategory.Traffic !== undefined, 'Traffic category count missing');
    assert(data.byCategory['Population Exposure'] !== undefined, 'Population Exposure category count missing');
    assert(data.byCategory['Land Use'] !== undefined, 'Land Use category count missing');
  });

  // Test 8: GET /api/recommendations returns non-prescriptive actionable planning rules
  await test('GET /api/recommendations checks schema & non-prescriptive wording', async () => {
    const res = await fetchJson(`${BASE_URL}/recommendations`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data), 'Expected array of recommendations');

    res.data.data.forEach((rec) => {
      assert(rec.id, 'Recommendation id missing');
      assert(rec.category, 'Recommendation category missing');
      assert(rec.title, 'Recommendation title missing');
      assert(rec.action, 'Recommendation action missing');
      assert(rec.reason, 'Recommendation reason missing');
      assert(rec.priority, 'Recommendation priority missing');
      assert(rec.timeHorizon, 'Recommendation timeHorizon missing');
      assert(rec.supportingMetrics, 'Recommendation supportingMetrics missing');

      // Non-prescriptive language verification:
      const text = `${rec.title} ${rec.action}`.toLowerCase();
      const hasPermittedFraming =
        text.includes('evaluate') ||
        text.includes('consider') ||
        text.includes('prioritize') ||
        text.includes('explore') ||
        text.includes('assess');
      assert(
        hasPermittedFraming,
        `Recommendation '${rec.title}' lacks non-prescriptive conditional framing ('evaluate', 'consider', 'prioritize', 'explore', 'assess')`
      );

      // Verify absence of clinical/emergency claims
      assert(!text.includes('emergency evacuation'), 'Forbidden emergency claim found');
      assert(!text.includes('medical diagnosis'), 'Forbidden medical diagnosis claim found');
      assert(!text.includes('fatal'), 'Forbidden clinical prognosis claim found');
    });
  });

  // Test 9: GET /api/recommendations/:id returns matching document
  await test('GET /api/recommendations/:id returns detailed planning consideration', async () => {
    const listRes = await fetchJson(`${BASE_URL}/recommendations`);
    const targetId = listRes.data.data[0].id;
    const res = await fetchJson(`${BASE_URL}/recommendations/${targetId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.id, targetId);
    assert(Array.isArray(res.data.data.potentialBenefits), 'Expected potentialBenefits array');
    assert(res.data.data.implementationConsiderations, 'Expected implementationConsiderations string');
  });

  // Test 10: Filtering recommendations by category
  await test('GET /api/recommendations?category=Vegetation returns only vegetation recs', async () => {
    const res = await fetchJson(`${BASE_URL}/recommendations?category=Vegetation`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    res.data.data.forEach((r) => {
      assert.strictEqual(r.category, 'Vegetation');
    });
  });

  console.log(`\n====================================================`);
  console.log(`  PHASE 9 TEST RESULTS: ${passed}/${total} PASSED   `);
  console.log(`====================================================\n`);

  if (passed === total) {
    console.log('✓ All Phase 9 automated tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error(`✗ ${total - passed} tests failed!\n`);
    process.exit(1);
  }
}

runPhase9Tests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
