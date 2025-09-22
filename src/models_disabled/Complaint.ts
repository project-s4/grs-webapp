import { query } from '@/lib/postgres';

export interface Complaint {
  id: number;
  user_id: number;
  department_id?: number;
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  tracking_id: string;
  location?: string;
  phone?: string;
  email?: string;
  attachments?: string; // JSON string of file paths
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  notes?: string;
}

export interface CreateComplaintData {
  user_id: number;
  department_id?: number;
  title: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  phone?: string;
  email?: string;
  attachments?: string[];
}

export class ComplaintModel {
  // Create new complaint
  static async create(complaintData: CreateComplaintData): Promise<Complaint> {
    try {
      const tracking_id = this.generateTrackingId();
      
      const result = await query(
        `INSERT INTO complaints (
          user_id, department_id, title, description, category, priority, 
          tracking_id, location, phone, email, attachments, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING *`,
        [
          complaintData.user_id,
          complaintData.department_id || null,
          complaintData.title,
          complaintData.description,
          complaintData.category || null,
          complaintData.priority || 'medium',
          tracking_id,
          complaintData.location || null,
          complaintData.phone || null,
          complaintData.email || null,
          complaintData.attachments ? JSON.stringify(complaintData.attachments) : null,
          'pending'
        ]
      );
      
      return result.rows[0] as Complaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  // Find complaint by ID
  static async findById(id: number): Promise<Complaint | null> {
    try {
      const result = await query('SELECT * FROM complaints WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] as Complaint : null;
    } catch (error) {
      console.error('Error finding complaint by ID:', error);
      throw error;
    }
  }

  // Find complaint by tracking ID
  static async findByTrackingId(tracking_id: string): Promise<Complaint | null> {
    try {
      const result = await query(
        'SELECT * FROM complaints WHERE tracking_id = $1', 
        [tracking_id]
      );
      return result.rows.length > 0 ? result.rows[0] as Complaint : null;
    } catch (error) {
      console.error('Error finding complaint by tracking ID:', error);
      throw error;
    }
  }

  // Get complaints by user ID
  static async findByUserId(user_id: number, limit = 50, offset = 0): Promise<Complaint[]> {
    try {
      const result = await query(
        'SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [user_id, limit, offset]
      );
      return result.rows as Complaint[];
    } catch (error) {
      console.error('Error finding complaints by user ID:', error);
      throw error;
    }
  }

  // Get complaints by department ID
  static async findByDepartmentId(department_id: number, limit = 50, offset = 0): Promise<Complaint[]> {
    try {
      const result = await query(
        'SELECT * FROM complaints WHERE department_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [department_id, limit, offset]
      );
      return result.rows as Complaint[];
    } catch (error) {
      console.error('Error finding complaints by department ID:', error);
      throw error;
    }
  }

  // Get all complaints (admin view)
  static async findAll(limit = 50, offset = 0): Promise<Complaint[]> {
    try {
      const result = await query(
        'SELECT * FROM complaints ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows as Complaint[];
    } catch (error) {
      console.error('Error finding all complaints:', error);
      throw error;
    }
  }

  // Update complaint
  static async update(id: number, updates: Partial<CreateComplaintData & { status: string; notes: string }>): Promise<Complaint | null> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic UPDATE query
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          if (key === 'attachments' && Array.isArray(value)) {
            setClause.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      }

      if (setClause.length === 0) {
        return null;
      }

      values.push(id); // Add ID as last parameter

      const result = await query(
        `UPDATE complaints SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? result.rows[0] as Complaint : null;
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }

  // Delete complaint
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM complaints WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  }

  // Generate tracking ID
  static generateTrackingId(): string {
    const prefix = 'GRS';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp.slice(-6)}${random}`;
  }

  // Get complaints with user and department info
  static async findWithDetails(limit = 50, offset = 0): Promise<any[]> {
    try {
      const result = await query(
        `SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email,
          d.name as department_name,
          d.code as department_code
         FROM complaints c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN departments d ON c.department_id = d.id
         ORDER BY c.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding complaints with details:', error);
      throw error;
    }
  }
}

export default ComplaintModel;
