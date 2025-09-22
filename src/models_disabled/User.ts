import { query } from '@/lib/postgres';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  department_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
  department_id?: string;
}

export class UserModel {
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const result = await query(
        `INSERT INTO users (name, email, phone, password, role, department_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          userData.name,
          userData.email,
          userData.phone || null,
          hashedPassword,
          userData.role || 'citizen',
          userData.department_id || null
        ]
      );
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  // Update user
  static async update(id: number, updates: Partial<CreateUserData>): Promise<User | null> {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic UPDATE query
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          if (key === 'password') {
            // Hash password if being updated
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(value as string, saltRounds);
            setClause.push(`${key} = $${paramCount}`);
            values.push(hashedPassword);
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
        `UPDATE users SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? result.rows[0] as User : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get all users (for admin)
  static async findAll(limit = 100, offset = 0): Promise<User[]> {
    try {
      const result = await query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return result.rows as User[];
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }
}

export default UserModel;
