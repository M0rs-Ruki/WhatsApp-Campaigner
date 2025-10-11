import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf'
}

export enum MobileNumberEntryType {
  MANUAL = 'manual',
  UPLOAD = 'upload'
}

export interface IPhoneButton {
  text: string;
  number: string;
}

export interface ILinkButton {
  text: string;
  url: string;
}

export interface IMedia {
  type: MediaType;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ICampaign extends Document {
  campaignName: string;
  message: string;
  phoneButton?: IPhoneButton;
  linkButton?: ILinkButton;
  media?: IMedia;
  createdBy: mongoose.Types.ObjectId;
  mobileNumberEntryType: MobileNumberEntryType;
  mobileNumbers: string[];
  countryCode: string;
  numberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------- Sub-Schemas -------------------- */

// 📞 Phone Button Subschema
const PhoneButtonSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    number: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) =>
          /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(v),
        message: 'Please provide a valid phone number'
      }
    }
  },
  { _id: false }
);

// 🔗 Link Button Subschema
const LinkButtonSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) =>
          /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/.test(v),
        message: 'Please provide a valid URL'
      }
    }
  },
  { _id: false }
);

// 🖼 Media Subschema
const MediaSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(MediaType),
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      max: [5242880, 'File size cannot exceed 5MB']
    },
    mimeType: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => {
          const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'application/pdf'
          ];
          return allowedTypes.includes(v);
        },
        message: 'Invalid file type. Only images, videos, and PDFs are allowed'
      }
    }
  },
  { _id: false }
);

/* -------------------- Main Schema -------------------- */

const campaignSchema = new Schema<ICampaign>(
  {
    campaignName: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters long'],
      maxlength: [100, 'Campaign name cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    phoneButton: {
      type: PhoneButtonSchema,
    },
    linkButton: {
      type: LinkButtonSchema,
    },
    media: {
      type: MediaSchema,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    mobileNumberEntryType: {
      type: String,
      enum: Object.values(MobileNumberEntryType),
      required: [true, 'Mobile number entry type is required'],
      default: MobileNumberEntryType.MANUAL
    },
    mobileNumbers: {
      type: [String],
      required: [true, 'At least one mobile number is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one mobile number is required'
      }
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true,
      validate: {
        validator: (v: string) => /^\+\d{1,4}$/.test(v),
        message: 'Please provide a valid country code (e.g., +91)'
      }
    },
    numberCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/* -------------------- Middleware -------------------- */

campaignSchema.pre('save', function (next) {
  if (Array.isArray(this.mobileNumbers)) {
    this.numberCount = this.mobileNumbers.length;
  }
  next();
});

/* -------------------- Model -------------------- */

const Campaign: Model<ICampaign> = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
