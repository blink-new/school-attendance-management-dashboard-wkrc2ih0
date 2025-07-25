// ClarityEd Platform Types - Comprehensive Student Behavior Management

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  studentId: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'transferred';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastUpdated: string;
  userId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'tardy' | 'excused';
  arrivalTime?: string;
  notes?: string;
  userId: string;
}

export interface BehaviorIncident {
  id: string;
  studentId: string;
  date: string;
  time: string;
  type: 'minor' | 'major' | 'severe';
  category: 'disruption' | 'defiance' | 'aggression' | 'academic' | 'other';
  description: string;
  location: string;
  staffMember: string;
  actionTaken: string;
  parentContacted: boolean;
  followUpRequired: boolean;
  resolved: boolean;
  userId: string;
}

export interface StudentAlert {
  id: string;
  studentId: string;
  alertType: 'attendance_pattern' | 'behavior_escalation' | 'academic_decline' | 'chronic_absence' | 'tardiness_pattern';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendedActions: string[];
  assignedTo?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  userId: string;
}

export interface InterventionPlan {
  id: string;
  studentId: string;
  title: string;
  description: string;
  goals: string[];
  strategies: string[];
  assignedStaff: string[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  notes: string;
  parentInvolved: boolean;
  meetingScheduled?: string;
  userId: string;
}

export interface SchoolThresholds {
  id: string;
  schoolName: string;
  
  // Attendance Thresholds
  chronicAbsenceRate: number;        // Percentage (e.g., 10 = 10%)
  consecutiveAbsenceLimit: number;   // Days (e.g., 3)
  tardyLimit: number;               // Per month (e.g., 5)
  mondayFridayPatternDays: number;  // Days to trigger pattern (e.g., 3)
  
  // Behavior Thresholds
  minorIncidentLimit: number;       // Per week (e.g., 3)
  majorIncidentLimit: number;       // Per month (e.g., 2)
  severeIncidentLimit: number;      // Per semester (e.g., 1)
  behaviorEscalationDays: number;   // Days to check escalation (e.g., 30)
  
  // Academic Thresholds
  gradeDropThreshold: number;       // Percentage drop (e.g., 15)
  failingGradeLimit: number;        // Number of failing grades (e.g., 2)
  
  // Alert Settings
  autoAssignAlerts: boolean;
  alertRetentionDays: number;       // Days to keep resolved alerts (e.g., 90)
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  parentNotificationThreshold: 'medium' | 'high' | 'critical';
  
  userId: string;
  updatedAt: string;
}

export interface FridayReport {
  id: string;
  weekOf: string;
  generatedAt: string;
  
  // Summary Statistics
  totalStudents: number;
  newAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  highRiskStudents: number;
  
  // Weekly Changes
  attendanceRate: number;
  attendanceChange: number; // Percentage change from previous week
  behaviorIncidents: number;
  behaviorChange: number;
  
  // Flagged Students
  newlyFlaggedStudents: StudentAlert[];
  escalatedConcerns: StudentAlert[];
  improvedStudents: Student[];
  
  // Recommended Actions
  immediateActions: {
    studentId: string;
    studentName: string;
    action: string;
    priority: 'critical' | 'high' | 'medium';
    dueDate: string;
  }[];
  
  // Trends and Insights
  patterns: {
    type: string;
    description: string;
    affectedStudents: number;
    recommendation: string;
  }[];
  
  userId: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  activeAlerts: number;
  attendanceRate: number;
  behaviorIncidents: number;
  
  // Risk Distribution
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  // Trends (last 30 days)
  attendanceTrend: { date: string; rate: number }[];
  behaviorTrend: { date: string; incidents: number }[];
  alertTrend: { date: string; alerts: number }[];
  
  // Recent Activity
  recentAlerts: StudentAlert[];
  recentIncidents: BehaviorIncident[];
  upcomingActions: InterventionPlan[];
}

export interface PatternAnalysis {
  studentId: string;
  patterns: {
    type: 'attendance' | 'behavior' | 'academic';
    pattern: string;
    confidence: number; // 0-100
    description: string;
    recommendation: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }[];
  riskScore: number; // 0-100
  predictedOutcome: string;
  recommendedInterventions: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'principal' | 'vice_principal' | 'counselor' | 'dean' | 'coordinator';
  email: string;
  phone?: string;
  department?: string;
  active: boolean;
}

export interface ParentContact {
  id: string;
  studentId: string;
  contactType: 'phone' | 'email' | 'meeting' | 'letter';
  date: string;
  staffMember: string;
  purpose: string;
  outcome: string;
  followUpRequired: boolean;
  followUpDate?: string;
  userId: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface ThresholdFormData {
  chronicAbsenceRate: number;
  consecutiveAbsenceLimit: number;
  tardyLimit: number;
  mondayFridayPatternDays: number;
  minorIncidentLimit: number;
  majorIncidentLimit: number;
  severeIncidentLimit: number;
  behaviorEscalationDays: number;
  gradeDropThreshold: number;
  failingGradeLimit: number;
  autoAssignAlerts: boolean;
  alertRetentionDays: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  parentNotificationThreshold: 'medium' | 'high' | 'critical';
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  grade: number;
  studentId: string;
  enrollmentDate: string;
}

export interface BehaviorIncidentFormData {
  studentId: string;
  date: string;
  time: string;
  type: 'minor' | 'major' | 'severe';
  category: 'disruption' | 'defiance' | 'aggression' | 'academic' | 'other';
  description: string;
  location: string;
  staffMember: string;
  actionTaken: string;
  parentContacted: boolean;
  followUpRequired: boolean;
}

export interface AttendanceFormData {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'tardy' | 'excused';
  arrivalTime?: string;
  notes?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

// Navigation Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  badge?: number;
}