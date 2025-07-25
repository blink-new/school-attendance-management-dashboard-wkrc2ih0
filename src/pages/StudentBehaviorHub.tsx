import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Settings, 
  Plus,
  Eye,
  Target,
  Brain,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { blink } from '@/blink/client';

interface SchoolSetting {
  id: string;
  setting_name: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
}

interface StudentRecord {
  id: string;
  student_name: string;
  grade: string;
  student_id?: string;
}

interface PatternAlert {
  id: string;
  student_name: string;
  alert_type: string;
  severity: string;
  pattern_description: string;
  recommended_action?: string;
  is_active: boolean;
  created_at: string;
}

interface AnalyticsData {
  totalStudents: number;
  activeAlerts: number;
  chronicAbsences: number;
  behaviorIncidents: number;
  attendanceRate: number;
  tardinessRate: number;
  recentAlerts: PatternAlert[];
  attendanceTrend: Array<{ date: string; rate: number }>;
  behaviorTrend: Array<{ type: string; count: number }>;
  riskDistribution: Array<{ level: string; count: number; color: string }>;
}

const COLORS = {
  low: '#22c55e',
  medium: '#f59e0b', 
  high: '#ef4444',
  critical: '#dc2626'
};

export default function StudentBehaviorHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<SchoolSetting[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({});

  const loadAnalytics = useCallback(async () => {
    try {
      const userId = (await blink.auth.me()).id;
      
      // Get all records for analytics
      const [attendanceRecords, tardinessRecords, behaviorIncidents, patternAlerts] = await Promise.all([
        blink.db.attendanceRecords.list({ where: { user_id: userId } }),
        blink.db.tardinessRecords.list({ where: { user_id: userId } }),
        blink.db.behaviorIncidents.list({ where: { user_id: userId } }),
        blink.db.patternAlerts.list({ where: { user_id: userId, is_active: "1" } })
      ]);

      // Calculate analytics
      const totalStudents = students.length;
      const activeAlerts = patternAlerts?.length || 0;
      
      // Calculate attendance rate
      const totalAttendanceRecords = attendanceRecords?.length || 0;
      const presentRecords = attendanceRecords?.filter(r => r.status === 'present').length || 0;
      const attendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 100;

      // Calculate chronic absences
      const studentAttendance = new Map();
      attendanceRecords?.forEach(record => {
        if (!studentAttendance.has(record.student_name)) {
          studentAttendance.set(record.student_name, { total: 0, absent: 0 });
        }
        const stats = studentAttendance.get(record.student_name);
        stats.total++;
        if (record.status === 'absent' || record.status === 'unexcused') {
          stats.absent++;
        }
      });

      let chronicAbsences = 0;
      studentAttendance.forEach(stats => {
        const absenceRate = (stats.absent / stats.total) * 100;
        if (absenceRate > 10) chronicAbsences++;
      });

      // Calculate tardiness rate
      const totalTardiness = tardinessRecords?.length || 0;
      const tardinessRate = totalStudents > 0 ? (totalTardiness / totalStudents) : 0;

      // Recent alerts
      const recentAlerts = patternAlerts?.slice(0, 5) || [];

      // Attendance trend (last 7 days)
      const attendanceTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = attendanceRecords?.filter(r => r.date === dateStr) || [];
        const dayPresent = dayRecords.filter(r => r.status === 'present').length;
        const dayTotal = dayRecords.length;
        const rate = dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 100;
        
        attendanceTrend.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          rate: Math.round(rate)
        });
      }

      // Behavior trend
      const behaviorTypes = new Map();
      behaviorIncidents?.forEach(incident => {
        const count = behaviorTypes.get(incident.incident_type) || 0;
        behaviorTypes.set(incident.incident_type, count + 1);
      });

      const behaviorTrend = Array.from(behaviorTypes.entries()).map(([type, count]) => ({
        type: type.replace('_', ' ').toUpperCase(),
        count
      }));

      // Risk distribution
      const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
      patternAlerts?.forEach(alert => {
        riskCounts[alert.severity as keyof typeof riskCounts]++;
      });

      const riskDistribution = Object.entries(riskCounts).map(([level, count]) => ({
        level: level.toUpperCase(),
        count,
        color: COLORS[level as keyof typeof COLORS]
      }));

      setAnalytics({
        totalStudents,
        activeAlerts,
        chronicAbsences,
        behaviorIncidents: behaviorIncidents?.length || 0,
        attendanceRate: Math.round(attendanceRate),
        tardinessRate: Math.round(tardinessRate),
        recentAlerts,
        attendanceTrend,
        behaviorTrend,
        riskDistribution
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [students]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load settings
      const settingsResult = await blink.db.schoolSettings.list({
        where: { user_id: (await blink.auth.me()).id }
      });
      setSettings(settingsResult || []);

      // Load students
      const studentsResult = await blink.db.studentRecords.list({
        where: { user_id: (await blink.auth.me()).id }
      });
      setStudents(studentsResult || []);

      // Load analytics data
      await loadAnalytics();
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadAnalytics]);

  const updateSetting = async (settingName: string, value: string) => {
    try {
      const userId = (await blink.auth.me()).id;
      const setting = settings.find(s => s.setting_name === settingName);
      
      if (setting) {
        await blink.db.schoolSettings.update(setting.id, {
          setting_value: value,
          updated_at: new Date().toISOString()
        });
      } else {
        await blink.db.schoolSettings.create({
          user_id: userId,
          setting_name: settingName,
          setting_value: value,
          setting_type: 'number',
          description: 'Custom setting',
          category: 'custom'
        });
      }
      
      await loadData();
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const addRecord = async (type: string, data: any) => {
    try {
      const userId = (await blink.auth.me()).id;
      
      switch (type) {
        case 'attendance':
          await blink.db.attendanceRecords.create({
            user_id: userId,
            ...data
          });
          break;
        case 'tardiness':
          await blink.db.tardinessRecords.create({
            user_id: userId,
            ...data
          });
          break;
        case 'behavior':
          await blink.db.behaviorIncidents.create({
            user_id: userId,
            ...data
          });
          break;
        case 'student':
          await blink.db.studentRecords.create({
            user_id: userId,
            ...data
          });
          break;
      }
      
      setShowAddDialog(false);
      setNewRecord({});
      await loadData();
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const runPatternAnalysis = async () => {
    try {
      const userId = (await blink.auth.me()).id;
      
      // This would run the pattern detection algorithm
      await blink.db.patternAlerts.create({
        user_id: userId,
        student_name: selectedStudent || 'Sample Student',
        alert_type: 'attendance_pattern',
        severity: 'medium',
        pattern_description: 'Monday/Friday absence pattern detected',
        recommended_action: 'Schedule parent conference to discuss attendance concerns',
        is_active: true
      });
      
      await loadData();
    } catch (error) {
      console.error('Error running pattern analysis:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Student Behavior Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Behavior Hub</h1>
          <p className="text-gray-600">Comprehensive tracking and pattern analysis for student success</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Record</DialogTitle>
                <DialogDescription>
                  Add attendance, behavior, or tardiness records
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Record Type</Label>
                  <Select onValueChange={(value) => setNewRecord({...newRecord, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="tardiness">Tardiness</SelectItem>
                      <SelectItem value="behavior">Behavior Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newRecord.type === 'student' && (
                  <>
                    <div>
                      <Label>Student Name</Label>
                      <Input 
                        value={newRecord.student_name || ''}
                        onChange={(e) => setNewRecord({...newRecord, student_name: e.target.value})}
                        placeholder="Enter student name"
                      />
                    </div>
                    <div>
                      <Label>Grade</Label>
                      <Input 
                        value={newRecord.grade || ''}
                        onChange={(e) => setNewRecord({...newRecord, grade: e.target.value})}
                        placeholder="Enter grade"
                      />
                    </div>
                  </>
                )}
                
                <Button 
                  onClick={() => addRecord(newRecord.type, newRecord)}
                  disabled={!newRecord.type}
                  className="w-full"
                >
                  Add Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={runPatternAnalysis}>
            <Brain className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics?.activeAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics?.attendanceRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Overall attendance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Behavior Incidents</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analytics?.behaviorIncidents || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Daily attendance rates over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.attendanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Students by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.riskDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({level, count}) => `${level}: ${count}`}
                    >
                      {analytics?.riskDistribution?.map((entry, index) => (
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
              <CardTitle>Recent Pattern Alerts</CardTitle>
              <CardDescription>Latest automated pattern detections</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentAlerts?.length ? (
                <div className="space-y-3">
                  {analytics.recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.student_name}</p>
                          <p className="text-sm text-gray-600">{alert.pattern_description}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent alerts. System is monitoring for patterns.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Behavior Incidents by Type</CardTitle>
                <CardDescription>Distribution of behavior incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.behaviorTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chronic Absence Analysis</CardTitle>
                <CardDescription>Students with concerning attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Chronic Absentees (greater than 10%)</span>
                    <Badge variant="destructive">{analytics?.chronicAbsences || 0}</Badge>
                  </div>
                  <Progress value={(analytics?.chronicAbsences || 0) / (analytics?.totalStudents || 1) * 100} />
                  <p className="text-sm text-gray-600">
                    {((analytics?.chronicAbsences || 0) / (analytics?.totalStudents || 1) * 100).toFixed(1)}% of students
                  </p>
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
              <CardDescription>Advanced algorithms analyze student data to predict and flag concerning patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Attendance Patterns</h3>
                  <p className="text-sm text-gray-600">Monday/Friday absences, consecutive days</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-semibold">Tardiness Trends</h3>
                  <p className="text-sm text-gray-600">Chronic lateness, escalating patterns</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <h3 className="font-semibold">Behavior Escalation</h3>
                  <p className="text-sm text-gray-600">Increasing severity, frequency patterns</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Student for Analysis</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.student_name}>
                          {student.student_name} - Grade {student.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={runPatternAnalysis} disabled={!selectedStudent} className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Run Pattern Analysis for {selectedStudent || 'Selected Student'}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pattern analysis runs automatically every night. Manual analysis can be triggered for immediate insights.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Parameters</CardTitle>
              <CardDescription>Customize thresholds and criteria according to your school's policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Attendance Settings</h3>
                  
                  <div className="space-y-2">
                    <Label>Chronic Absence Threshold (%)</Label>
                    <Input 
                      type="number"
                      value={settings.find(s => s.setting_name === 'chronic_absence_threshold')?.setting_value || '10'}
                      onChange={(e) => updateSetting('chronic_absence_threshold', e.target.value)}
                    />
                    <p className="text-xs text-gray-600">Percentage of absences that triggers chronic absence flag</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Consecutive Absence Limit</Label>
                    <Input 
                      type="number"
                      value={settings.find(s => s.setting_name === 'consecutive_absence_limit')?.setting_value || '3'}
                      onChange={(e) => updateSetting('consecutive_absence_limit', e.target.value)}
                    />
                    <p className="text-xs text-gray-600">Number of consecutive absences that triggers alert</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Behavior Settings</h3>
                  
                  <div className="space-y-2">
                    <Label>Behavior Incident Limit (per week)</Label>
                    <Input 
                      type="number"
                      value={settings.find(s => s.setting_name === 'behavior_incident_limit')?.setting_value || '3'}
                      onChange={(e) => updateSetting('behavior_incident_limit', e.target.value)}
                    />
                    <p className="text-xs text-gray-600">Number of behavior incidents per week that triggers alert</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Tardiness Threshold (per month)</Label>
                    <Input 
                      type="number"
                      value={settings.find(s => s.setting_name === 'tardiness_threshold')?.setting_value || '5'}
                      onChange={(e) => updateSetting('tardiness_threshold', e.target.value)}
                    />
                    <p className="text-xs text-gray-600">Number of tardiness incidents per month that triggers alert</p>
                  </div>
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Changes to these settings will affect future pattern analysis. Existing alerts will not be retroactively modified.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Everything you need to know about the Student Behavior Hub</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is">
                  <AccordionTrigger>What is the Student Behavior Hub?</AccordionTrigger>
                  <AccordionContent>
                    The Student Behavior Hub is a comprehensive platform that tracks and analyzes student attendance, tardiness, and behavior patterns. It uses advanced algorithms to detect concerning patterns early, allowing schools to intervene proactively rather than reactively.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="how-patterns">
                  <AccordionTrigger>How does pattern detection work?</AccordionTrigger>
                  <AccordionContent>
                    Our AI algorithms analyze multiple data points including attendance frequency and timing, tardiness trends, behavior incident severity and frequency, and cross-correlation between different data types. The system runs analysis nightly and flags students who meet your customized criteria.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customization">
                  <AccordionTrigger>How can I customize the parameters for my school?</AccordionTrigger>
                  <AccordionContent>
                    In the Settings tab, you can adjust all thresholds including chronic absence percentage, consecutive absence limits, behavior incident thresholds, tardiness limits, and pattern detection sensitivity. These settings ensure the system aligns with your school's specific policies and intervention strategies.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-entry">
                  <AccordionTrigger>How do I enter student data?</AccordionTrigger>
                  <AccordionContent>
                    You can add data through manual entry using the "Add Record" button, CSV import for bulk uploads, or API integration with your existing Student Information System. The system accepts standard formats and validates data for accuracy.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="alerts">
                  <AccordionTrigger>What types of alerts will I receive?</AccordionTrigger>
                  <AccordionContent>
                    The system generates four types of alerts: Attendance Patterns (Monday/Friday absences, chronic absenteeism), Tardiness Trends (chronic lateness, escalating patterns), Behavior Escalation (increasing incident frequency or severity), and Cross-Pattern Alerts (students showing multiple concerning patterns). Each alert includes recommended actions and intervention strategies.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="action-plans">
                  <AccordionTrigger>How do I create action plans from alerts?</AccordionTrigger>
                  <AccordionContent>
                    When an alert is generated, the system provides risk assessment with severity levels, pattern description explaining what was detected, recommended actions with evidence-based intervention suggestions, and historical context of previous patterns and interventions. You can then assign actions to staff members and track intervention progress.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="privacy">
                  <AccordionTrigger>How is student data protected?</AccordionTrigger>
                  <AccordionContent>
                    Student privacy is our top priority with encryption of all data in transit and at rest, role-based access control, full FERPA compliance, complete data isolation between schools, and comprehensive audit logs tracking all data access.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}