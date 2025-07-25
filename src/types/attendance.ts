export interface AttendanceRecord {
  id: string
  attendanceDate: string
  dayOfWeek: string
  grade: string
  person: string
  category: string
  status: string
  excused: string
  lateArrivalTime?: string
  earlyDismissalTime?: string
  notes?: string
  slrDetails?: string
  userId: string
  createdAt: string
}

export interface StudentMetrics {
  student: string
  grade: string
  totalAbsences: number
  totalDismissals: number
  excusedAbsences: number
  unexcusedAbsences: number
  consecutiveAbsences: number
  maxConsecutiveAbsences: number
  absenceRate: string
  lateArrivals: {
    total: number
    unexcused: number
  }
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  interventionNeeded?: boolean
}

export interface Settings {
  id?: string
  userId: string
  schoolYear: string
  chronicAbsenceRate: number
  highRiskRate: number
  interventionRate: number
  consecutiveDays: number
  unexcusedCount: number
  lateArrivalInterventionCount: number
  lateArrivalIsUnexcused: string
  holidayProximityDays: number
  createdAt?: string
  updatedAt?: string
}

export interface AnalyticsData {
  totalRecords: number
  totalAbsences: number
  totalEarlyDismissals: number
  totalLateArrivals: number
  totalUnexcusedLateArrivals: number
  attendanceRate: number
  chronicAbsenteeism: Record<string, any>
  interventionNeeded: StudentMetrics[]
  byGrade: Record<string, { absences: number; dismissals: number; students: number }>
  byMonth: Record<string, { absences: number; dismissals: number; students: number; schoolDays: number }>
  byDayOfWeek: Record<string, { absences: number; dismissals: number }>
  dateRange: { earliest: string | null; latest: string | null }
}

export interface Holiday {
  id?: string
  userId: string
  date: string
  eventName: string
  type: string
  community: string
  schoolYear: string
  createdAt?: string
}