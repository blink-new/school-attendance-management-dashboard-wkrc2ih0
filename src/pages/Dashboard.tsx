import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { blink } from '@/blink/client'
import { AnalyticsData } from '@/types/attendance'

const processAttendanceData = (records: any[], settings: any): AnalyticsData => {
  const stats = {
    totalRecords: records.length,
    totalAbsences: 0,
    totalEarlyDismissals: 0,
    totalLateArrivals: 0,
    totalUnexcusedLateArrivals: 0,
    attendanceRate: 0,
    chronicAbsenteeism: {},
    interventionNeeded: [],
    byGrade: {} as Record<string, any>,
    byMonth: {} as Record<string, any>,
    byDayOfWeek: {
      Monday: { absences: 0, dismissals: 0 },
      Tuesday: { absences: 0, dismissals: 0 },
      Wednesday: { absences: 0, dismissals: 0 },
      Thursday: { absences: 0, dismissals: 0 },
      Friday: { absences: 0, dismissals: 0 }
    },
    dateRange: { earliest: null, latest: null }
  }

  const studentMetrics: Record<string, any> = {}

  records.forEach(record => {
    const category = record.category?.toLowerCase() || ''
    const grade = record.grade
    const person = record.person
    const date = new Date(record.attendanceDate)
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    // Initialize student metrics
    if (!studentMetrics[person]) {
      studentMetrics[person] = {
        student: person,
        grade,
        totalAbsences: 0,
        totalDismissals: 0,
        excusedAbsences: 0,
        unexcusedAbsences: 0,
        lateArrivals: { total: 0, unexcused: 0 },
        absenceRate: '0%'
      }
    }

    // Initialize grade metrics
    if (!stats.byGrade[grade]) {
      stats.byGrade[grade] = { absences: 0, dismissals: 0, students: 0 }
    }

    // Initialize month metrics
    if (!stats.byMonth[monthKey]) {
      stats.byMonth[monthKey] = { absences: 0, dismissals: 0, students: 0, schoolDays: 0 }
    }

    // Process absences
    if (category.includes('absence') || category.includes('absent')) {
      stats.totalAbsences++
      stats.byGrade[grade].absences++
      stats.byMonth[monthKey].absences++
      if (stats.byDayOfWeek[dayOfWeek as keyof typeof stats.byDayOfWeek]) {
        stats.byDayOfWeek[dayOfWeek as keyof typeof stats.byDayOfWeek].absences++
      }
      studentMetrics[person].totalAbsences++

      const status = record.status?.toLowerCase() || ''
      if (status.includes('unexcused')) {
        studentMetrics[person].unexcusedAbsences++
      } else if (status.includes('excused')) {
        studentMetrics[person].excusedAbsences++
      }
    }

    // Process early dismissals
    if (category.includes('early') || category.includes('dismissal')) {
      stats.totalEarlyDismissals++
      stats.byGrade[grade].dismissals++
      stats.byMonth[monthKey].dismissals++
      if (stats.byDayOfWeek[dayOfWeek as keyof typeof stats.byDayOfWeek]) {
        stats.byDayOfWeek[dayOfWeek as keyof typeof stats.byDayOfWeek].dismissals++
      }
      studentMetrics[person].totalDismissals++
    }

    // Process late arrivals
    if (record.lateArrivalTime) {
      stats.totalLateArrivals++
      studentMetrics[person].lateArrivals.total++
      
      if (record.status === settings.lateArrivalIsUnexcused) {
        stats.totalUnexcusedLateArrivals++
        studentMetrics[person].lateArrivals.unexcused++
      }
    }
  })

  // Calculate attendance rate and identify at-risk students
  const uniqueStudents = Object.keys(studentMetrics).length
  const schoolDays = Math.max(1, records.length / Math.max(1, uniqueStudents))
  stats.attendanceRate = uniqueStudents > 0 ? 
    Number(((schoolDays * uniqueStudents - stats.totalAbsences) / (schoolDays * uniqueStudents) * 100).toFixed(2)) : 100

  // Process student metrics for interventions
  Object.values(studentMetrics).forEach((student: any) => {
    const absenceRate = schoolDays > 0 ? (student.totalAbsences / schoolDays * 100) : 0
    student.absenceRate = `${absenceRate.toFixed(1)}%`

    // Check for chronic absenteeism
    if (absenceRate >= settings.chronicAbsenceRate) {
      stats.chronicAbsenteeism[student.student] = student
    }

    // Check for intervention needed
    const needsInterventionForAbsence = absenceRate >= settings.interventionRate || 
      student.unexcusedAbsences >= settings.unexcusedCount
    const needsInterventionForTardy = student.lateArrivals.unexcused >= settings.lateArrivalInterventionCount

    if (needsInterventionForAbsence || needsInterventionForTardy) {
      const reasons = []
      if (needsInterventionForAbsence) reasons.push('Absences')
      if (needsInterventionForTardy) reasons.push('Late Arrivals')
      
      student.riskLevel = absenceRate >= 20 ? 'HIGH' : 'MEDIUM'
      student.reason = reasons.join(' & ')
      student.interventionNeeded = true
      stats.interventionNeeded.push(student)
    }
  })

  return stats
}

