import api from './api';

export interface ComplaintCreate {
  title: string;
  description: string;
  transcript?: string;
  language?: string;
  translated_text?: string;
  category?: string;
  subcategory?: string;
  department_code: string;
  source?: string;
  complaint_metadata?: Record<string, any>;
}

export interface ComplaintResponse {
  success: boolean;
  message: string;
  complaint: {
    id: number;
    tracking_id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
  };
  nlpAnalysis: {
    category: string;
    suggestedDepartment: string;
    priority: string;
    confidence: number;
  };
}

export const complaintService = {
  async createComplaint(complaintData: ComplaintCreate): Promise<ComplaintResponse> {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  async getComplaints(params?: {
    status?: string;
    department?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/complaints', { params });
    return response.data;
  }
};
