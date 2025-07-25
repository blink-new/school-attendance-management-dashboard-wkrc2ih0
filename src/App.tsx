import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import ActionCenter from '@/pages/ActionCenter'
import StudentBehaviorHub from '@/pages/StudentBehaviorHub'
import ClarityEd from '@/pages/ClarityEd'
import { Toaster } from '@/components/ui/toaster'
import { blink } from '@/blink/client'

// Placeholder components for other routes
const ImportData = () => <div className="p-6"><h1 className="text-2xl font-bold">Import Data</h1><p>CSV import functionality coming soon...</p></div>
const StudentAnalysis = () => <div className="p-6"><h1 className="text-2xl font-bold">Student Analysis</h1><p>Individual student metrics coming soon...</p></div>
const AtRiskStudents = () => <div className="p-6"><h1 className="text-2xl font-bold">At-Risk Students</h1><p>Intervention tracking coming soon...</p></div>
const GradeAnalysis = () => <div className="p-6"><h1 className="text-2xl font-bold">Grade Analysis</h1><p>Grade-level trends coming soon...</p></div>
const MonthlyTrends = () => <div className="p-6"><h1 className="text-2xl font-bold">Monthly Trends</h1><p>Monthly patterns coming soon...</p></div>
const LateArrivals = () => <div className="p-6"><h1 className="text-2xl font-bold">Late Arrivals</h1><p>Tardiness analysis coming soon...</p></div>
const Reports = () => <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p>Report generation coming soon...</p></div>
const Settings = () => <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Configuration panel coming soon...</p></div>

function AuthenticatedApp() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ClarityEd />} />
          <Route path="/clarity" element={<ClarityEd />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/action-center" element={<ActionCenter />} />
          <Route path="/behavior-hub" element={<StudentBehaviorHub />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="/students" element={<StudentAnalysis />} />
          <Route path="/at-risk" element={<AtRiskStudents />} />
          <Route path="/grades" element={<GradeAnalysis />} />
          <Route path="/monthly" element={<MonthlyTrends />} />
          <Route path="/late-arrivals" element={<LateArrivals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  )
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3D68B2] text-white">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#3D68B2]">School Attendance Dashboard</h2>
          <p className="text-sm text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    </div>
  )
}

function LoginPrompt() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#3D68B2] text-white">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#3D68B2]">School Attendance Dashboard</h1>
          <p className="text-muted-foreground">
            Professional attendance analytics and management platform
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 text-left">
            <h3 className="font-semibold mb-2">✨ Premium Features</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Comprehensive attendance analytics</li>
              <li>• At-risk student identification</li>
              <li>• Chronic absenteeism tracking</li>
              <li>• Late arrival analysis</li>
              <li>• Configurable intervention thresholds</li>
              <li>• Automated report generation</li>
            </ul>
          </div>
          <button
            onClick={() => blink.auth.login()}
            className="w-full rounded-lg bg-[#3D68B2] px-4 py-2 text-white hover:bg-[#3D68B2]/90 transition-colors"
          >
            Sign In to Continue
          </button>
          <p className="text-xs text-muted-foreground">
            Secure authentication powered by Blink
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginPrompt />
  }

  return <AuthenticatedApp />
}