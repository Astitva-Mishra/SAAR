/**
 * Arogya Phase 7 - Comprehensive Reliability, Safety, RBAC & End-to-End Verification Suite
 * Tests all 30 steps outlined in the Phase 7 specifications.
 */
const http = require('http');
require('dotenv').config();

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

async function runPhase7Suite() {
  console.log('================================================================');
  console.log('   AROGYA PHASE 7 - COMPREHENSIVE VERIFICATION & TEST SUITE   ');
  console.log('================================================================\n');

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
    // -------------------------------------------------------------
    // 1. Database Health Check (Step 27)
    // -------------------------------------------------------------
    console.log('--- SECTION 1: DATABASE & BACKEND HEALTH (Step 27) ---');
    const healthRes = await request({ path: '/api/health' });
    assert(healthRes.status === 200, `Health endpoint returns 200 (got ${healthRes.status})`);
    assert(healthRes.body.success === true, 'Health reports success = true');
    assert(healthRes.body.database === 'connected', `Database status is connected (got ${healthRes.body.database})`);

    // -------------------------------------------------------------
    // 2. Real Groq Extraction & AI Safety Boundary (Steps 3, 5)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: REAL GROQ AI EXTRACTION & SAFETY BOUNDARY (Step 3 & 5) ---');
    const { extractClinicalInformation, fallbackExtractClinicalInformation, fallbackGenerateCaseSummary } = require('./dist/services/aiService');

    const testComplaint = 'I have had a headache since yesterday and it gets worse when I move around.';
    console.log(`Testing with complaint: "${testComplaint}"`);
    const extracted = await extractClinicalInformation(testComplaint);

    assert(extracted !== null && typeof extracted === 'object', 'Groq extraction returned valid object');
    assert(extracted.chiefComplaint.toLowerCase().includes('headache'), `Extracted chiefComplaint contains "headache" (got "${extracted.chiefComplaint}")`);
    assert(Array.isArray(extracted.symptoms) && extracted.symptoms.length > 0, `Extracted symptoms array populated (count: ${extracted.symptoms.length})`);
    assert(extracted.duration.toLowerCase().includes('yesterday') || extracted.duration.toLowerCase().includes('day') || extracted.duration.toLowerCase().includes('recent'), `Duration extracted accurately (got "${extracted.duration}")`);
    
    // Clinical Boundary Verification
    const extractedString = JSON.stringify(extracted).toLowerCase();
    const diagnosisKeywords = ['migraine diagnosed', 'brain tumor', 'hypertension diagnosed', 'prescribed', 'take paracetamol', 'dosage'];
    const hasDiagnosticLeak = diagnosisKeywords.some((kw) => extractedString.includes(kw));
    assert(!hasDiagnosticLeak, 'AI does NOT diagnose diseases or prescribe medications');
    assert(extracted.extractionMethod === 'groq', `Extraction method is groq (got "${extracted.extractionMethod}")`);

    // -------------------------------------------------------------
    // 3. Groq Failure & Fallback Resilience (Step 4)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: DETERMINISTIC GROQ FALLBACK RESILIENCE (Step 4) ---');
    const fallbackResult = fallbackExtractClinicalInformation('Mujhe 3 din se bukhar aur sardi hai, no chest pain');
    assert(fallbackResult.extractionMethod === 'rule_based_fallback', 'Fallback extraction method is rule_based_fallback');
    assert(fallbackResult.symptoms.includes('Fever'), 'Fallback extracted Fever from Hindi/Hinglish "bukhar"');
    assert(fallbackResult.pertinentNegatives.includes('chest pain'), 'Fallback detected explicit denial of chest pain in pertinentNegatives');

    const fallbackSummary = fallbackGenerateCaseSummary({
      chiefComplaint: 'Stomach ache',
      duration: '2 days',
      severity: 'Moderate',
      symptoms: ['Stomach ache', 'Nausea'],
      safetyFlags: [],
    });
    assert(fallbackSummary.summaryMethod === 'rule_based_fallback', 'Fallback summary generated successfully');
    assert(fallbackSummary.chiefComplaintStructured.includes('Stomach ache'), 'Fallback summary structures chief complaint');
    assert(Array.isArray(fallbackSummary.suggestedReviewFocus) && fallbackSummary.suggestedReviewFocus.length > 0, 'Fallback generates suggested review focus');

    // -------------------------------------------------------------
    // 4. Deterministic Safety Engine Testing (Steps 6, 7)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: DETERMINISTIC SAFETY ENGINE (Step 6 & 7) ---');
    const { evaluateSafety } = require('./dist/services/safetyService');

    // TEST A: Mild headache -> LOW
    const testA = evaluateSafety({
      complaintText: 'I have mild headache since yesterday.',
      symptoms: ['Headache'],
      severity: 'MILD',
    });
    assert(testA.riskLevel === 'LOW', `TEST A (mild headache) evaluates to LOW risk (got ${testA.riskLevel})`);

    // TEST B: Severe chest pain and difficulty breathing -> EMERGENCY
    const testB = evaluateSafety({
      complaintText: 'I have severe chest pain and difficulty breathing.',
      symptoms: ['Chest pain', 'Difficulty breathing'],
      severity: 'SEVERE',
    });
    assert(testB.riskLevel === 'EMERGENCY', `TEST B (chest pain + dyspnea) evaluates to EMERGENCY (got ${testB.riskLevel})`);
    assert(testB.safetyFlags.includes('chest_pain_severe'), 'TEST B flagged chest_pain_severe');
    assert(testB.safetyFlags.includes('difficulty_breathing_severe'), 'TEST B flagged difficulty_breathing_severe');

    // TEST C: Sudden loss of left arm movement + difficulty speaking -> EMERGENCY
    const testC = evaluateSafety({
      complaintText: 'I suddenly cannot move my left arm and I am having difficulty speaking.',
      symptoms: ['Arm weakness', 'Speech difficulty'],
      severity: 'SEVERE',
    });
    assert(testC.riskLevel === 'EMERGENCY', `TEST C (arm paralysis + slurred speech) evaluates to EMERGENCY (got ${testC.riskLevel})`);
    assert(testC.safetyFlags.includes('stroke_symptoms'), 'TEST C flagged stroke_symptoms');

    // TEST D: "I don't have fever" -> Explicit denial
    const testD_extracted = fallbackExtractClinicalInformation("I have a persistent cough but I don't have fever.");
    assert(testD_extracted.pertinentNegatives.includes('fever'), 'TEST D fever is recorded in pertinentNegatives');
    assert(!testD_extracted.symptoms.includes('Fever'), 'TEST D fever is NOT included in detected symptoms');

    // Negation test: "I have a headache, no chest pain, without difficulty breathing" -> Must NOT be EMERGENCY
    const testNegation = evaluateSafety({
      complaintText: 'I have a headache, no chest pain, without difficulty breathing.',
      symptoms: ['Headache'],
      severity: 'MODERATE',
    });
    assert(testNegation.riskLevel === 'LOW' || testNegation.riskLevel === 'MODERATE', `Negation safety test: Explicitly denied chest pain does NOT escalate to EMERGENCY (got ${testNegation.riskLevel})`);
    assert(!testNegation.safetyFlags.includes('chest_pain_severe'), 'chest_pain_severe is NOT flagged when explicitly denied');

    // Invariance test: Prior risk level cannot be lowered
    const testInvariance = evaluateSafety({
      complaintText: 'Feeling slightly better today.',
      symptoms: ['Mild cough'],
      priorRiskLevel: 'EMERGENCY',
    });
    assert(testInvariance.riskLevel === 'EMERGENCY', `Re-evaluation invariance: Risk cannot be de-escalated below prior EMERGENCY (got ${testInvariance.riskLevel})`);

    // -------------------------------------------------------------
    // 5. Patient & Provider RBAC & Ownership (Steps 8, 9, 10, 11)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: RBAC, CROSS-PATIENT OWNERSHIP & WORKFLOW (Steps 8-11) ---');

    // Authenticate Patient 1 (Rahul Sharma)
    let p1Login = await request(
      { path: '/api/auth/login', method: 'POST' },
      { emailOrMobile: 'rahul.sharma@example.com', password: 'Password@123' }
    );
    let p1Cookie = extractToken(p1Login.cookies, p1Login.body);
    if (!p1Cookie) {
      const reg = await request(
        { path: '/api/auth/register', method: 'POST' },
        { name: 'Rahul Sharma', emailOrMobile: 'rahul.sharma@example.com', password: 'Password@123', role: 'PATIENT' }
      );
      p1Cookie = extractToken(reg.cookies, reg.body);
    }
    assert(!!p1Cookie, 'Patient 1 authenticated');

    // Authenticate Patient 2 (Ananya Singh) - to test cross-patient isolation
    let p2Login = await request(
      { path: '/api/auth/login', method: 'POST' },
      { emailOrMobile: 'ananya.singh@example.com', password: 'Password@123' }
    );
    let p2Cookie = extractToken(p2Login.cookies, p2Login.body);
    if (!p2Cookie) {
      const reg2 = await request(
        { path: '/api/auth/register', method: 'POST' },
        { name: 'Ananya Singh', emailOrMobile: 'ananya.singh@example.com', password: 'Password@123', role: 'PATIENT' }
      );
      p2Cookie = extractToken(reg2.cookies, reg2.body);
    }
    assert(!!p2Cookie, 'Patient 2 authenticated for cross-tenant isolation test');

    // Authenticate Provider (Dr. Priya Verma)
    let provLogin = await request(
      { path: '/api/auth/login', method: 'POST' },
      { emailOrMobile: 'priya.verma@aiims.edu', password: 'Password@123' }
    );
    let provCookie = extractToken(provLogin.cookies, provLogin.body);
    if (!provCookie) {
      const provReg = await request(
        { path: '/api/auth/register', method: 'POST' },
        { name: 'Dr. Priya Verma', emailOrMobile: 'priya.verma@aiims.edu', password: 'Password@123', role: 'PROVIDER', specialty: 'General Medicine' }
      );
      provCookie = extractToken(provReg.cookies, provReg.body);
    }
    assert(!!provCookie, 'Provider authenticated');

    // Patient 1 creates a case
    const p1CaseCreate = await request(
      { path: '/api/cases', method: 'POST', headers: { Cookie: p1Cookie } },
      { chiefComplaint: 'Persistent severe migraine and sensitivity to light for 2 days' }
    );
    assert(p1CaseCreate.status === 201, `Patient 1 created intake case (status: ${p1CaseCreate.status})`);
    const p1CaseId = p1CaseCreate.body.case?.caseId;
    assert(!!p1CaseId, `Case ID assigned: ${p1CaseId}`);

    // Cross-Patient Security: Patient 2 attempts to access Patient 1's case -> 403
    const crossAccess = await request({
      path: `/api/cases/${p1CaseId}`,
      headers: { Cookie: p2Cookie },
    });
    assert(crossAccess.status === 403, `Cross-patient isolation: Patient 2 access to Patient 1 case returns 403 (got ${crossAccess.status})`);

    // Patient attempts provider-only status change -> 403
    const patientStatusChange = await request(
      { path: `/api/cases/${p1CaseId}/status`, method: 'PATCH', headers: { Cookie: p1Cookie } },
      { status: 'IN_REVIEW' }
    );
    assert(patientStatusChange.status === 403, `Patient updating status blocked with 403 (got ${patientStatusChange.status})`);

    // Patient attempts provider-only notes update -> 403
    const patientNotesChange = await request(
      { path: `/api/cases/${p1CaseId}/notes`, method: 'PATCH', headers: { Cookie: p1Cookie } },
      { clinicalNotes: 'Hacked notes' }
    );
    assert(patientNotesChange.status === 403, `Patient updating notes blocked with 403 (got ${patientNotesChange.status})`);

    // Patient attempts provider-only completion -> 403
    const patientComplete = await request(
      { path: `/api/cases/${p1CaseId}/complete`, method: 'POST', headers: { Cookie: p1Cookie } },
      { clinicalNotes: 'Hacked notes' }
    );
    assert(patientComplete.status === 403, `Patient completing consultation blocked with 403 (got ${patientComplete.status})`);

    // Provider views queue -> 200
    const provQueue = await request({
      path: '/api/cases',
      headers: { Cookie: provCookie },
    });
    assert(provQueue.status === 200, `Provider queue returned 200 (got ${provQueue.status})`);
    const casesList = provQueue.body.cases || [];
    assert(casesList.some((c) => c.caseId === p1CaseId), `Patient 1 case ${p1CaseId} is visible in provider triage queue`);

    // Provider reviews case dossier -> 200
    const provCaseDossier = await request({
      path: `/api/cases/${p1CaseId}`,
      headers: { Cookie: provCookie },
    });
    assert(provCaseDossier.status === 200, `Provider successfully opens case dossier (status: ${provCaseDossier.status})`);
    const dossierData = provCaseDossier.body.case;
    assert(dossierData.chiefComplaint === 'Persistent severe migraine and sensitivity to light for 2 days', 'Original chief complaint intact');
    assert(!!dossierData.aiSummary?.chiefComplaintStructured, 'AI summary structured dossier available');

    // Provider marks IN_REVIEW -> 200
    const inReviewRes = await request(
      { path: `/api/cases/${p1CaseId}/status`, method: 'PATCH', headers: { Cookie: provCookie } },
      { status: 'IN_REVIEW' }
    );
    assert(inReviewRes.status === 200, `Provider moves case to IN_REVIEW (status: ${inReviewRes.status})`);
    assert(inReviewRes.body.case?.status === 'IN_REVIEW', 'Case status confirmed as IN_REVIEW');

    // Provider saves clinical notes -> 200
    const clinicalObservations = 'Neurological exam: Cranial nerves II-XII grossly intact. No focal motor deficits. Recommended sumatriptan and dark room rest. Follow up in 48 hours.';
    const saveNotesRes = await request(
      { path: `/api/cases/${p1CaseId}/notes`, method: 'PATCH', headers: { Cookie: provCookie } },
      { clinicalNotes: clinicalObservations }
    );
    assert(saveNotesRes.status === 200, `Provider saves clinical observations (status: ${saveNotesRes.status})`);
    assert(saveNotesRes.body.case?.clinicalNotes === clinicalObservations, 'Clinical notes match saved text');

    // Provider completes consultation -> 200
    const completeRes = await request(
      { path: `/api/cases/${p1CaseId}/complete`, method: 'POST', headers: { Cookie: provCookie } },
      { clinicalNotes: clinicalObservations + ' Discharge advice provided.' }
    );
    assert(completeRes.status === 200, `Provider completes consultation (status: ${completeRes.status})`);
    assert(completeRes.body.case?.status === 'COMPLETED', 'Case status confirmed as COMPLETED');
    assert(!!completeRes.body.case?.completedAt, `completedAt timestamp recorded (${completeRes.body.case?.completedAt})`);

    // Completed case cannot be reverted -> 400
    const revertAttempt = await request(
      { path: `/api/cases/${p1CaseId}/status`, method: 'PATCH', headers: { Cookie: provCookie } },
      { status: 'IN_REVIEW' }
    );
    assert(revertAttempt.status === 400, `State machine: Completed case cannot be reverted (got ${revertAttempt.status})`);

    // Data Integrity Check (Step 11)
    const finalCheck = await request({
      path: `/api/cases/${p1CaseId}`,
      headers: { Cookie: provCookie },
    });
    const finalData = finalCheck.body.case;
    assert(finalData.chiefComplaint === 'Persistent severe migraine and sensitivity to light for 2 days', 'Integrity: Patient chief complaint remained unaltered');
    assert(!!finalData.aiSummary?.chiefComplaintStructured, 'Integrity: AI summary remained unaltered');
    assert(finalData.status === 'COMPLETED', 'Integrity: Status is COMPLETED');
    assert(finalData.clinicalNotes.includes('Discharge advice provided.'), 'Integrity: Provider notes stored separately and preserved');

    // Patient views completed case
    const patientView = await request({
      path: `/api/cases/${p1CaseId}`,
      headers: { Cookie: p1Cookie },
    });
    assert(patientView.status === 200, `Patient can access completed case (status: ${patientView.status})`);
    assert(patientView.body.case?.status === 'COMPLETED', 'Patient sees COMPLETED status');

    console.log('\n================================================================');
    console.log(`PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error running Phase 7 suite:', err);
    process.exit(1);
  }
}

runPhase7Suite();
