export interface BehaviorIncident {
  id: string;
  user_id: string;
  student_name: string;
  incident_type: 'Disruptive' | 'Tardiness' | 'Defiance' | 'Aggression' | 'Insubordination' | 'Other';
  incident_date: string;
  incident_time?: string;
  location?: string;
  description?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action_taken?: string;
  staff_member?: string;
  follow_up_required: number;
  resolved: number;
  created_at: string;
  updated_at: string;
}

export interface CounselingSession {
  id: string;
  user_id: string;
  student_name: string;
  session_date: string;
  session_type: 'Individual' | 'Group' | 'Family' | 'Crisis';
  concern_category: 'Academic' | 'Behavioral' | 'Social' | 'Emotional' | 'Family' | 'Attendance';
  session_notes?: string;
  action_plan?: string;
  follow_up_date?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Referred';
  counselor_name?: string;
  parent_contacted: number;
  referral_made: number;
  created_at: string;
  updated_at: string;
}

export interface StudentIntervention {
  id: string;
  user_id: string;
  student_name: string;
  intervention_type: 'Academic Support' | 'Behavioral Plan' | 'Attendance Monitoring' | 'Counseling' | 'Family Engagement';
  start_date: string;
  end_date?: string;
  description?: string;
  goals?: string;
  progress_notes?: string;
  success_metrics?: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  assigned_staff?: string;
  parent_involvement: number;
  effectiveness_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentAlert {
  id: string;
  user_id: string;
  student_name: string;
  alert_type: 'Attendance Pattern' | 'Behavior Escalation' | 'Academic Decline' | 'Withdrawal Risk' | 'Family Issues';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  alert_message: string;
  trigger_data?: string;
  acknowledged: number;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: number;
  resolved_at?: string;
  created_at: string;
}

export interface HolisticStudentProfile {
  student_name: string;
  grade?: string;
  attendance_rate?: number;
  total_absences?: number;
  chronic_absence_risk?: boolean;
  behavior_incidents?: BehaviorIncident[];
  counseling_sessions?: CounselingSession[];
  interventions?: StudentIntervention[];
  alerts?: StudentAlert[];
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  last_updated: string;
}

export interface DashboardMetrics {
  total_students: number;
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  students_at_risk: number;
  positive_trends: number;
  behavior_incidents_this_week: number;
  counseling_sessions_this_week: number;
  active_interventions: number;
}

export interface ActionCenterModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  role: 'Administrator' | 'Teacher' | 'Counselor' | 'Everyone';
}