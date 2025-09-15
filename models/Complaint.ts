import mongoose from 'mongoose';

export interface IComplaint {
  _id: string;
  trackingId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  category: string;
  subCategory?: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dateFiled: Date;
  reply?: string;
  adminReply?: string;
  updatedAt: Date;
  
  // NLP Analysis
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  urgency?: number; // 1-10 scale
  complexity?: number; // 1-10 scale
  
  // Media
  images?: string[];
  documents?: string[];
  audioFiles?: string[];
  
  // Analytics
  viewCount?: number;
  responseTime?: number; // in hours
  satisfaction?: number; // 1-5 scale
  
  // Routing
  assignedTo?: string;
  assignedToName?: string;
  estimatedResolution?: Date;
  tags?: string[];
  
  // Escalation
  escalationLevel?: number;
  escalationReason?: string;
  escalatedAt?: Date;
  
  // Tracking & History
  statusHistory?: StatusUpdate[];
  comments?: Comment[];
  attachments?: Attachment[];
  
  // Location (for location-based complaints)
  location?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    city?: string;
    state?: string;
    pincode?: string;
  };
  
  // Resolution
  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedAt: Date;
    resolutionType: 'Fixed' | 'Partial' | 'Not Applicable' | 'Duplicate';
  };
  
  // Follow-up
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

export interface StatusUpdate {
  status: string;
  updatedAt: Date;
  updatedBy?: string;
  notes?: string;
}

export interface Comment {
  _id?: string;
  text: string;
  author: string;
  authorType: 'user' | 'admin' | 'system';
  createdAt: Date;
  isInternal?: boolean; // For internal admin notes
}

export interface Attachment {
  _id?: string;
  filename: string;
  originalName: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

const statusUpdateSchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String,
  notes: String,
}, { _id: false });

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  authorType: { type: String, enum: ['user', 'admin', 'system'], required: true },
  createdAt: { type: Date, default: Date.now },
  isInternal: { type: Boolean, default: false },
}, { _id: true });

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, required: true },
}, { _id: true });

const locationSchema = new mongoose.Schema({
  address: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  city: String,
  state: String,
  pincode: String,
}, { _id: false });

const resolutionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  resolvedBy: { type: String, required: true },
  resolvedAt: { type: Date, required: true },
  resolutionType: { 
    type: String, 
    enum: ['Fixed', 'Partial', 'Not Applicable', 'Duplicate'],
    required: true 
  },
}, { _id: false });

const complaintSchema = new mongoose.Schema<IComplaint>({
  trackingId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: String,
  department: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: String,
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed', 'Rejected'],
    default: 'Pending',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  dateFiled: {
    type: Date,
    default: Date.now,
  },
  reply: String,
  adminReply: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // NLP Analysis
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
  },
  keywords: [String],
  urgency: {
    type: Number,
    min: 1,
    max: 10,
  },
  complexity: {
    type: Number,
    min: 1,
    max: 10,
  },
  
  // Media
  images: [String],
  documents: [String],
  audioFiles: [String],
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  responseTime: Number,
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
  },
  
  // Routing
  assignedTo: String,
  assignedToName: String,
  estimatedResolution: Date,
  tags: [String],
  
  // Escalation
  escalationLevel: {
    type: Number,
    default: 0,
  },
  escalationReason: String,
  escalatedAt: Date,
  
  // Tracking & History
  statusHistory: [statusUpdateSchema],
  comments: [commentSchema],
  attachments: [attachmentSchema],
  
  // Location
  location: locationSchema,
  
  // Resolution
  resolution: resolutionSchema,
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  followUpNotes: String,
});

// Update the updatedAt field before saving
complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Add status to history if status changed
  if (this.isModified('status') && !this.isNew) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    // Add current status to history
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
      updatedBy: this.assignedTo || 'system',
      notes: this.isModified('escalationReason') ? this.escalationReason : undefined
    });
  }
  
  next();
});

export default mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', complaintSchema);



