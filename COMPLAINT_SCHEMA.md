# Complaint Schema Documentation

This document provides the complete data model for the GRS (Grievance Redressal System) complaint schema that can be used by chatbots and other integrations.

## Core Complaint Interface

```typescript
interface IComplaint {
  _id: string;                    // MongoDB ObjectId
  trackingId: string;             // Unique tracking identifier (e.g., "GRS-2024-001234")
  name: string;                   // Complainant's full name
  email: string;                  // Complainant's email address
  phone?: string;                 // Optional phone number
  department: string;             // Target department for the complaint
  category: string;               // Main complaint category
  subCategory?: string;           // Optional sub-category
  description: string;            // Detailed complaint description
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dateFiled: Date;                // When complaint was submitted
  reply?: string;                 // User's reply to admin response
  adminReply?: string;            // Official admin response
  updatedAt: Date;                // Last modification timestamp
}
```

## NLP Analysis Fields

```typescript
// AI-powered analysis of complaint content
sentiment?: 'positive' | 'negative' | 'neutral';
keywords?: string[];              // Extracted keywords
urgency?: number;                 // 1-10 scale urgency rating
complexity?: number;              // 1-10 scale complexity rating
```

## Media Attachments

```typescript
images?: string[];                // URLs to image files
documents?: string[];             // URLs to document files
audioFiles?: string[];            // URLs to audio files
```

## Analytics & Metrics

```typescript
viewCount?: number;               // Number of times viewed
responseTime?: number;            // Response time in hours
satisfaction?: number;            // User satisfaction rating (1-5)
```

## Assignment & Routing

```typescript
assignedTo?: string;              // Admin user ID
assignedToName?: string;          // Admin user name
estimatedResolution?: Date;       // Expected resolution date
tags?: string[];                  // Custom tags for categorization
```

## Escalation Management

```typescript
escalationLevel?: number;         // Current escalation level (0-5)
escalationReason?: string;        // Reason for escalation
escalatedAt?: Date;               // When escalated
```

## Tracking & History

```typescript
statusHistory?: StatusUpdate[];   // Complete status change history
comments?: Comment[];             // User and admin comments
attachments?: Attachment[];       // File attachments with metadata
```

### StatusUpdate Interface

```typescript
interface StatusUpdate {
  status: string;                 // Status at time of update
  updatedAt: Date;                // When status changed
  updatedBy?: string;             // Who made the change
  notes?: string;                 // Additional notes
}
```

### Comment Interface

```typescript
interface Comment {
  _id?: string;                   // Comment ID
  text: string;                   // Comment content
  author: string;                 // Author name
  authorType: 'user' | 'admin' | 'system';
  createdAt: Date;                // When comment was made
  isInternal?: boolean;           // Internal admin notes (hidden from users)
}
```

### Attachment Interface

```typescript
interface Attachment {
  _id?: string;                   // Attachment ID
  filename: string;               // Stored filename
  originalName: string;           // Original filename
  url: string;                    // File URL
  fileType: string;               // MIME type
  fileSize: number;               // File size in bytes
  uploadedAt: Date;               // Upload timestamp
  uploadedBy: string;             // Who uploaded the file
}
```

## Location Information

```typescript
location?: {
  address?: string;               // Full address
  coordinates?: {
    lat: number;                  // Latitude
    lng: number;                  // Longitude
  };
  city?: string;                  // City name
  state?: string;                 // State/Province
  pincode?: string;               // Postal code
};
```

## Resolution Details

```typescript
resolution?: {
  description: string;            // How the complaint was resolved
  resolvedBy: string;             // Who resolved it
  resolvedAt: Date;               // When it was resolved
  resolutionType: 'Fixed' | 'Partial' | 'Not Applicable' | 'Duplicate';
};
```

## Follow-up Management

```typescript
followUpRequired?: boolean;       // Whether follow-up is needed
followUpDate?: Date;              // When to follow up
followUpNotes?: string;           // Follow-up instructions
```

## API Endpoints

### User Endpoints

- `GET /api/user/complaints` - Get user's complaints with filtering
- `POST /api/user/complaints` - Create new complaint
- `GET /api/complaints/track?trackingId=XXX` - Track specific complaint

### Admin Endpoints

- `GET /api/complaints` - Get all complaints with filtering
- `GET /api/complaints/[id]` - Get specific complaint
- `PUT /api/complaints/[id]` - Full update of complaint
- `PATCH /api/complaints/[id]` - Partial update of complaint
- `DELETE /api/complaints/[id]` - Soft delete (close) complaint

### Comments & Attachments

- `POST /api/complaints/[id]/comments` - Add comment
- `GET /api/complaints/[id]/comments` - Get comments
- `POST /api/complaints/[id]/attachments` - Add attachment
- `GET /api/complaints/[id]/attachments` - Get attachments

## Query Parameters

### Filtering
- `status` - Filter by status
- `department` - Filter by department
- `category` - Filter by category
- `priority` - Filter by priority
- `email` - Filter by user email
- `search` - General text search

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

## Example API Responses

### Create Complaint Response
```json
{
  "success": true,
  "trackingId": "GRS-2024-001234",
  "message": "Complaint submitted successfully",
  "complaint": { /* full complaint object */ },
  "nlpAnalysis": {
    "sentiment": "negative",
    "priority": "High",
    "urgency": 8,
    "complexity": 6,
    "suggestedDepartment": "Infrastructure",
    "keywords": ["power", "outage", "emergency"],
    "tags": ["urgent", "infrastructure"]
  }
}
```

### Get Complaints Response
```json
{
  "success": true,
  "complaints": [ /* array of complaint objects */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

## Status Workflow

1. **Pending** - Newly submitted complaint
2. **In Progress** - Being actively worked on
3. **Resolved** - Issue has been fixed
4. **Escalated** - Moved to higher authority
5. **Closed** - Complaint closed (resolved or archived)
6. **Rejected** - Complaint rejected as invalid

## Priority Levels

- **Critical** - Emergency situations requiring immediate attention
- **High** - Important issues that need prompt resolution
- **Medium** - Standard complaints with normal processing time
- **Low** - Minor issues that can be addressed in due course

## Department Categories

- Infrastructure
- Service
- Administrative
- Technical
- Other

## Integration Notes for Chatbots

1. **Complaint Creation**: Use the user complaints API with all required fields
2. **Status Tracking**: Use the tracking API with tracking ID
3. **NLP Analysis**: The system automatically analyzes complaint text for sentiment, priority, and categorization
4. **File Uploads**: Handle media files through the upload service before creating complaints
5. **Real-time Updates**: Status changes trigger email notifications automatically
6. **Search**: Use the search parameter for finding complaints by content
7. **Filtering**: Combine multiple filters for precise complaint retrieval

## Security Considerations

- Internal comments are filtered out from user-facing APIs
- Email-based access control for user-specific data
- Admin authentication required for administrative operations
- File uploads are validated and stored securely

