import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface IPatientProfile extends Document {
  userId: Types.ObjectId;
  age: number;
  gender: Gender;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContact?: string;
  abhaPlaceholder?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
      index: true,
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age must be positive'],
      max: [130, 'Age exceeds standard range'],
    },
    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER'],
        message: 'Gender must be MALE, FEMALE, or OTHER',
      },
      required: [true, 'Gender is required'],
    },
    height: {
      type: Number,
      min: [20, 'Height must be reasonable (cm)'],
      max: [300, 'Height exceeds valid range'],
      default: undefined,
    },
    weight: {
      type: Number,
      min: [1, 'Weight must be reasonable (kg)'],
      max: [500, 'Weight exceeds valid range'],
      default: undefined,
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: undefined,
    },
    preferredLanguage: {
      type: String,
      trim: true,
      default: 'English',
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: undefined,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: undefined,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: undefined,
    },
    abhaPlaceholder: {
      type: String,
      trim: true,
      default: undefined,
      description: 'ABHA ID placeholder - future integration',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PatientProfile: Model<IPatientProfile> =
  mongoose.models.PatientProfile ||
  mongoose.model<IPatientProfile>('PatientProfile', patientProfileSchema);

export default PatientProfile;
