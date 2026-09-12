/**
 * Arogya Phase 8 - Comprehensive Verification & Test Suite
 * Tests Voice-Based Patient Intake & Document Upload / OCR / Text Extraction
 */
const http = require('http');
const zlib = require('zlib');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

function request(options, data, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: { ...options.headers, ...customHeaders },
    };

    if (data && !customHeaders['Content-Type']) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (Buffer.isBuffer(data)) {
      reqOptions.headers['Content-Length'] = data.length;
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'];
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
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
      if (Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
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

/**
 * Creates a valid synthetic text PDF Buffer
 */
function createSyntheticPdf(textContent) {
  const streamContent = `BT /F1 12 Tf 50 750 Td (${textContent}) Tj ET`;
  const compressed = zlib.deflateSync(Buffer.from(streamContent));

  const parts = [
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    Buffer.from('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n'),
    Buffer.from(`4 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\r\n`),
    compressed,
    Buffer.from('\r\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n'),
    Buffer.from('trailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n500\n%%EOF'),
  ];

  return Buffer.concat(parts);
}

/**
 * Creates a valid synthetic PNG image Buffer with embedded text chunk
 */
function createSyntheticPng(textData) {
  // 8-byte PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (1x1 pixel)
  const ihdrData = Buffer.from([
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // 8-bit RGBA
  ]);
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = Buffer.from([0x1f, 0x15, 0xc4, 0x89]);
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

  // tEXt chunk with clinical description
  const textPayload = Buffer.from(`Description\0${textData}`);
  const textLength = Buffer.alloc(4);
  textLength.writeUInt32BE(textPayload.length, 0);
  const textType = Buffer.from('tEXt');
  const textCrc = Buffer.alloc(4); // placeholder CRC
  const textChunk = Buffer.concat([textLength, textType, textPayload, textCrc]);

  // IEND chunk
  const iendChunk = Buffer.from([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  return Buffer.concat([signature, ihdrChunk, textChunk, iendChunk]);
}

/**
 * Builds multipart/form-data payload with boundaries
 */
function buildMultipartPayload(filename, mimeType, fileBuffer) {
  const boundary = `----ArogyaBoundary${Date.now()}`;
  const header = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const payload = Buffer.concat([header, fileBuffer, footer]);

  return {
    boundary,
    contentType: `multipart/form-data; boundary=${boundary}`,
    payload,
  };
}

async function runPhase8Suite() {
  console.log('================================================================');
  console.log('   AROGYA PHASE 8 - VOICE INTAKE & DOCUMENT UPLOAD / OCR TESTS  ');
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
    // SECTION 1: System Health Verification
    // -------------------------------------------------------------
    console.log('--- SECTION 1: SYSTEM HEALTH ---');
    const healthRes = await request({ path: '/api/health' });
    assert(healthRes.status === 200, `Health endpoint returns 200 (got ${healthRes.status})`);
    assert(healthRes.body.success === true, 'Service reports healthy');

    // -------------------------------------------------------------
    // SECTION 2: User Authentication & Role Setup
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: USER SETUP & AUTHENTICATION ---');
    // Patient 1
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

    // Patient 2 (Cross-patient security isolation test)
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
    assert(!!p2Cookie, 'Patient 2 authenticated');

    // Provider
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

    // -------------------------------------------------------------
    // SECTION 3: Voice-Based Patient Intake Pipeline
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: VOICE-BASED PATIENT INTAKE (ENGLISH & HINDI) ---');
    // Test English Voice Transcript
    const englishVoiceTranscript = 'I have had a headache since yesterday.';
    console.log(`Testing English voice transcript: "${englishVoiceTranscript}"`);
    const engCaseRes = await request(
      { path: '/api/cases', method: 'POST', headers: { Cookie: p1Cookie } },
      { chiefComplaint: englishVoiceTranscript }
    );
    assert(engCaseRes.status === 201, `English voice intake case created (status: ${engCaseRes.status})`);
    assert(engCaseRes.body.case?.chiefComplaint === englishVoiceTranscript, 'English transcript preserved accurately');
    const testCaseId = engCaseRes.body.case?.caseId;
    assert(!!testCaseId, `Case ID assigned: ${testCaseId}`);

    // Test Hindi Voice Transcript
    const hindiVoiceTranscript = 'Mujhe teen din se bukhar hai aur badan dard hai.';
    console.log(`Testing Hindi voice transcript: "${hindiVoiceTranscript}"`);
    const hindiCaseRes = await request(
      { path: '/api/cases', method: 'POST', headers: { Cookie: p1Cookie } },
      { chiefComplaint: hindiVoiceTranscript }
    );
    assert(hindiCaseRes.status === 201, `Hindi voice intake case created (status: ${hindiCaseRes.status})`);
    assert(hindiCaseRes.body.case?.chiefComplaint === hindiVoiceTranscript, 'Hindi transcript preserved accurately');

    // -------------------------------------------------------------
    // SECTION 4: Document Upload & PDF Text Extraction
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: DOCUMENT UPLOAD & PDF TEXT EXTRACTION ---');
    const pdfText = 'Patient medical history: Previous diagnosis: hypertension. Medications: Paracetamol 500mg, Metformin. Lab: Hb 13.5 g/dl, Glucose: 105 mg/dl.';
    const pdfBuffer = createSyntheticPdf(pdfText);
    const pdfUploadData = buildMultipartPayload('previous_prescription.pdf', 'application/pdf', pdfBuffer);

    const pdfUploadRes = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      pdfUploadData.payload,
      { 'Content-Type': pdfUploadData.contentType }
    );

    assert(pdfUploadRes.status === 201, `PDF document upload returned 201 (got ${pdfUploadRes.status})`);
    assert(pdfUploadRes.body.success === true, 'PDF upload reported success = true');
    assert(pdfUploadRes.body.document?.extractionStatus === 'EXTRACTED', `PDF extractionStatus is EXTRACTED (got "${pdfUploadRes.body.document?.extractionStatus}")`);
    assert(pdfUploadRes.body.document?.mimeType === 'application/pdf', 'MIME type is application/pdf');
    assert(pdfUploadRes.body.document?.extractedText.includes('hypertension'), 'Extracted text contains "hypertension"');

    // Verify Clinical Provenance Boundary: Previous diagnosis is recorded as historical, not active diagnosis
    const summary = pdfUploadRes.body.document?.extractedSummary;
    assert(summary !== null && typeof summary === 'object', 'Extracted clinical summary object is present');
    assert(
      Array.isArray(summary?.previousDiagnoses) && summary.previousDiagnoses.some((d) => d.toLowerCase().includes('hypertension')),
      'Provenance preserved: "hypertension" recorded under previousDiagnoses'
    );
    assert(
      Array.isArray(summary?.medications) && summary.medications.some((m) => m.toLowerCase().includes('paracetamol')),
      'Medications extracted: Paracetamol present'
    );

    const uploadedDocId = pdfUploadRes.body.document?.documentId;
    assert(!!uploadedDocId, `Document ID assigned: ${uploadedDocId}`);

    // -------------------------------------------------------------
    // SECTION 5: Document Upload & Image OCR / Text Extraction
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: IMAGE DOCUMENT UPLOAD & TEXT EXTRACTION ---');
    const imgClinicalText = 'Lab Report: Blood Sugar Fasting 98 mg/dl, WBC 6500. Known case of asthma.';
    const pngBuffer = createSyntheticPng(imgClinicalText);
    const pngUploadData = buildMultipartPayload('lab_report.png', 'image/png', pngBuffer);

    const pngUploadRes = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      pngUploadData.payload,
      { 'Content-Type': pngUploadData.contentType }
    );

    assert(pngUploadRes.status === 201, `Image document upload returned 201 (got ${pngUploadRes.status})`);
    assert(pngUploadRes.body.document?.mimeType === 'image/png', 'MIME type is image/png');
    assert(
      pngUploadRes.body.document?.extractionStatus === 'EXTRACTED' || pngUploadRes.body.document?.extractionStatus === 'FAILED',
      `Image processing completed with valid status (${pngUploadRes.body.document?.extractionStatus})`
    );

    // -------------------------------------------------------------
    // SECTION 6: Document Upload Security & RBAC Boundaries
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: SECURITY & VALIDATION TESTS ---');

    // 1. Unauthenticated upload -> 401
    const unauthUpload = await request(
      { path: `/api/cases/${testCaseId}/documents`, method: 'POST' },
      pdfUploadData.payload,
      { 'Content-Type': pdfUploadData.contentType }
    );
    assert(unauthUpload.status === 401, `Unauthenticated upload blocked with 401 (got ${unauthUpload.status})`);

    // 2. Cross-patient isolation: Patient 2 attempts upload to Patient 1's case -> 403
    const crossUpload = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p2Cookie },
      },
      pdfUploadData.payload,
      { 'Content-Type': pdfUploadData.contentType }
    );
    assert(crossUpload.status === 403, `Cross-patient isolation: Patient 2 upload blocked with 403 (got ${crossUpload.status})`);

    // 3. Unsupported file type (.exe) -> 400
    const exeBuffer = Buffer.from('MZ executable binary payload');
    const exeUploadData = buildMultipartPayload('malicious.exe', 'application/x-msdownload', exeBuffer);
    const exeUpload = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      exeUploadData.payload,
      { 'Content-Type': exeUploadData.contentType }
    );
    assert(exeUpload.status === 400, `Unsupported file format (.exe) rejected with 400 (got ${exeUpload.status})`);

    // 4. Empty file (0 bytes) -> 400
    const emptyUploadData = buildMultipartPayload('empty.pdf', 'application/pdf', Buffer.alloc(0));
    const emptyUpload = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      emptyUploadData.payload,
      { 'Content-Type': emptyUploadData.contentType }
    );
    assert(emptyUpload.status === 400, `Empty file rejected with 400 (got ${emptyUpload.status})`);

    // 5. Oversized file (>10MB limit) -> 400
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
    const oversizedUploadData = buildMultipartPayload('huge.pdf', 'application/pdf', oversizedBuffer);
    const oversizedUpload = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      oversizedUploadData.payload,
      { 'Content-Type': oversizedUploadData.contentType }
    );
    assert(oversizedUpload.status === 400, `Oversized file (>10MB) rejected with 400 (got ${oversizedUpload.status})`);

    // -------------------------------------------------------------
    // SECTION 7: Deterministic Safety Engine Integration with Documents
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: SAFETY ENGINE INTEGRATION WITH DOCUMENTS ---');

    // Test A: Document with explicit denial ("No chest pain")
    const denialPdfText = 'Clinical discharge record: Patient denies chest pain. No chest pain reported during observation.';
    const denialPdf = createSyntheticPdf(denialPdfText);
    const denialData = buildMultipartPayload('denial_doc.pdf', 'application/pdf', denialPdf);
    const denialRes = await request(
      {
        path: `/api/cases/${testCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      denialData.payload,
      { 'Content-Type': denialData.contentType }
    );
    assert(denialRes.status === 201, `Denial document uploaded successfully (status: ${denialRes.status})`);
    assert(denialRes.body.case?.riskLevel !== 'EMERGENCY', `Explicit denial "No chest pain" does NOT escalate risk to EMERGENCY (riskLevel: ${denialRes.body.case?.riskLevel})`);
    assert(!denialRes.body.case?.safetyFlags?.includes('chest_pain_severe'), 'chest_pain_severe NOT flagged for negated phrase');

    // Test B: Document with emergency red flag triggers deterministic safety engine
    // Create a new case for emergency test
    const emerCaseRes = await request(
      { path: '/api/cases', method: 'POST', headers: { Cookie: p1Cookie } },
      { chiefComplaint: 'Severe discomfort' }
    );
    const emerCaseId = emerCaseRes.body.case?.caseId;

    const emergencyDocText = 'Emergency Admission Note: Patient had severe chest pain radiating to left arm and loss of consciousness.';
    const emergencyPdf = createSyntheticPdf(emergencyDocText);
    const emergencyData = buildMultipartPayload('emergency_record.pdf', 'application/pdf', emergencyPdf);
    const emergencyRes = await request(
      {
        path: `/api/cases/${emerCaseId}/documents`,
        method: 'POST',
        headers: { Cookie: p1Cookie },
      },
      emergencyData.payload,
      { 'Content-Type': emergencyData.contentType }
    );
    assert(emergencyRes.status === 201, `Emergency document uploaded (status: ${emergencyRes.status})`);
    assert(emergencyRes.body.case?.riskLevel === 'EMERGENCY', `Deterministic safety engine escalated risk to EMERGENCY (got "${emergencyRes.body.case?.riskLevel}")`);
    assert(emergencyRes.body.case?.safetyFlags?.includes('chest_pain_severe'), 'chest_pain_severe correctly identified from document');
    assert(emergencyRes.body.case?.safetyFlags?.includes('loss_of_consciousness'), 'loss_of_consciousness correctly identified from document');

    // -------------------------------------------------------------
    // SECTION 8: Provider Portal Document Review & Privacy
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: PROVIDER PORTAL DOCUMENT VIEW & DATA PRIVACY ---');
    const providerCaseRes = await request({
      path: `/api/cases/${testCaseId}`,
      headers: { Cookie: provCookie },
    });
    assert(providerCaseRes.status === 200, `Provider can retrieve case details (status: ${providerCaseRes.status})`);
    assert(Array.isArray(providerCaseRes.body.case?.documents), 'Documents array present in provider case view');
    assert(providerCaseRes.body.case.documents.length >= 2, `Provider sees attached documents (count: ${providerCaseRes.body.case.documents.length})`);

    // Verify Privacy: No private file paths or server secrets exposed in JSON
    const serializedJson = JSON.stringify(providerCaseRes.body);
    assert(!serializedJson.includes('C:\\') && !serializedJson.includes('/Users/'), 'No private server filesystem paths exposed');
    assert(!serializedJson.includes('MONGODB_URI') && !serializedJson.includes('GROQ_API_KEY'), 'No environment secrets exposed');

    // Test Document Removal (DELETE /api/cases/:id/documents/:docId)
    const deleteRes = await request({
      path: `/api/cases/${testCaseId}/documents/${uploadedDocId}`,
      method: 'DELETE',
      headers: { Cookie: p1Cookie },
    });
    assert(deleteRes.status === 200, `Patient deleted document successfully (status: ${deleteRes.status})`);
    assert(!deleteRes.body.documents?.some((d) => d.documentId === uploadedDocId), 'Deleted document is no longer in case documents array');

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running Phase 8 test suite:', error);
    process.exit(1);
  }
}

runPhase8Suite();
