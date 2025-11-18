# Tracking Components

This directory contains reusable components for the complaint tracking UI.

## Components

### StatusTimeline
Visual timeline showing the progress of a complaint through different status stages.

**Props:**
- `currentStatus: string` - Current status of the complaint
- `statusHistory?: TimelineItem[]` - Array of status changes with dates
- `estimatedResolution?: string` - Estimated resolution date

**Usage:**
```tsx
import { StatusTimeline } from '@/components/tracking';

<StatusTimeline
  currentStatus="in_progress"
  statusHistory={[
    { status: 'new', date: '2024-01-15', updatedBy: 'System' },
    { status: 'triaged', date: '2024-01-16', updatedBy: 'Admin' },
    { status: 'in_progress', date: '2024-01-18', updatedBy: 'Officer', notes: 'Work started' }
  ]}
  estimatedResolution="2024-01-25"
/>
```

### ActivityFeed
Displays a chronological feed of all activities related to a complaint.

**Props:**
- `activities: ActivityItem[]` - Array of activity items
- `maxItems?: number` - Maximum number of items to display (default: 10)

**Usage:**
```tsx
import { ActivityFeed } from '@/components/tracking';

<ActivityFeed
  activities={[
    {
      id: '1',
      type: 'status_change',
      title: 'Status updated to "In Progress"',
      timestamp: '2024-01-18T10:00:00Z',
      actor: 'John Doe',
      actorType: 'department',
      metadata: { oldStatus: 'Pending', newStatus: 'In Progress' }
    },
    {
      id: '2',
      type: 'comment',
      title: 'New comment added',
      description: 'Site inspection scheduled for tomorrow',
      timestamp: '2024-01-17T14:30:00Z',
      actor: 'Department Officer',
      actorType: 'department'
    }
  ]}
  maxItems={5}
/>
```

## Integration Example

Here's how to integrate these components into your tracking page:

```tsx
'use client';

import { StatusTimeline, ActivityFeed } from '@/components/tracking';

export default function EnhancedTrackPage({ complaint }) {
  // Transform complaint data into activity feed format
  const activities = [
    ...(complaint.statusHistory?.map((status, index) => ({
      id: `status-${index}`,
      type: 'status_change' as const,
      title: `Status updated to "${status.status}"`,
      timestamp: status.updatedAt,
      actor: status.updatedBy,
      actorType: 'department' as const,
      metadata: {
        oldStatus: index > 0 ? complaint.statusHistory[index - 1].status : 'New',
        newStatus: status.status
      }
    })) || []),
    ...(complaint.comments?.map(comment => ({
      id: comment._id,
      type: 'comment' as const,
      title: 'New comment added',
      description: comment.text,
      timestamp: comment.createdAt,
      actor: comment.author,
      actorType: comment.authorType === 'admin' ? 'admin' : 'user' as const
    })) || [])
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <StatusTimeline
        currentStatus={complaint.status}
        statusHistory={complaint.statusHistory}
        estimatedResolution={complaint.estimatedResolution}
      />

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />
    </div>
  );
}
```

## Styling

These components use Tailwind CSS and support dark mode. Make sure your `tailwind.config.js` includes the necessary color configurations.

## Future Enhancements

- [ ] Add animations for status transitions
- [ ] Support for custom status flows
- [ ] Real-time updates via WebSocket
- [ ] Export activity feed as PDF
- [ ] Filter activities by type
- [ ] Search within activities





