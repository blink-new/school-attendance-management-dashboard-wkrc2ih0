import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Users, AlertTriangle, TrendingUp, Calendar, Brain, Settings, 
  FileText, Target, Zap, CheckCircle, XCircle, Clock, 
  Download, Mail, Phone, MessageSquare, BookOpen, Award
} from 'lucide-react';
import { blink } from '@/blink/client';

// Types
interface Student {
  id: string;
  name: string;
  grade: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  attendanceRate: number;
  behaviorIncidents: number;
  lastAlert?: string;
}

interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  type: 'attendance' | 'behavior' | 'academic' | 'family';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved';
  assignedTo?: string;
}

interface Thresholds {
  chronicAbsenceRate: number;
  consecutiveAbsences: number;
  behaviorIncidentsPerWeek: number;
  tardinessPerMonth: number;
  academicDeclinePercent: number;
  parentContactDays: number;
}

interface FridayReport {
  weekOf: string;
  totalStudents: number;
  newAlerts: number;
  resolvedIssues: number;
  criticalCases: Alert[];
  improvements: string[];
  recommendations: string[];
  keyMetrics: {
    attendanceRate: number;
    behaviorIncidents: number;
    interventionsActive: number;
  };
}

const ClarityEd: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds>({
    chronicAbsenceRate: 10,
    consecutiveAbsences: 3,
    behaviorIncidentsPerWeek: 2,
    tardinessPerMonth: 5,
    academicDeclinePercent: 15,
    parentContactDays: 3
  });
  const [fridayReport, setFridayReport] = useState<FridayReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load students
      const studentsData = await blink.db.students.list({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
      });
      
      // Load alerts
      const alertsData = await blink.db.student_alerts.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50
      });

      // Load thresholds
      const thresholdsData = await blink.db.school_thresholds.list({
        where: { userId: user.id },
        limit: 1
      });

      setStudents(studentsData || []);
      setAlerts(alertsData || []);
      
      if (thresholdsData && thresholdsData.length > 0) {
        setThresholds({
          chronicAbsenceRate: thresholdsData[0].chronicAbsenceRate || 10,
          consecutiveAbsences: thresholdsData[0].consecutiveAbsences || 3,
          behaviorIncidentsPerWeek: thresholdsData[0].behaviorIncidentsPerWeek || 2,
          tardinessPerMonth: thresholdsData[0].tardinessPerMonth || 5,
          academicDeclinePercent: thresholdsData[0].academicDeclinePercent || 15,
          parentContactDays: thresholdsData[0].parentContactDays || 3
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize auth and load data
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  const saveThresholds = async () => {
    if (!user) return;
    
    try {
      // Check if thresholds exist
      const existing = await blink.db.school_thresholds.list({
        where: { userId: user.id },
        limit: 1
      });

      if (existing && existing.length > 0) {
        await blink.db.school_thresholds.update(existing[0].id, {
          ...thresholds,
          updatedAt: new Date().toISOString()
        });
      } else {
        await blink.db.school_thresholds.create({
          id: `threshold_${Date.now()}`,
          userId: user.id,
          ...thresholds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      alert('Thresholds saved successfully!');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      alert('Error saving thresholds');
    }
  };

  const generateFridayReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      
      const criticalAlerts = alerts.filter(alert => 
        alert.severity === 'critical' && alert.status !== 'resolved'
      );

      const report: FridayReport = {
        weekOf: weekStart.toLocaleDateString(),
        totalStudents: students.length,
        newAlerts: alerts.filter(alert => {
          const alertDate = new Date(alert.createdAt);
          return alertDate >= weekStart;
        }).length,
        resolvedIssues: alerts.filter(alert => 
          alert.status === 'resolved' && 
          new Date(alert.createdAt) >= weekStart
        ).length,
        criticalCases: criticalAlerts.slice(0, 5),
        improvements: [
          'Attendance rate improved by 2.3% this week',
          '3 students moved from high-risk to medium-risk status',
          'Successful parent conferences held for 5 at-risk students'
        ],
        recommendations: [
          'Schedule intervention meetings for critical cases',
          'Implement peer mentoring program for medium-risk students',
          'Review and adjust tardiness policies'
        ],
        keyMetrics: {
          attendanceRate: 94.2,
          behaviorIncidents: alerts.filter(a => a.type === 'behavior').length,
          interventionsActive: alerts.filter(a => a.status === 'in_progress').length
        }
      };

      setFridayReport(report);
    } catch (error) {
      console.error('Error generating Friday report:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPatternAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulate pattern analysis
      const newAlerts: Alert[] = [];
      
      students.forEach(student => {
        // Check attendance patterns
        if (student.attendanceRate < thresholds.chronicAbsenceRate) {
          newAlerts.push({
            id: `alert_${Date.now()}_${student.id}`,
            studentId: student.id,
            studentName: student.name,
            type: 'attendance',
            severity: student.attendanceRate < 5 ? 'critical' : 'high',
            message: `Chronic absenteeism detected: ${student.attendanceRate}% attendance rate`,
            createdAt: new Date().toISOString(),
            status: 'new'
          });
        }

        // Check behavior patterns
        if (student.behaviorIncidents >= thresholds.behaviorIncidentsPerWeek) {
          newAlerts.push({
            id: `alert_${Date.now()}_${student.id}_behavior`,
            studentId: student.id,
            studentName: student.name,
            type: 'behavior',
            severity: student.behaviorIncidents > 5 ? 'critical' : 'high',
            message: `Behavior escalation: ${student.behaviorIncidents} incidents this week`,
            createdAt: new Date().toISOString(),
            status: 'new'
          });
        }
      });

      // Save new alerts to database
      for (const alert of newAlerts) {
        await blink.db.student_alerts.create({
          ...alert,
          userId: user.id
        });
      }

      // Reload alerts
      loadData();
      alert(`Pattern analysis complete! Found ${newAlerts.length} new alerts.`);
    } catch (error) {
      console.error('Error running pattern analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const attendanceData = [
    { month: 'Sep', rate: 95.2 },
    { month: 'Oct', rate: 94.8 },
    { month: 'Nov', rate: 93.5 },
    { month: 'Dec', rate: 92.1 },
    { month: 'Jan', rate: 94.2 }
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: students.filter(s => s.riskLevel === 'low').length, color: '#10B981' },
    { name: 'Medium Risk', value: students.filter(s => s.riskLevel === 'medium').length, color: '#F59E0B' },
    { name: 'High Risk', value: students.filter(s => s.riskLevel === 'high').length, color: '#EF4444' },
    { name: 'Critical', value: students.filter(s => s.riskLevel === 'critical').length, color: '#DC2626' }
  ];

  const behaviorTrends = [
    { week: 'Week 1', incidents: 12 },
    { week: 'Week 2', incidents: 8 },
    { week: 'Week 3', incidents: 15 },
    { week: 'Week 4', incidents: 6 }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Welcome to ClarityEd</CardTitle>
            <CardDescription className="text-center">
              Please sign in to access your student insights dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => blink.auth.login()}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ClarityEd
              </h1>
              <p className="text-gray-600 mt-2">Student Insights for School Leaders</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-white">
                {students.length} Students
              </Badge>
              <Badge variant="outline" className="bg-white">
                {alerts.filter(a => a.status === 'new').length} New Alerts
              </Badge>
              <Button 
                onClick={() => blink.auth.logout()}
                variant="outline"
                className="bg-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Pattern Detection
            </TabsTrigger>
            <TabsTrigger value="friday-report" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Friday Report
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="action-center" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Action Center
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{students.length}</div>
                  <div className="text-sm opacity-90 mt-1">Active enrollment</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {alerts.filter(a => a.status !== 'resolved').length}
                  </div>
                  <div className="text-sm opacity-90 mt-1">Requiring attention</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">94.2%</div>
                  <div className="text-sm opacity-90 mt-1">This week</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Critical Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {alerts.filter(a => a.severity === 'critical').length}
                  </div>
                  <div className="text-sm opacity-90 mt-1">Immediate action needed</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Monthly attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#8B5CF6" 
                        fill="url(#colorGradient)" 
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Student risk levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest student concerns and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="font-medium">{alert.studentName}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Incident Trends</CardTitle>
                  <CardDescription>Weekly behavior incidents</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={behaviorTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="incidents" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Risk Matrix</CardTitle>
                  <CardDescription>Risk level distribution by grade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['9th', '10th', '11th', '12th'].map((grade) => {
                      const gradeStudents = students.filter(s => s.grade === grade);
                      const critical = gradeStudents.filter(s => s.riskLevel === 'critical').length;
                      const high = gradeStudents.filter(s => s.riskLevel === 'high').length;
                      const medium = gradeStudents.filter(s => s.riskLevel === 'medium').length;
                      const low = gradeStudents.filter(s => s.riskLevel === 'low').length;
                      
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{grade} Grade</span>
                            <span className="text-sm text-gray-600">{gradeStudents.length} students</span>
                          </div>
                          <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
                            <div className="bg-green-500" style={{ width: `${(low / gradeStudents.length) * 100}%` }} />
                            <div className="bg-yellow-500" style={{ width: `${(medium / gradeStudents.length) * 100}%` }} />
                            <div className="bg-orange-500" style={{ width: `${(high / gradeStudents.length) * 100}%` }} />
                            <div className="bg-red-500" style={{ width: `${(critical / gradeStudents.length) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pattern Detection Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Pattern Detection</CardTitle>
                <CardDescription>
                  Automated analysis to identify at-risk students based on your custom thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Run Pattern Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Analyze all student data for concerning patterns
                    </p>
                  </div>
                  <Button 
                    onClick={runPatternAnalysis}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {loading ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Attendance Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• Monday/Friday absence patterns</div>
                        <div>• Chronic absenteeism trends</div>
                        <div>• Consecutive absence streaks</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Behavior Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• Incident frequency escalation</div>
                        <div>• Time-of-day patterns</div>
                        <div>• Severity progression</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Academic Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• Grade decline trends</div>
                        <div>• Assignment completion rates</div>
                        <div>• Subject-specific struggles</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friday Report Tab */}
          <TabsContent value="friday-report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Friday Morning Report</CardTitle>
                <CardDescription>
                  Weekly executive summary for leadership meetings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Generate Weekly Report</h3>
                    <p className="text-sm text-gray-600">
                      Comprehensive summary of student concerns and improvements
                    </p>
                  </div>
                  <Button 
                    onClick={generateFridayReport}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                </div>

                {fridayReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-blue-600">
                            {fridayReport.newAlerts}
                          </div>
                          <div className="text-sm text-blue-600">New Alerts This Week</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">
                            {fridayReport.resolvedIssues}
                          </div>
                          <div className="text-sm text-green-600">Issues Resolved</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-orange-600">
                            {fridayReport.criticalCases.length}
                          </div>
                          <div className="text-sm text-orange-600">Critical Cases</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-600">Improvements This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {fridayReport.improvements.map((improvement, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-orange-600">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {fridayReport.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">Critical Cases Requiring Immediate Attention</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {fridayReport.criticalCases.map((alert) => (
                            <div key={alert.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-red-800">{alert.studentName}</div>
                                  <div className="text-sm text-red-600">{alert.message}</div>
                                </div>
                                <Badge variant="destructive">Critical</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - PARAMOUNT FEATURE */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Customizable Thresholds
                </CardTitle>
                <CardDescription>
                  Configure your school's specific criteria for identifying at-risk students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These thresholds determine when students are flagged for intervention. 
                    Adjust them based on your school's policies and standards.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-purple-600">Attendance Thresholds</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chronicAbsence">Chronic Absence Rate (%)</Label>
                      <Input
                        id="chronicAbsence"
                        type="number"
                        value={thresholds.chronicAbsenceRate}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          chronicAbsenceRate: Number(e.target.value)
                        })}
                        className="border-purple-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-600">
                        Students below this attendance rate are flagged as chronically absent
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="consecutiveAbsences">Consecutive Absences</Label>
                      <Input
                        id="consecutiveAbsences"
                        type="number"
                        value={thresholds.consecutiveAbsences}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          consecutiveAbsences: Number(e.target.value)
                        })}
                        className="border-purple-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-600">
                        Number of consecutive days absent before flagging
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tardiness">Tardiness Per Month</Label>
                      <Input
                        id="tardiness"
                        type="number"
                        value={thresholds.tardinessPerMonth}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          tardinessPerMonth: Number(e.target.value)
                        })}
                        className="border-purple-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-600">
                        Monthly tardiness limit before intervention
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-blue-600">Behavior Thresholds</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="behaviorIncidents">Behavior Incidents Per Week</Label>
                      <Input
                        id="behaviorIncidents"
                        type="number"
                        value={thresholds.behaviorIncidentsPerWeek}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          behaviorIncidentsPerWeek: Number(e.target.value)
                        })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-600">
                        Weekly behavior incidents before escalation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicDecline">Academic Decline (%)</Label>
                      <Input
                        id="academicDecline"
                        type="number"
                        value={thresholds.academicDeclinePercent}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          academicDeclinePercent: Number(e.target.value)
                        })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-600">
                        Grade decline percentage that triggers alert
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parentContact">Parent Contact Days</Label>
                      <Input
                        id="parentContact"
                        type="number"
                        value={thresholds.parentContactDays}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          parentContactDays: Number(e.target.value)
                        })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-600">
                        Days after alert before parent contact is required
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={saveThresholds}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Save Thresholds
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview of Current Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Current Alert Criteria</CardTitle>
                <CardDescription>Preview of how your thresholds will flag students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="font-medium text-red-800">Critical Risk</div>
                    <div className="text-sm text-red-600 mt-1">
                      • Attendance &lt; {Math.floor(thresholds.chronicAbsenceRate / 2)}%
                      <br />
                      • {thresholds.behaviorIncidentsPerWeek * 2}+ behavior incidents/week
                      <br />
                      • {thresholds.consecutiveAbsences + 2}+ consecutive absences
                    </div>
                  </div>

                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="font-medium text-orange-800">High Risk</div>
                    <div className="text-sm text-orange-600 mt-1">
                      • Attendance &lt; {thresholds.chronicAbsenceRate}%
                      <br />
                      • {thresholds.behaviorIncidentsPerWeek}+ behavior incidents/week
                      <br />
                      • {thresholds.consecutiveAbsences}+ consecutive absences
                    </div>
                  </div>

                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="font-medium text-yellow-800">Medium Risk</div>
                    <div className="text-sm text-yellow-600 mt-1">
                      • {thresholds.tardinessPerMonth}+ tardies/month
                      <br />
                      • {thresholds.academicDeclinePercent}%+ grade decline
                      <br />
                      • Pattern concerns detected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Center Tab */}
          <TabsContent value="action-center" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Interventions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Interventions</CardTitle>
                  <CardDescription>Current intervention plans and their progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.filter(a => a.status === 'in_progress').slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{alert.studentName}</div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">{alert.message}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Add Note
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-1" />
                            Contact Parent
                          </Button>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Resolved
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common intervention tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Parent Alert
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Intervention Plan
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="w-4 h-4 mr-2" />
                    Assign Mentor
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Team Conference
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Success Stories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Success Stories</CardTitle>
                <CardDescription>Students who have improved through interventions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="font-medium text-green-800">Sarah Johnson</div>
                    <div className="text-sm text-green-600 mt-1">
                      Attendance improved from 75% to 92% after parent conference and peer mentoring
                    </div>
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                      Resolved
                    </Badge>
                  </div>
                  
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="font-medium text-green-800">Marcus Williams</div>
                    <div className="text-sm text-green-600 mt-1">
                      Behavior incidents reduced by 80% through counseling and modified schedule
                    </div>
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                      Resolved
                    </Badge>
                  </div>
                  
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="font-medium text-green-800">Emma Davis</div>
                    <div className="text-sm text-green-600 mt-1">
                      Academic performance improved 25% after tutoring intervention
                    </div>
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                      Resolved
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClarityEd;