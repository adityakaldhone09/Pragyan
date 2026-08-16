/**
 * Comprehensive Assessment Flow Test (Phases 1-7)
 * This test identifies bugs and integration issues in the assessment system
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = 'test-user-' + Date.now();

// Test data
const testData = {
  phase1: {
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      age: 22,
      gender: 'Male',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
    },
    education: {
      currentStatus: 'College Student',
      highestQualification: "Bachelor's",
      currentYear: '3rd Year',
      degree: 'B.Tech',
      branch: 'Computer Science',
      collegeName: 'Test College',
      cgpaOrPercentage: 8.5,
    },
    careerGoal: 'Full Stack Developer',
    experience: {
      programmingExperience: 'Intermediate',
      previouslyWorked: false,
    },
  },
  phase2: {
    careerObjective: 'Become a Full Stack Developer',
    preferredDomains: ['Web Development', 'Cloud Computing'],
    favoriteSubjects: ['Programming', 'Web Technologies', 'Databases'],
    skillConfidence: 7,
    workStyle: ['Collaborative', 'Problem-Solving'],
    learningStyle: ['Project-Based', 'Hands-On'],
    motivation: 'Career Growth',
  },
};

// Test results
const results = {
  phase1: { passed: false, error: null, data: null },
  phase2: { passed: false, error: null, data: null },
  phase3: { passed: false, error: null, data: null },
  phase4: { passed: false, error: null, data: null },
  phase5: { passed: false, error: null, data: null },
  phase6: { passed: false, error: null, data: null },
  phase7: { passed: false, error: null, data: null },
};

/**
 * PHASE 1: User Discovery & Profile Collection
 */
async function testPhase1() {
  console.log('\n=== PHASE 1: User Discovery & Profile Collection ===');
  try {
    // Test savePhase1
    console.log('Testing: POST /assessment/phase-1 (savePhase1)');
    const phase1Response = await axios.post(`${BASE_URL}/assessment/phase-1`, testData.phase1, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 1 saved successfully');
    console.log('  sessionId:', phase1Response.data.sessionId);
    console.log('  phase:', phase1Response.data.phase);
    console.log('  completionPercent:', phase1Response.data.completionPercent);

    results.phase1 = { passed: true, data: phase1Response.data };

    // Verify saved data
    console.log('\nTesting: GET /assessment/phase-1 (getPhase1)');
    const getPhase1 = await axios.get(`${BASE_URL}/assessment/phase-1`, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });
    console.log('✓ Phase 1 retrieved successfully');
    console.log('  personalInfo saved:', !!getPhase1.data.personalInfo);
    console.log('  education saved:', !!getPhase1.data.education);

    return phase1Response.data.sessionId;
  } catch (error: any) {
    console.error('✗ Phase 1 test failed:', error.response?.data?.message || error.message);
    results.phase1.error = error.message;
    throw error;
  }
}

/**
 * PHASE 2: Interest & Domain Discovery
 */
async function testPhase2() {
  console.log('\n=== PHASE 2: Interest & Domain Discovery ===');
  try {
    console.log('Testing: POST /assessment/phase-2 (savePhase2)');
    const phase2Response = await axios.post(`${BASE_URL}/assessment/phase-2`, testData.phase2, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 2 saved successfully');
    console.log('  sessionId:', phase2Response.data.sessionId);
    console.log('  phase:', phase2Response.data.phase);
    console.log('  completionPercent:', phase2Response.data.completionPercent);

    results.phase2 = { passed: true, data: phase2Response.data };

    // Verify saved data
    console.log('\nTesting: GET /assessment/phase-2 (getPhase2)');
    const getPhase2 = await axios.get(`${BASE_URL}/assessment/phase-2`, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });
    console.log('✓ Phase 2 retrieved successfully');
    console.log('  careerObjective saved:', !!getPhase2.data.careerObjective);
    console.log('  preferredDomains:', getPhase2.data.preferredDomains?.length || 0);

    return phase2Response.data;
  } catch (error: any) {
    console.error('✗ Phase 2 test failed:', error.response?.data?.message || error.message);
    results.phase2.error = error.message;
    throw error;
  }
}

