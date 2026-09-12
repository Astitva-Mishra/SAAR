import { Request, Response, NextFunction, CookieOptions } from 'express';
import User, { UserRole, hashAadhaar } from '../models/User';
import PatientProfile, { Gender } from '../models/PatientProfile';
import { generateToken } from '../utils/jwt';
import { AUTH_COOKIE_NAME } from '../middleware/auth';
import config from '../config/environment';

/**
 * Cookie options tailored for both local development (localhost) and production
 */
function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}

/**
 * Helper to build sanitized user JSON response
 */
function sanitizeUserResponse(user: any, patientProfile?: any) {
  const aadhaarMasked = user.aadhaarLast4 ? `XXXX XXXX ${user.aadhaarLast4}` : undefined;
  return {
    id: user._id,
    name: user.name,
    emailOrMobile: user.emailOrMobile,
    email: user.email || undefined,
    phone: user.phone || undefined,
    aadhaarMasked,
    role: user.role,
    specialty: user.specialty || null,
    qualification: user.qualification || undefined,
    registrationNumber: user.registrationNumber || undefined,
    experienceYears: user.experienceYears !== undefined ? user.experienceYears : undefined,
    hospitalOrClinic: user.hospitalOrClinic || undefined,
    city: user.city || undefined,
    languages: user.languages || undefined,
    bio: user.bio || undefined,
    patientProfile: patientProfile
      ? {
          age: patientProfile.age,
          gender: patientProfile.gender,
          height: patientProfile.height,
          weight: patientProfile.weight,
          bloodGroup: patientProfile.bloodGroup,
          preferredLanguage: patientProfile.preferredLanguage,
          emergencyContactName: patientProfile.emergencyContactName,
          emergencyContactPhone: patientProfile.emergencyContactPhone,
          emergencyContact: patientProfile.emergencyContact,
          abhaPlaceholder: patientProfile.abhaPlaceholder,
        }
      : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Register a new User (PATIENT or PROVIDER)
 * POST /api/auth/register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      emailOrMobile,
      email,
      phone,
      aadhaar,
      password,
      role,
      specialty,
      // Provider profile details (collected as profile information only)
      qualification,
      registrationNumber,
      experienceYears,
      hospitalOrClinic,
      city,
      languages,
      bio,
      // Patient profile details
      age,
      gender,
      height,
      weight,
      bloodGroup,
      preferredLanguage,
      emergencyContactName,
      emergencyContactPhone,
      abhaPlaceholder,
    } = req.body;

    // 1. Core Field Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters.',
      });
      return;
    }

    // Determine normalized primary identifier
    const resolvedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;
    const resolvedPhone = typeof phone === 'string' && phone.trim() ? phone.trim().replace(/[\s-]/g, '') : undefined;
    const rawIdentifier = emailOrMobile || resolvedEmail || resolvedPhone;

    if (!rawIdentifier || typeof rawIdentifier !== 'string' || rawIdentifier.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'A contact identifier (email or phone number) is required.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.',
      });
      return;
    }

    const assignedRole: UserRole = role || 'PATIENT';
    if (!['PATIENT', 'PROVIDER'].includes(assignedRole)) {
      res.status(400).json({
        success: false,
        message: 'Role must be either PATIENT or PROVIDER.',
      });
      return;
    }

    if (assignedRole === 'PROVIDER' && (!specialty || typeof specialty !== 'string' || specialty.trim().length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Specialty is required for healthcare provider registration.',
      });
      return;
    }

    const normalizedIdentifier = rawIdentifier.trim().toLowerCase();

    // 2. Check for duplicate user on primary identifier
    const existingByIdentifier = await User.findOne({
      $or: [
        { emailOrMobile: normalizedIdentifier },
        ...(resolvedEmail ? [{ email: resolvedEmail }] : []),
        ...(resolvedPhone ? [{ phone: resolvedPhone }] : []),
      ],
    });

    if (existingByIdentifier) {
      res.status(409).json({
        success: false,
        message: 'An account with this email or phone number already exists.',
      });
      return;
    }

    // Process Aadhaar if supplied (never stored plaintext, hashed via SHA-256)
    let aadhaarHashVal: string | undefined;
    let aadhaarLast4Val: string | undefined;
    if (aadhaar && typeof aadhaar === 'string' && aadhaar.trim().length > 0) {
      const hashedAadhaar = hashAadhaar(aadhaar);
      if (!hashedAadhaar) {
        res.status(400).json({
          success: false,
          message: 'Aadhaar number must be exactly 12 digits.',
        });
        return;
      }
      aadhaarHashVal = hashedAadhaar.hash;
      aadhaarLast4Val = hashedAadhaar.last4;

      const existingByAadhaar = await User.findOne({ aadhaarHash: aadhaarHashVal });
      if (existingByAadhaar) {
        res.status(409).json({
          success: false,
          message: 'An account with this Aadhaar number already exists.',
        });
        return;
      }
    }

    // Parse languages array if provided
    let parsedLanguages: string[] | undefined;
    if (Array.isArray(languages)) {
      parsedLanguages = languages.map((l) => String(l).trim()).filter(Boolean);
    } else if (typeof languages === 'string' && languages.trim()) {
      parsedLanguages = languages.split(',').map((l) => l.trim()).filter(Boolean);
    }

    // 3. Create User record
    const user = new User({
      name: name.trim(),
      emailOrMobile: normalizedIdentifier,
      email: resolvedEmail,
      phone: resolvedPhone,
      aadhaarHash: aadhaarHashVal,
      aadhaarLast4: aadhaarLast4Val,
      passwordHash: password, // Mongoose pre-save hook hashes this with bcrypt
      role: assignedRole,
      specialty: assignedRole === 'PROVIDER' ? specialty?.trim() : undefined,
      qualification: assignedRole === 'PROVIDER' && qualification ? String(qualification).trim() : undefined,
      registrationNumber: assignedRole === 'PROVIDER' && registrationNumber ? String(registrationNumber).trim() : undefined,
      experienceYears: assignedRole === 'PROVIDER' && experienceYears !== undefined ? Number(experienceYears) : undefined,
      hospitalOrClinic: assignedRole === 'PROVIDER' && hospitalOrClinic ? String(hospitalOrClinic).trim() : undefined,
      city: assignedRole === 'PROVIDER' && city ? String(city).trim() : undefined,
      languages: assignedRole === 'PROVIDER' ? parsedLanguages : undefined,
      bio: assignedRole === 'PROVIDER' && bio ? String(bio).trim() : undefined,
    });

    await user.save();

    // 4. If PATIENT role, create corresponding PatientProfile
    let patientProfile = null;
    if (assignedRole === 'PATIENT') {
      const parsedAge = age !== undefined && !isNaN(Number(age)) ? Number(age) : 28;
      const validGenders: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
      const parsedGender: Gender = gender && validGenders.includes(String(gender).toUpperCase() as Gender)
        ? (String(gender).toUpperCase() as Gender)
        : 'OTHER';

      patientProfile = new PatientProfile({
        userId: user._id,
        age: parsedAge,
        gender: parsedGender,
        height: height !== undefined && !isNaN(Number(height)) ? Number(height) : undefined,
        weight: weight !== undefined && !isNaN(Number(weight)) ? Number(weight) : undefined,
        bloodGroup: bloodGroup ? String(bloodGroup).trim() : undefined,
        preferredLanguage: preferredLanguage ? String(preferredLanguage).trim() : 'English',
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : undefined,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : undefined,
        emergencyContact: emergencyContactPhone || emergencyContactName ? `${emergencyContactName || ''} ${emergencyContactPhone || ''}`.trim() : undefined,
        abhaPlaceholder: abhaPlaceholder ? String(abhaPlaceholder).trim() : undefined,
      });

      await patientProfile.save();
    }

    // 5. Generate JWT Token
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    // 6. Set HTTP-only Cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // 7. Return sanitized response
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: sanitizeUserResponse(user, patientProfile),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in with flexible identifier (Email, Phone, or Aadhaar) and password
 * POST /api/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { emailOrMobile, identifier, password } = req.body;
    const rawIdentifier = String(identifier || emailOrMobile || '').trim();

    if (!rawIdentifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both login identifier and password.',
      });
      return;
    }

    const cleaned = rawIdentifier.replace(/[\s-]/g, '');
    let user = null;

    // 1. Check if 12-digit numeric Aadhaar
    if (/^\d{12}$/.test(cleaned)) {
      const hashedAadhaar = hashAadhaar(cleaned);
      if (hashedAadhaar) {
        user = await User.findOne({ aadhaarHash: hashedAadhaar.hash }).select('+passwordHash');
      }
    }

    // 2. Check if Email format
    if (!user && rawIdentifier.includes('@')) {
      const normalizedEmail = rawIdentifier.toLowerCase();
      user = await User.findOne({
        $or: [{ email: normalizedEmail }, { emailOrMobile: normalizedEmail }],
      }).select('+passwordHash');
    }

    // 3. Check if Phone number
    if (!user) {
      const phoneDigits = cleaned.replace(/^\+91/, '');
      user = await User.findOne({
        $or: [
          { phone: phoneDigits },
          { phone: rawIdentifier },
          { emailOrMobile: rawIdentifier.toLowerCase() },
          { emailOrMobile: phoneDigits },
        ],
      }).select('+passwordHash');
    }

    // 4. Fallback lookup by emailOrMobile
    if (!user) {
      user = await User.findOne({ emailOrMobile: rawIdentifier.toLowerCase() }).select('+passwordHash');
    }

    // If account not found or password does not match
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unable to sign in. Please check your credentials and try again.',
        error: 'Unable to sign in. Please check your credentials and try again.',
      });
      return;
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Unable to sign in. Please check your credentials and try again.',
        error: 'Unable to sign in. Please check your credentials and try again.',
      });
      return;
    }

    // Fetch PatientProfile if role is PATIENT
    let patientProfile = null;
    if (user.role === 'PATIENT') {
      patientProfile = await PatientProfile.findOne({ userId: user._id });
    }

    // Generate JWT
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    // Set HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // Return sanitized profile
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: sanitizeUserResponse(user, patientProfile),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    let patientProfile = null;
    if (req.user.role === 'PATIENT') {
      patientProfile = await PatientProfile.findOne({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      user: sanitizeUserResponse(req.user, patientProfile),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update authenticated user profile
 * PATCH /api/auth/profile
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const user = req.user;
    const updates = req.body;

    // Normal users cannot change their system role or ID
    delete updates.role;
    delete updates._id;
    delete updates.id;
    delete updates.passwordHash;
    delete updates.aadhaarHash;

    if (updates.name && typeof updates.name === 'string' && updates.name.trim().length >= 2) {
      user.name = updates.name.trim();
    }
    if (updates.phone && typeof updates.phone === 'string') {
      user.phone = updates.phone.trim();
    }
    if (updates.email && typeof updates.email === 'string') {
      user.email = updates.email.trim().toLowerCase();
    }

    // Provider fields
    if (user.role === 'PROVIDER') {
      if (updates.specialty) user.specialty = String(updates.specialty).trim();
      if (updates.qualification) user.qualification = String(updates.qualification).trim();
      if (updates.registrationNumber) user.registrationNumber = String(updates.registrationNumber).trim();
      if (updates.experienceYears !== undefined && !isNaN(Number(updates.experienceYears))) {
        user.experienceYears = Number(updates.experienceYears);
      }
      if (updates.hospitalOrClinic) user.hospitalOrClinic = String(updates.hospitalOrClinic).trim();
      if (updates.city) user.city = String(updates.city).trim();
      if (Array.isArray(updates.languages)) {
        user.languages = updates.languages.map((l: any) => String(l).trim()).filter(Boolean);
      }
      if (updates.bio !== undefined) user.bio = String(updates.bio).trim();
    }

    await user.save();

    // Patient profile updates
    let patientProfile = null;
    if (user.role === 'PATIENT') {
      patientProfile = await PatientProfile.findOne({ userId: user._id });
      if (!patientProfile) {
        patientProfile = new PatientProfile({
          userId: user._id,
          age: updates.age || 25,
          gender: updates.gender || 'OTHER',
        });
      }

      if (updates.age !== undefined && !isNaN(Number(updates.age))) patientProfile.age = Number(updates.age);
      if (updates.gender) patientProfile.gender = updates.gender;
      if (updates.height !== undefined) patientProfile.height = Number(updates.height);
      if (updates.weight !== undefined) patientProfile.weight = Number(updates.weight);
      if (updates.bloodGroup !== undefined) patientProfile.bloodGroup = String(updates.bloodGroup).trim();
      if (updates.preferredLanguage !== undefined) patientProfile.preferredLanguage = String(updates.preferredLanguage).trim();
      if (updates.emergencyContactName !== undefined) patientProfile.emergencyContactName = String(updates.emergencyContactName).trim();
      if (updates.emergencyContactPhone !== undefined) patientProfile.emergencyContactPhone = String(updates.emergencyContactPhone).trim();
      if (updates.abhaPlaceholder !== undefined) patientProfile.abhaPlaceholder = String(updates.abhaPlaceholder).trim();

      await patientProfile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUserResponse(user, patientProfile),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out and clear authentication cookie
 * POST /api/auth/logout
 */
export function logout(req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * RBAC verification test endpoint for PROVIDER role
 * GET /api/auth/provider-test
 */
export function providerTest(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Provider access granted',
    user: {
      id: req.user?._id,
      name: req.user?.name,
      role: req.user?.role,
      specialty: req.user?.specialty,
    },
  });
}

/**
 * RBAC verification test endpoint for PATIENT role
 * GET /api/auth/patient-test
 */
export function patientTest(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Patient access granted',
    user: {
      id: req.user?._id,
      name: req.user?.name,
      role: req.user?.role,
    },
  });
}
