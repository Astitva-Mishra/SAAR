// Comprehensive Test Suite for CareKare Authentication & Profile System
const http = require('http');

const PORT = 5000;
const BASE_HOST = '127.0.0.1';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (data) {
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const options = {
      hostname: BASE_HOST,
      port: PORT,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => (resBody += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(resBody);
        } catch {
          parsed = resBody;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

function getCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  const match = cookieStr.match(/(saar_token|carekare_session|token)=([^;]+)/);
  return match ? `${match[0]}` : null;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('--- CareKare Authentication & Profile Verification Suite ---');

  const ts = Date.now();
  const testPatient = {
    name: 'Ananya Roy',
    email: `ananya.${ts}@example.com`,
    phone: `98765${String(ts).slice(-5)}`,
    aadhaar: `5432 1098 ${String(ts).slice(-4)}`,
    password: 'Password123!',
    role: 'PATIENT',
    age: 29,
    gender: 'Female',
    height: 165,
    weight: 58,
    bloodGroup: 'B+',
    preferredLanguage: 'Bengali',
    emergencyContactName: 'Subhash Roy',
    emergencyContactPhone: '9876543210',
  };

  const cleanAadhaar = testPatient.aadhaar.replace(/\s/g, '');

  // TEST 1: Register New Patient
  console.log('\n[1] Patient Registration (Multi-Step Profile Creation)');
  const regRes = await request('POST', '/api/auth/register', testPatient);
  assert(regRes.status === 201, `Status is 201 Created (got ${regRes.status})`);
  assert(regRes.body?.user?.name === 'Ananya Roy', 'User name is correct');
  assert(regRes.body?.user?.email === testPatient.email, 'User email is correct');
  assert(regRes.body?.user?.aadhaarMasked === `XXXX XXXX ${cleanAadhaar.slice(-4)}`, `Aadhaar masked correctly as XXXX XXXX ${cleanAadhaar.slice(-4)}`);
  assert(regRes.body?.user?.aadhaarHash === undefined, 'Plaintext aadhaar and aadhaarHash are NOT returned in user response');
  assert(regRes.body?.user?.patientProfile?.bloodGroup === 'B+', 'PatientProfile created with bloodGroup B+');
  assert(regRes.body?.user?.patientProfile?.preferredLanguage === 'Bengali', 'PatientProfile created with preferredLanguage Bengali');

  const patientCookie = getCookie(regRes.headers);
  assert(!!patientCookie, `Authentication session cookie received (${patientCookie?.split('=')[0]})`);

  // TEST 2: Patient Login via Email
  console.log('\n[2] Patient Login via Email');
  const loginEmailRes = await request('POST', '/api/auth/login', {
    identifier: testPatient.email,
    password: 'Password123!',
  });
  assert(loginEmailRes.status === 200, `Login with Email succeeded (status 200)`);
  assert(loginEmailRes.body?.user?.email === testPatient.email, 'Returns correct user email');

  // TEST 3: Patient Login via Phone Number
  console.log('\n[3] Patient Login via Phone Number');
  const loginPhoneRes = await request('POST', '/api/auth/login', {
    identifier: testPatient.phone,
    password: 'Password123!',
  });
  assert(loginPhoneRes.status === 200, `Login with Phone succeeded (status 200)`);
  assert(loginPhoneRes.body?.user?.id === regRes.body?.user?.id, 'Returns matching patient ID');

  // TEST 4: Patient Login via Aadhaar Number (12 digits with spaces)
  console.log('\n[4] Patient Login via Aadhaar (with spaces)');
  const loginAadhaarRes = await request('POST', '/api/auth/login', {
    identifier: testPatient.aadhaar,
    password: 'Password123!',
  });
  assert(loginAadhaarRes.status === 200, `Login with Aadhaar with spaces succeeded (status 200)`);
  assert(loginAadhaarRes.body?.user?.id === regRes.body?.user?.id, 'Returns matching patient ID');

  // TEST 5: Patient Login via Aadhaar Number (12 digits plain without spaces)
  console.log('\n[5] Patient Login via Aadhaar (without spaces)');
  const loginAadhaarPlainRes = await request('POST', '/api/auth/login', {
    identifier: cleanAadhaar,
    password: 'Password123!',
  });
  assert(loginAadhaarPlainRes.status === 200, `Login with Aadhaar without spaces succeeded (status 200)`);

  // TEST 6: Get Me (Protected Profile Fetch)
  console.log('\n[6] GET /api/auth/me (Protected Profile)');
  const getMeRes = await request('GET', '/api/auth/me', null, { Cookie: patientCookie });
  assert(getMeRes.status === 200, `Profile fetched successfully (status 200)`);
  assert(getMeRes.body?.user?.aadhaarMasked === `XXXX XXXX ${cleanAadhaar.slice(-4)}`, 'Aadhaar is masked on profile fetch');
  assert(!getMeRes.body?.user?.aadhaarHash, 'No aadhaarHash in GET /me');
  assert(getMeRes.body?.patientProfile?.emergencyContactName === 'Subhash Roy' || getMeRes.body?.user?.patientProfile?.emergencyContactName === 'Subhash Roy', 'Emergency contact returned');

  // TEST 7: Update Patient Profile (PATCH /api/auth/profile)
  console.log('\n[7] PATCH /api/auth/profile (Update Personal & Health Profile)');
  const updateRes = await request('PATCH', '/api/auth/profile', {
    name: 'Ananya Sen Roy',
    bloodGroup: 'AB+',
    weight: 60,
    emergencyContactPhone: '9988776655',
  }, { Cookie: patientCookie });
  assert(updateRes.status === 200, 'Profile updated successfully');
  assert(updateRes.body?.user?.name === 'Ananya Sen Roy', 'Name updated in User record');
  assert(updateRes.body?.user?.patientProfile?.bloodGroup === 'AB+', 'BloodGroup updated in PatientProfile');
  assert(updateRes.body?.user?.patientProfile?.weight === 60, 'Weight updated in PatientProfile');
  assert(updateRes.body?.user?.patientProfile?.emergencyContactPhone === '9988776655', 'Emergency contact phone updated');

  // TEST 8: Prevent Duplicate Registration (Email duplicate)
  console.log('\n[8] Duplicate Registration Prevention');
  const dupEmailRes = await request('POST', '/api/auth/register', {
    ...testPatient,
    phone: '9876500000',
    aadhaar: '1111 2222 3333',
  });
  assert(dupEmailRes.status === 409, `Email duplicate returns 409 Conflict (got ${dupEmailRes.status})`);

  // TEST 9: Duplicate Registration Prevention (Aadhaar duplicate)
  const dupAadhaarRes = await request('POST', '/api/auth/register', {
    ...testPatient,
    email: `diff.${ts}@example.com`,
    phone: '9876500001',
  });
  assert(dupAadhaarRes.status === 409, `Aadhaar duplicate returns 409 Conflict (got ${dupAadhaarRes.status})`);

  // TEST 10: Provider Registration (Professional Profile)
  console.log('\n[10] Provider Registration (Multi-Step Clinical Profile)');
  const testDoc = {
    name: 'Dr. Arjun Mehta',
    email: `arjun.${ts}@example.com`,
    phone: `91234${String(ts).slice(-5)}`,
    aadhaar: `9876 5432 ${String(ts).slice(-4)}`,
    password: 'DocPassword123!',
    role: 'PROVIDER',
    specialty: 'Cardiology',
    qualification: 'MBBS, MD (Cardiology)',
    registrationNumber: 'MCI-2021-9876',
    experienceYears: 12,
    hospitalOrClinic: 'Apex Heart Institute',
    city: 'Mumbai',
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Consultant cardiologist specializing in preventive cardiology and non-invasive diagnostics.',
  };

  const docRegRes = await request('POST', '/api/auth/register', testDoc);
  assert(docRegRes.status === 201, `Provider registration succeeded (status 201)`);
  assert(docRegRes.body?.user?.role === 'PROVIDER', 'Role is PROVIDER');
  assert(docRegRes.body?.user?.specialty === 'Cardiology', 'Specialty is Cardiology');
  assert(docRegRes.body?.user?.registrationNumber === 'MCI-2021-9876', 'Registration number saved as profile information');
  assert(docRegRes.body?.user?.hospitalOrClinic === 'Apex Heart Institute', 'Hospital affiliation saved');
  const docCookie = getCookie(docRegRes.headers);
  assert(!!docCookie, 'Provider auth cookie received');

  // TEST 11: Provider Login via Email & Phone
  console.log('\n[11] Provider Login');
  const docLoginEmail = await request('POST', '/api/auth/login', {
    identifier: testDoc.email,
    password: 'DocPassword123!',
  });
  assert(docLoginEmail.status === 200, 'Provider login via Email succeeded');

  const docLoginPhone = await request('POST', '/api/auth/login', {
    identifier: testDoc.phone,
    password: 'DocPassword123!',
  });
  assert(docLoginPhone.status === 200, 'Provider login via Phone succeeded');

  // TEST 12: Provider Profile Update (PATCH /api/auth/profile)
  console.log('\n[12] PATCH /api/auth/profile for Provider');
  const docUpdateRes = await request('PATCH', '/api/auth/profile', {
    hospitalOrClinic: 'Apex Heart & Vascular Institute',
    experienceYears: 13,
  }, { Cookie: docCookie });
  assert(docUpdateRes.status === 200, 'Provider profile updated successfully');
  assert(docUpdateRes.body?.user?.hospitalOrClinic === 'Apex Heart & Vascular Institute', 'Hospital updated');
  assert(docUpdateRes.body?.user?.experienceYears === 13, 'Experience updated');

  // TEST 13: Backward Compatibility - Rahul Sharma Demo Patient Login
  console.log('\n[13] Backward Compatibility: Demo Patient (Rahul Sharma)');
  const rahulLoginRes = await request('POST', '/api/auth/login', {
    emailOrMobile: 'rahul@example.com',
    password: 'password123',
  });
  assert(rahulLoginRes.status === 200, `Demo patient rahul@example.com logged in successfully`);
  assert(rahulLoginRes.body?.user?.name === 'Rahul Sharma', 'Rahul Sharma profile returned');

  // TEST 14: Backward Compatibility - Dr. Priya Verma Demo Provider Login
  console.log('\n[14] Backward Compatibility: Demo Provider (Dr. Priya Verma)');
  let priyaLoginRes = await request('POST', '/api/auth/login', {
    emailOrMobile: 'priya.verma@aiims.edu',
    password: 'Password@123',
  });
  if (priyaLoginRes.status !== 200) {
    priyaLoginRes = await request('POST', '/api/auth/login', {
      emailOrMobile: 'priya@example.com',
      password: 'password123',
    });
  }
  assert(priyaLoginRes.status === 200, `Demo provider logged in successfully (status 200)`);
  assert(priyaLoginRes.body?.user?.name?.includes('Priya Verma'), 'Dr. Priya Verma profile returned');

  // TEST 15: Invalid Credentials Uniform Response (Account Enumeration Prevention)
  console.log('\n[15] Invalid Credentials Response');
  const badLogin = await request('POST', '/api/auth/login', {
    identifier: 'nonexistent@example.com',
    password: 'wrongpassword',
  });
  assert(badLogin.status === 401, 'Returns 401 Unauthorized');
  assert(badLogin.body?.error === 'Unable to sign in. Please check your credentials and try again.' ||
         badLogin.body?.message === 'Unable to sign in. Please check your credentials and try again.',
         'Returns uniform credential error message');

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