/**
 * PHASE 3: Hybrid/Cognitive Assessment
 */
async function testPhase3() {
  console.log('\n=== PHASE 3: Hybrid/Cognitive Assessment ===');
  try {
    console.log('Testing: POST /assessment/phase-3 (startPhase3)');
    const phase3Start = await axios.post(`${BASE_URL}/assessment/phase-3`, {}, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 3 started successfully');
    console.log('  sessionId:', phase3Start.data.sessionId);
    console.log('  has question:', !!phase3Start.data.question);
    console.log('  confidence:', phase3Start.data.confidence);

    const sessionId = phase3Start.data.sessionId;

    // Answer a question
    console.log('\nTesting: POST /assessment/phase-3/answer (submitAdaptiveAnswer)');
    const answerResponse = await axios.post(
      `${BASE_URL}/assessment/phase-3/answer`,
      {
        sessionId,
        answer: phase3Start.data.question?.options?.[0] || 'yes',
      },
      { headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` } }
    );

    console.log('✓ Phase 3 answer submitted');
    console.log('  confidence updated:', answerResponse.data.confidence);

    results.phase3 = { passed: true, data: phase3Start.data };
    return sessionId;
  } catch (error: any) {
    console.error('✗ Phase 3 test failed:', error.response?.data?.message || error.message);
    results.phase3.error = error.message;
    throw error;
  }
}

/**
 * PHASE 4: Technical Assessment
 */
async function testPhase4() {
  console.log('\n=== PHASE 4: Technical Assessment ===');
  try {
    console.log('Testing: POST /assessment/phase-4 (startPhase4)');
    const phase4Start = await axios.post(`${BASE_URL}/assessment/phase-4`, {}, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 4 started successfully');
    console.log('  sessionId:', phase4Start.data.sessionId);
    console.log('  has question:', !!phase4Start.data.question);
    console.log('  confidence:', phase4Start.data.confidence);

    const sessionId = phase4Start.data.sessionId;

    // Answer technical question
    console.log('\nTesting: POST /assessment/phase-4/answer (answerPhase4)');
    const answerResponse = await axios.post(
      `${BASE_URL}/assessment/phase-4/answer`,
      {
        sessionId,
        questionId: phase4Start.data.question?.questionId,
        answer: phase4Start.data.question?.options?.[0] || 'option1',
      },
      { headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` } }
    );

    console.log('✓ Phase 4 answer submitted');
    console.log('  technicalConfidence:', answerResponse.data.technicalConfidence);

    results.phase4 = { passed: true, data: phase4Start.data };
    return sessionId;
  } catch (error: any) {
    console.error('✗ Phase 4 test failed:', error.response?.data?.message || error.message);
    results.phase4.error = error.message;
    throw error;
  }
}

/**
 * PHASE 5: Specialization Detection
 */
