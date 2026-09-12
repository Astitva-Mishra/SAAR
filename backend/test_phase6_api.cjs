/**
 * Arogya Phase 6 - Automated Provider Workflow & Security Verification Suite
 * Tests all requirements specified in Phase 6 prompt.
 */
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'];
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: cookies || [],
          body: json,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractToken(cookies, body) {
  if (Array.isArray(cookies)) {
    for (const cookie of cookies) {
      if (cookie.startsWith('saar_token=')) {
        return cookie.split(';')[0];
      }
    }
  }
  if (body && body.token) {
    return `saar_token=${body.token}`;
  }
  return null;
}

let patientCookie = '';
let providerCookie = '';
let testCaseId = '';

async function runTests() {
  console.log('====================================================');
  console.log('   AROGYA PHASE 6 - PROVIDER WORKFLOW & RBAC TESTS  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('1. Verifying System Health (GET /api/health)');
    const healthRes = await request({ path: '/api/health' });
    assert(healthRes.status === 200, `Status is 200 (got ${healthRes.status})`);
    assert(healthRes.body.success === true, 'Service reports healthy');
    console.log(`     Database status: ${healthRes.body.database}`);

    // 2. Unauthenticated provider queue request
    console.log('\n2. Testing Unauthenticated Provider Queue Request');
    const unauthRes = await request({ path: '/api/cases' });
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 (got ${unauthRes.status})`);

    // 3. Authenticate / Register Patient
    console.log('\n3. Authenticating Patient (Rahul Sharma)');
    let patientLoginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      { emailOrMobile: 'rahul.sharma@example.com', password: 'Password@123' }
    );
    if (patientLoginRes.status !== 200) {
      // Try registering
      const regRes = await request(
        { path: '/api/auth/register', method: 'POST' },
        {
          name: 'Rahul Sharma',
          emailOrMobile: 'rahul.sharma@example.com',
          password: 'Password@123',
          role: 'PATIENT',
        }
      );
      patientCookie = extractToken(regRes.cookies, regRes.body) || '';
    } else {
      patientCookie = extractToken(patientLoginRes.cookies, patientLoginRes.body) || '';
    }
    assert(!!patientCookie, 'Patient session cookie acquired');

    // Verify Patient Role
    const patientMe = await request({
      path: '/api/auth/me',
      headers: { Cookie: patientCookie },
    });
    assert(patientMe.status === 200 && (patientMe.body.user?.role === 'PATIENT' || patientMe.body.data?.role === 'PATIENT'), 'Patient role verified as PATIENT');

    // 4. Authenticate / Register Provider
    console.log('\n4. Authenticating Provider (Dr. Priya Verma)');
    let providerLoginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      { emailOrMobile: 'priya.verma@aiims.edu', password: 'Password@123' }
    );
    if (providerLoginRes.status !== 200) {
      // Try registering
      const regRes = await request(
        { path: '/api/auth/register', method: 'POST' },
        {
          name: 'Dr. Priya Verma',
          emailOrMobile: 'priya.verma@aiims.edu',
          password: 'Password@123',
          role: 'PROVIDER',
          specialty: 'General Medicine',
        }
      );
      providerCookie = extractToken(regRes.cookies, regRes.body) || '';
    } else {
      providerCookie = extractToken(providerLoginRes.cookies, providerLoginRes.body) || '';
    }
    assert(!!providerCookie, 'Provider session cookie acquired');

    // Verify Provider Role
    const providerMe = await request({
      path: '/api/auth/me',
      headers: { Cookie: providerCookie },
    });
    assert(providerMe.status === 200 && (providerMe.body.user?.role === 'PROVIDER' || providerMe.body.data?.role === 'PROVIDER'), 'Provider role verified as PROVIDER');

    // 5. Patient creates a case for testing
    console.log('\n5. Creating Patient Intake Case');
    const caseCreateRes = await request(
      {
        path: '/api/cases',
        method: 'POST',
        headers: { Cookie: patientCookie },
      },
      {
        chiefComplaint: 'Severe dry cough, mild breathlessness for 3 days and fever 101F',
        symptoms: ['dry cough', 'breathlessness', 'fever'],
        duration: '3 days',
        severity: 'Moderate',
      }
    );
    assert(caseCreateRes.status === 201, `Case creation returned 201 (got ${caseCreateRes.status})`);
    testCaseId = caseCreateRes.body.case?.caseId || caseCreateRes.body.case?._id || caseCreateRes.body.data?.caseId;
    console.log(`     Created Case ID: ${testCaseId}`);

    // Submit answers to transition to SUBMITTED
    const answerRes = await request(
      {
        path: `/api/cases/${testCaseId}/answers`,
        method: 'PATCH',
        headers: { Cookie: patientCookie },
      },
      {
        answers: [
          { questionId: 'cough_dur', questionText: 'How long have you had the cough?', answerText: 'About 3 days' },
          { questionId: 'fever_deg', questionText: 'Is the fever continuous?', answerText: 'Comes mostly in the evening' },
        ],
      }
    );
    const updatedCase = answerRes.body.case || answerRes.body.data;
    assert(answerRes.status === 200, `Answer submission returned 200 (got ${answerRes.status})`);
    assert(updatedCase?.status === 'SUBMITTED', `Case status is now SUBMITTED (got ${updatedCase?.status})`);

    // 6. Security: Patient attempts provider-only operations -> 403
    console.log('\n6. Security Verification: Patient accessing Provider Endpoints');
    const patStatusRes = await request(
      {
        path: `/api/cases/${testCaseId}/status`,
        method: 'PATCH',
        headers: { Cookie: patientCookie },
      },
      { status: 'IN_REVIEW' }
    );
    assert(patStatusRes.status === 403, `Patient updating status blocked with 403 (got ${patStatusRes.status})`);

    const patNotesRes = await request(
      {
        path: `/api/cases/${testCaseId}/notes`,
        method: 'PATCH',
        headers: { Cookie: patientCookie },
      },
      { clinicalNotes: 'Patient attempting to write clinical note' }
    );
    assert(patNotesRes.status === 403, `Patient updating clinical notes blocked with 403 (got ${patNotesRes.status})`);

    const patCompRes = await request(
      {
        path: `/api/cases/${testCaseId}/complete`,
        method: 'POST',
        headers: { Cookie: patientCookie },
      },
      { clinicalNotes: 'Patient attempting to complete case' }
    );
    assert(patCompRes.status === 403, `Patient completing case blocked with 403 (got ${patCompRes.status})`);

    // 7. Provider retrieves queue
    console.log('\n7. Provider Retrieves Case Queue (GET /api/cases)');
    const queueRes = await request({
      path: '/api/cases',
      headers: { Cookie: providerCookie },
    });
    assert(queueRes.status === 200, `Provider queue returned 200 (got ${queueRes.status})`);
    const cases = queueRes.body.cases || queueRes.body.data || [];
    assert(Array.isArray(cases) && cases.length > 0, `Provider received cases list (count: ${cases.length})`);
    const foundCase = cases.find((c) => c.caseId === testCaseId || c._id === testCaseId);
    assert(!!foundCase, `Newly created case ${testCaseId} is present in provider queue`);

    // 8. Provider retrieves case detail
    console.log('\n8. Provider Retrieves Case Detail (GET /api/cases/:id)');
    const detailRes = await request({
      path: `/api/cases/${testCaseId}`,
      headers: { Cookie: providerCookie },
    });
    assert(detailRes.status === 200, `Provider detail returned 200 (got ${detailRes.status})`);
    const caseData = detailRes.body.case || detailRes.body.data;
    assert(caseData.chiefComplaintStructured?.symptom !== undefined || caseData.chiefComplaint !== undefined, 'Chief complaint present');
    assert(caseData.riskLevel !== undefined, `Risk level present (${caseData.riskLevel})`);
    assert(caseData.department !== undefined, `Department present (${caseData.department})`);
    assert(caseData.aiSummary !== undefined, 'AI-Assisted summary present');
    assert(caseData.answers?.length >= 2 || caseData.patientAnswers?.length >= 2, `Patient answers present`);

    // 9. Provider updates status to IN_REVIEW
    console.log('\n9. Provider Updates Status to IN_REVIEW (PATCH /api/cases/:id/status)');
    const inReviewRes = await request(
      {
        path: `/api/cases/${testCaseId}/status`,
        method: 'PATCH',
        headers: { Cookie: providerCookie },
      },
      { status: 'IN_REVIEW' }
    );
    const inReviewCase = inReviewRes.body.case || inReviewRes.body.data;
    assert(inReviewRes.status === 200, `Status update returned 200 (got ${inReviewRes.status})`);
    assert(inReviewCase?.status === 'IN_REVIEW', `Status updated to IN_REVIEW`);

    // 10. Provider saves clinical notes
    console.log('\n10. Provider Saves Clinical Notes (PATCH /api/cases/:id/notes)');
    const testNotes = 'Patient presents with moderate respiratory symptoms. Chest clear on auscultation. Advised warm saline gargles, steam inhalation, and oral paracetamol SOS. Follow up if fever persists beyond 48 hours.';
    const notesRes = await request(
      {
        path: `/api/cases/${testCaseId}/notes`,
        method: 'PATCH',
        headers: { Cookie: providerCookie },
      },
      { clinicalNotes: testNotes }
    );
    const notesCase = notesRes.body.case || notesRes.body.data;
    assert(notesRes.status === 200, `Notes save returned 200 (got ${notesRes.status})`);
    assert(notesCase?.clinicalNotes === testNotes, 'Clinical notes match saved text');

    // 11. Provider completes case
    console.log('\n11. Provider Completes Consultation (POST /api/cases/:id/complete)');
    const completeRes = await request(
      {
        path: `/api/cases/${testCaseId}/complete`,
        method: 'POST',
        headers: { Cookie: providerCookie },
      },
      { clinicalNotes: testNotes + ' Final advice explained to patient.' }
    );
    const completedCase = completeRes.body.case || completeRes.body.data;
    assert(completeRes.status === 200, `Case complete returned 200 (got ${completeRes.status})`);
    assert(completedCase?.status === 'COMPLETED', `Status updated to COMPLETED`);
    assert(!!completedCase?.completedAt, `completedAt timestamp populated: ${completedCase?.completedAt}`);
    assert(!!completedCase?.providerId, `providerId assigned: ${completedCase?.providerId}`);

    // 12. Cannot revert COMPLETED case
    console.log('\n12. Validating Status Immutability (Cannot revert COMPLETED case)');
    const revertRes = await request(
      {
        path: `/api/cases/${testCaseId}/status`,
        method: 'PATCH',
        headers: { Cookie: providerCookie },
      },
      { status: 'IN_REVIEW' }
    );
    assert(revertRes.status === 400, `Reverting completed case rejected with 400 (got ${revertRes.status})`);

    // 13. Invalid status value
    console.log('\n13. Validating Status Input Validation');
    const invalidStatusRes = await request(
      {
        path: `/api/cases/${testCaseId}/status`,
        method: 'PATCH',
        headers: { Cookie: providerCookie },
      },
      { status: 'CANCELLED_INVALID' }
    );
    assert(invalidStatusRes.status === 400, `Invalid status rejected with 400 (got ${invalidStatusRes.status})`);

    // 14. Nonexistent case ID
    console.log('\n14. Validating Nonexistent / Invalid Case ID');
    const nonExistentRes = await request({
      path: '/api/cases/ARG-99999999-999',
      headers: { Cookie: providerCookie },
    });
    assert(nonExistentRes.status === 404, `Nonexistent case returned 404 (got ${nonExistentRes.status})`);

    // 15. Data Integrity Verification
    console.log('\n15. Verifying Data Integrity of Completed Case');
    const finalDetailRes = await request({
      path: `/api/cases/${testCaseId}`,
      headers: { Cookie: providerCookie },
    });
    const finalData = finalDetailRes.body.case || finalDetailRes.body.data;
    assert(finalData.status === 'COMPLETED', 'Final status is COMPLETED');
    assert(finalData.chiefComplaint.includes('Severe dry cough'), 'Original patient chief complaint is unchanged');
    assert(finalData.answers?.length === 2 || finalData.patientAnswers?.length === 2, 'Patient answers preserved without modification');
    assert(!!finalData.aiSummary?.chiefComplaintStructured, 'AI summary preserved without modification');
    assert(Array.isArray(finalData.safetyFlags), 'Safety flags preserved intact');
    assert(finalData.riskLevel === 'LOW' || finalData.riskLevel === 'MODERATE' || finalData.riskLevel === 'POTENTIALLY_URGENT' || finalData.riskLevel === 'EMERGENCY', `Risk level remains valid (${finalData.riskLevel})`);
    assert(finalData.clinicalNotes.includes('Final advice explained to patient.'), 'Provider clinical notes preserved');

    // 16. Patient can see COMPLETED status
    console.log('\n16. Verifying Patient Can See COMPLETED Status');
    const patViewRes = await request({
      path: `/api/cases/${testCaseId}`,
      headers: { Cookie: patientCookie },
    });
    const patCase = patViewRes.body.case || patViewRes.body.data;
    assert(patViewRes.status === 200, `Patient view returned 200 (got ${patViewRes.status})`);
    assert(patCase?.status === 'COMPLETED', 'Patient sees COMPLETED status');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
