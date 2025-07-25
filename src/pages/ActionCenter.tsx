import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Activity, Heart, Users, AlertTriangle, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { blink } from '@/blink/client';
import { 
  ActionCenterModule, 
  DashboardMetrics, 
  BehaviorIncident, 
  CounselingSession, 
  StudentAlert,
  HolisticStudentProfile 
} from '@/types/school-management';

const ActionCenter: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [behaviorIncidents, setBehaviorIncidents] = useState<BehaviorIncident[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [studentAlerts, setStudentAlerts] = useState<StudentAlert[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<HolisticStudentProfile[]>([]);

  // Action Center Modules - matching your presentation
  const modules: ActionCenterModule[] = [
    {
      id: 'attendance',
      title: 'Attendance Analytics',
      description: 'Advanced attendance pattern analysis and chronic absenteeism tracking',
      icon: 'Calendar',
      color: 'bg-blue-500',
      route: '/attendance',
      role: 'Administrator'
    },
    {
      id: 'behavior',
      title: 'Behavior Management',
      description: 'Incident tracking, pattern recognition, and intervention planning',
      icon: 'Activity',
      color: 'bg-orange-500',
      route: '/behavior',
      role: 'Teacher'
    },
    {
      id: 'counseling',
      title: 'Counseling Hub',
      description: 'Session management, intervention tracking, and student support',
      icon: 'Heart',
      color: 'bg-green-500',
      route: '/counseling',
      role: 'Counselor'
    },
    {
      id: 'profiles',
      title: 'Holistic Profiles',
      description: 'Complete student view combining all data sources',
      icon: 'Users',
      color: 'bg-purple-500',
      route: '/profiles',
      role: 'Everyone'
    }
  ];

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setLoading(state.isLoading);
    });
    return unsubscribe;
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load all data in parallel
      const [alerts, incidents, sessions] = await Promise.all([
        blink.db.studentAlerts.list({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
        blink.db.behaviorIncidents.list({ where: { userId: user.id }, orderBy: { incidentDate: 'desc' }, limit: 10 }),
        blink.db.counselingSessions.list({ where: { userId: user.id }, orderBy: { sessionDate: 'desc' }, limit: 10 })
      ]);

      setStudentAlerts(alerts);
      setBehaviorIncidents(incidents);
      setCounselingSessions(sessions);

      // Calculate metrics
      const criticalAlerts = alerts.filter(a => a.severity === 'Critical').length;
      const warningAlerts = alerts.filter(a => a.severity === 'High' || a.severity === 'Medium').length;
      
      setMetrics({
        total_students: 150, // This would come from your student roster
        total_alerts: alerts.length,
        critical_alerts: criticalAlerts,
        warning_alerts: warningAlerts,
        students_at_risk: criticalAlerts + Math.floor(warningAlerts / 2),
        positive_trends: 3, // Students showing improvement
        behavior_incidents_this_week: incidents.filter(i => 
          new Date(i.incidentDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        counseling_sessions_this_week: sessions.filter(s => 
          new Date(s.sessionDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        active_interventions: 12 // This would come from interventions table
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const getIconComponent = (iconName: string) => {
    const icons = {
      Calendar,
      Activity,
      Heart,
      Users,
      AlertTriangle,
      TrendingUp,
      Clock,
      Target
    };
    return icons[iconName as keyof typeof icons] || Calendar;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the Action Center</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Action Center</h1>
              <p className="text-gray-600 mt-1">From Insight to Action: Tools for every role in your school</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Professional Plan
              </Badge>
              <Button variant="outline" onClick={() => blink.auth.logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_alerts}</div>
                <div className="flex space-x-4 text-xs text-gray-600 mt-2">
                  <span className="text-red-600 font-semibold">{metrics.critical_alerts} Critical</span>
                  <span className="text-orange-600 font-semibold">{metrics.warning_alerts} Warnings</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
                <Target className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.students_at_risk}</div>
                <p className="text-xs text-gray-600 mt-2">Requiring immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Trends</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.positive_trends}</div>
                <p className="text-xs text-gray-600 mt-2">Students showing improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>{metrics.behavior_incidents_this_week} Behavior Incidents</div>
                  <div>{metrics.counseling_sessions_this_week} Counseling Sessions</div>
                  <div>{metrics.active_interventions} Active Interventions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Center Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {modules.map((module) => {
            const IconComponent = getIconComponent(module.icon);
            return (
              <Card 
                key={module.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => setSelectedModule(module.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${module.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                  <Badge variant="secondary" className="mt-2 w-fit mx-auto">
                    For {module.role}
                  </Badge>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity Tabs */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
            <TabsTrigger value="behavior">Behavior Incidents</TabsTrigger>
            <TabsTrigger value="counseling">Counseling Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Alerts</CardTitle>
                <CardDescription>Automated system alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAlerts.length > 0 ? (
                    studentAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.student_name}</span>
                            <span className="text-sm text-gray-500">• {alert.alert_type}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.alert_message}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No alerts at this time</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Behavior Incidents</CardTitle>
                <CardDescription>Latest behavioral incidents and interventions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {behaviorIncidents.length > 0 ? (
                    behaviorIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{incident.incident_type}</Badge>
                            <span className="font-medium">{incident.student_name}</span>
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                          </div>
                          {incident.description && (
                            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                          )}
                          {incident.location && (
                            <p className="text-xs text-gray-500 mt-1">Location: {incident.location}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(incident.incident_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent behavior incidents</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="counseling" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Counseling Sessions</CardTitle>
                <CardDescription>Latest counseling interventions and support sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {counselingSessions.length > 0 ? (
                    counselingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{session.session_type}</Badge>
                            <span className="font-medium">{session.student_name}</span>
                            <Badge variant="secondary">{session.concern_category}</Badge>
                          </div>
                          {session.session_notes && (
                            <p className="text-sm text-gray-600 mt-1">{session.session_notes}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Status: {session.status}</span>
                            {session.counselor_name && <span>Counselor: {session.counselor_name}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.session_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent counseling sessions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActionCenter;