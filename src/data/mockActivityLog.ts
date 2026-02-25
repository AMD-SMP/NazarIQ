import type { ActivityLog } from '@/types'

export const mockActivityLog: ActivityLog[] = [
  { id: 'LOG-001', adminName: 'Priya Sharma', action: 'STATUS_CHANGE', incidentId: 'HZD-2024-0001', oldValue: 'ALERTED', newValue: 'IN_PROGRESS', timestamp: '2024-01-20T07:45:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-002', adminName: 'Arjun Reddy', action: 'ALERT_SENT', incidentId: 'HZD-2024-0002', oldValue: '', newValue: 'CRITICAL_ALERT', timestamp: '2024-01-20T04:50:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-003', adminName: 'Priya Sharma', action: 'NOTE_ADDED', incidentId: 'HZD-2024-0003', oldValue: '', newValue: 'Structural assessment scheduled', timestamp: '2024-01-20T08:10:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-004', adminName: 'Meera Iyer', action: 'ESCALATED', incidentId: 'HZD-2024-0005', oldValue: 'HIGH', newValue: 'CRITICAL', timestamp: '2024-01-19T18:20:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-005', adminName: 'Arjun Reddy', action: 'STATUS_CHANGE', incidentId: 'HZD-2024-0006', oldValue: 'ALERTED', newValue: 'IN_PROGRESS', timestamp: '2024-01-20T08:00:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-006', adminName: 'Priya Sharma', action: 'RESOLVED', incidentId: 'HZD-2024-0024', oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', timestamp: '2024-01-17T16:00:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-007', adminName: 'Meera Iyer', action: 'ALERT_SENT', incidentId: 'HZD-2024-0001', oldValue: '', newValue: 'EMERGENCY_ALERT', timestamp: '2024-01-20T06:25:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-008', adminName: 'Arjun Reddy', action: 'NOTE_ADDED', incidentId: 'HZD-2024-0009', oldValue: '', newValue: 'Portable pumps deployed', timestamp: '2024-01-20T06:00:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-009', adminName: 'Priya Sharma', action: 'STATUS_CHANGE', incidentId: 'HZD-2024-0014', oldValue: 'ALERTED', newValue: 'IN_PROGRESS', timestamp: '2024-01-20T07:30:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-010', adminName: 'Meera Iyer', action: 'RESOLVED', incidentId: 'HZD-2024-0025', oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', timestamp: '2024-01-15T10:00:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-011', adminName: 'Arjun Reddy', action: 'STATUS_CHANGE', incidentId: 'HZD-2024-0022', oldValue: 'ALERTED', newValue: 'IN_PROGRESS', timestamp: '2024-01-20T04:00:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-012', adminName: 'Priya Sharma', action: 'ALERT_SENT', incidentId: 'HZD-2024-0006', oldValue: '', newValue: 'TRAFFIC_ALERT', timestamp: '2024-01-20T07:40:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-013', adminName: 'Meera Iyer', action: 'NOTE_ADDED', incidentId: 'HZD-2024-0011', oldValue: '', newValue: 'Underground survey ordered', timestamp: '2024-01-19T12:00:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-014', adminName: 'Arjun Reddy', action: 'ESCALATED', incidentId: 'HZD-2024-0004', oldValue: 'HIGH', newValue: 'CRITICAL', timestamp: '2024-01-20T02:30:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-015', adminName: 'Priya Sharma', action: 'RESOLVED', incidentId: 'HZD-2024-0026', oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', timestamp: '2024-01-16T14:00:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-016', adminName: 'Meera Iyer', action: 'STATUS_CHANGE', incidentId: 'HZD-2024-0020', oldValue: 'ALERTED', newValue: 'IN_PROGRESS', timestamp: '2024-01-18T14:00:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-017', adminName: 'Arjun Reddy', action: 'RESOLVED', incidentId: 'HZD-2024-0027', oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', timestamp: '2024-01-14T18:00:00', ipAddress: '10.0.1.55' },
  { id: 'LOG-018', adminName: 'Priya Sharma', action: 'NOTE_ADDED', incidentId: 'HZD-2024-0018', oldValue: '', newValue: 'Temporary barriers placed', timestamp: '2024-01-19T10:00:00', ipAddress: '10.0.1.42' },
  { id: 'LOG-019', adminName: 'Meera Iyer', action: 'RESOLVED', incidentId: 'HZD-2024-0028', oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', timestamp: '2024-01-12T17:00:00', ipAddress: '10.0.1.61' },
  { id: 'LOG-020', adminName: 'Arjun Reddy', action: 'ALERT_SENT', incidentId: 'HZD-2024-0004', oldValue: '', newValue: 'SAFETY_ALERT', timestamp: '2024-01-20T02:35:00', ipAddress: '10.0.1.55' },
]