async function testPhase5() {
  console.log('\n=== PHASE 5: Specialization Detection & Role Prediction ===');
  try {
    console.log('Testing: POST /assessment/phase-5 (startPhase5)');
    const phase5Start = await axios.post(`${BASE_URL}/assessment/phase-5`, {}, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 5 started successfully');
    console.log('  sessionId:', phase5Start.data.sessionId);
    console.log('  predicted roles:', phase5Start.data.predictedRoles?.length || 0);
    console.log('  primaryRole:', phase5Start.data.primaryRole);

    const sessionId = phase5Start.data.sessionId;

    // Answer specialization question
    console.log('\nTesting: POST /assessment/phase-5/answer (answerPhase5)');
    const answerResponse = await axios.post(
      `${BASE_URL}/assessment/phase-5/answer`,
      {
        sessionId,
        questionId: phase5Start.data.question?.questionId,
        answer: phase5Start.data.question?.options?.[0] || 'yes',
      },
      { headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` } }
    );

    console.log('✓ Phase 5 answer submitted');
    console.log('  confidence:', answerResponse.data.confidence);

    results.phase5 = { passed: true, data: phase5Start.data };
    return sessionId;
  } catch (error: any) {
    console.error('✗ Phase 5 test failed:', error.response?.data?.message || error.message);
    results.phase5.error = error.message;
    throw error;
  }
}

/**
 * PHASE 6: Confidence Validation
 */
async function testPhase6() {
  console.log('\n=== PHASE 6: Confidence Validation & Skill Gap Analysis ===');
  try {
    console.log('Testing: POST /assessment/phase-6 (startPhase6)');
    const phase6Start = await axios.post(`${BASE_URL}/assessment/phase-6`, {}, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 6 started successfully');
    console.log('  confidenceScores:', !!phase6Start.data.confidenceScores);
    console.log('  skillGapAnalysis:', !!phase6Start.data.skillGapAnalysis);
    console.log('  readinessScores:', !!phase6Start.data.readinessScores);

    const sessionId = phase6Start.data.sessionId;

    // Validate Phase 6
    console.log('\nTesting: POST /assessment/phase-6/validate (validatePhase6)');
    const validateResponse = await axios.post(
      `${BASE_URL}/assessment/phase-6/validate`,
      { sessionId },
      { headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` } }
    );

    console.log('✓ Phase 6 validated');
    console.log('  assessmentValidated:', validateResponse.data.assessmentValidated);
    console.log('  nextPhase:', validateResponse.data.nextPhase);

    results.phase6 = { passed: true, data: phase6Start.data };
    return sessionId;
  } catch (error: any) {
    console.error('✗ Phase 6 test failed:', error.response?.data?.message || error.message);
    results.phase6.error = error.message;
    throw error;
  }
}

/**
 * PHASE 7: Final Report Generation
 */
async function testPhase7() {
  console.log('\n=== PHASE 7: Final Report Generation ===');
  try {
    console.log('Testing: POST /assessment/phase-7 (generatePhase7Report)');
    const phase7Report = await axios.post(`${BASE_URL}/assessment/phase-7`, {}, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 7 report generated successfully');
    console.log('  has userSummary:', !!phase7Report.data.userSummary);
    console.log('  has assessmentSummary:', !!phase7Report.data.assessmentSummary);
    console.log('  topRecommendations count:', phase7Report.data.topRecommendations?.length || 0);
    console.log('  has skillGaps:', !!phase7Report.data.skillGaps);
    console.log('  has readinessScores:', !!phase7Report.data.readinessScores);

    results.phase7 = { passed: true, data: phase7Report.data };

    // Retrieve report
    console.log('\nTesting: GET /assessment/phase-7 (getPhase7Report)');
    const getReport = await axios.get(`${BASE_URL}/assessment/phase-7`, {
      headers: { 'Authorization': `Bearer test-token-${TEST_USER_ID}` },
    });

    console.log('✓ Phase 7 report retrieved');
    console.log('  report id:', getReport.data.id || 'N/A');

    return phase7Report.data;
  } catch (error: any) {
    console.error('✗ Phase 7 test failed:', error.response?.data?.message || error.message);
    results.phase7.error = error.message;
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('ASSESSMENT SYSTEM COMPREHENSIVE TEST (Phases 1-7)');
  console.log('Test User ID:', TEST_USER_ID);
  console.log('════════════════════════════════════════════════════════════');

  try {
    // Phase 1
    await testPhase1();

    // Phase 2
    await testPhase2();

    // Phase 3
    await testPhase3();

    // Phase 4
    await testPhase4();

    // Phase 5
    await testPhase5();

    // Phase 6
    await testPhase6();

    // Phase 7
    await testPhase7();
  } catch (error) {
    console.error('\n❌ Test sequence interrupted at error');
  }

  // Print results summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('TEST RESULTS SUMMARY');
  console.log('════════════════════════════════════════════════════════════');

  let passCount = 0;
  let failCount = 0;

  Object.entries(results).forEach(([phase, result]) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${phase.toUpperCase()}: ${status}${result.error ? ' - ' + result.error : ''}`);
    if (result.passed) passCount++;
    else failCount++;
  });

  console.log('\n' + `Total: ${passCount} passed, ${failCount} failed`);
  console.log('════════════════════════════════════════════════════════════\n');

  return { passCount, failCount, results };
}

// Export for use
export { runAllTests, testPhase1, testPhase2, testPhase3, testPhase4, testPhase5, testPhase6, testPhase7 };

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
