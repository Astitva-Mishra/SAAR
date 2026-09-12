import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole = 'PATIENT' | 'PROVIDER';

const AADHAAR_SALT = process.env.AADHAAR_SALT || 'carekare_aadhaar_security_salt_2026';

/**
 * Normalizes 12-digit Aadhaar, computes SHA-256 hash for secure database lookup,
 * and extracts the last 4 digits for masked display (e.g. XXXX XXXX 1234).
 * The plaintext Aadhaar number is never persisted.
 */
export function hashAadhaar(rawAadhaar: string): { hash: string; last4: string } | null {
  const cleaned = String(rawAadhaar).replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return null;
  }
  const last4 = cleaned.slice(-4);
  const hash = crypto.createHash('sha256').update(`${cleaned}:${AADHAAR_SALT}`).digest('hex');
  return { hash, last4 };
}

export interface IUser extends Document {
  name: string;
  emailOrMobile: string;
  email?: string;
  phone?: string;
  aadhaarHash?: string;
  aadhaarLast4?: string;
  role: UserRole;
  specialty?: string;
  qualification?: string;
  registrationNumber?: string;
  experienceYears?: number;
  hospitalOrClinic?: string;
  city?: string;
  languages?: string[];
  bio?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    emailOrMobile: {
      type: String,
      required: [true, 'Email or Mobile number is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    aadhaarHash: {
      type: String,
      select: false,
      sparse: true,
      index: true,
    },
    aadhaarLast4: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['PATIENT', 'PROVIDER'],
        message: 'Role must be either PATIENT or PROVIDER',
      },
      required: [true, 'Role is required'],
      default: 'PATIENT',
    },
    specialty: {
      type: String,
      trim: true,
      default: undefined,
    },
    qualification: {
      type: String,
      trim: true,
      default: undefined,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: undefined,
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 80,
      default: undefined,
    },
    hospitalOrClinic: {
      type: String,
      trim: true,
      default: undefined,
    },
    city: {
      type: String,
      trim: true,
      default: undefined,
    },
    languages: {
      type: [String],
      default: undefined,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).aadhaarHash;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).aadhaarHash;
        return ret;
      },
    },
  }
);

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function () {
  const user = this as IUser;

  if (!user.isModified('passwordHash')) {
    return;
  }

  // If already hashed with bcrypt ($2a$ or $2b$), skip re-hashing
  if (user.passwordHash && (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'))) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

// Compare candidate password against stored passwordHash
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const user = this as IUser;
  if (!user.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

// Prevent re-compiling model in hot-reload environments
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
