import mongoose from 'mongoose';

export interface IComplaint {
  _id: string;
  trackingId: string;
  name: string;
  email: string;
  department: string;
  category: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  dateFiled: Date;
  reply?: string;
  adminReply?: string;
  updatedAt: Date;
}

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
  department: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  },
  dateFiled: {
    type: Date,
    default: Date.now,
  },
  reply: {
    type: String,
  },
  adminReply: {
    type: String,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', complaintSchema);