export function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const loadAnalytics = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Get attendance records for the current user
      const records = await blink.db.attendanceRecords.list({
        where: { userId: user.id },
        orderBy: { attendanceDate: 'desc' },
        limit: 1000
      })

      // Get settings
      const settingsResult = await blink.db.settings.list({
        where: { userId: user.id },
        limit: 1
      })

      const settings = settingsResult[0] || {
        chronicAbsenceRate: 10,
        interventionRate: 15,
        consecutiveDays: 5,
        unexcusedCount: 10,
        lateArrivalInterventionCount: 8
      }

      // Process analytics
      const analyticsData = processAttendanceData(records, settings)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadAnalytics()
    }
  }, [user?.id, loadAnalytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground text-center mb-4">
          Import your attendance data to start analyzing trends and identifying at-risk students.
        </p>
        <Button>Import Data</Button>
      </div>
    )
  }

  const gradeData = Object.entries(analytics.byGrade).map(([grade, data]) => ({
    grade: `Grade ${grade}`,
    absences: data.absences,
    dismissals: data.dismissals
  }))

  const monthData = Object.entries(analytics.byMonth).map(([month, data]) => ({
    month: month.split(' ')[0],
    absences: data.absences,
    dismissals: data.dismissals
  }))

  const dayOfWeekData = Object.entries(analytics.byDayOfWeek).map(([day, data]) => ({
    day: day.slice(0, 3),
    absences: data.absences,
    dismissals: data.dismissals
  }))

  const riskLevelData = [
    { name: 'Low Risk', value: analytics.interventionNeeded.filter(s => s.riskLevel === 'LOW').length, color: '#267355' },
    { name: 'Medium Risk', value: analytics.interventionNeeded.filter(s => s.riskLevel === 'MEDIUM').length, color: '#D3AE6F' },
    { name: 'High Risk', value: analytics.interventionNeeded.filter(s => s.riskLevel === 'HIGH').length, color: '#C3411E' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#3D68B2]">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Comprehensive attendance analytics for your school
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Attendance entries processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#267355]">{analytics.attendanceRate}%</div>
            <Progress value={analytics.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C3411E]">{analytics.interventionNeeded.length}</div>
            <p className="text-xs text-muted-foreground">
              Need intervention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLateArrivals}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalUnexcusedLateArrivals} unexcused
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="grades">By Grade</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Absences and dismissals by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="absences" stroke="#3D68B2" strokeWidth={2} />
                    <Line type="monotone" dataKey="dismissals" stroke="#267355" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Day of Week Patterns</CardTitle>
                <CardDescription>Attendance patterns by weekday</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="absences" fill="#3D68B2" />
                    <Bar dataKey="dismissals" fill="#267355" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Level Analysis</CardTitle>
              <CardDescription>Attendance issues by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="absences" fill="#3D68B2" />
                  <Bar dataKey="dismissals" fill="#267355" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Level Distribution</CardTitle>
                <CardDescription>Students by intervention priority</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskLevelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chronic Absenteeism</CardTitle>
                <CardDescription>Students with high absence rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Chronic Absentees</span>
                    <Badge variant="destructive">
                      {Object.keys(analytics.chronicAbsenteeism).length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.values(analytics.chronicAbsenteeism).slice(0, 5).map((student: any, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{student.student}</span>
                        <Badge variant="outline">{student.rate}</Badge>
                      </div>
                    ))}
                  </div>
                  {Object.keys(analytics.chronicAbsenteeism).length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({Object.keys(analytics.chronicAbsenteeism).length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}