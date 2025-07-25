import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Settings,
  TrendingUp,
  Upload,
  Users,
  AlertTriangle,
  BookOpen,
  Target,
  Brain
} from 'lucide-react'

const navigation = [
  {
    name: 'ClarityEd',
    href: '/',
    icon: Target,
    description: 'Complete leadership platform'
  },
  {
    name: 'Action Center',
    href: '/action-center',
    icon: Users,
    description: 'Comprehensive management hub'
  },
  {
    name: 'Behavior Hub',
    href: '/behavior-hub',
    icon: Brain,
    description: 'AI-powered pattern analysis'
  },
  {
    name: 'Import Data',
    href: '/import',
    icon: Upload,
    description: 'Upload CSV files'
  },
  {
    name: 'Student Analysis',
    href: '/students',
    icon: Users,
    description: 'Individual student metrics'
  },
  {
    name: 'At-Risk Students',
    href: '/at-risk',
    icon: AlertTriangle,
    description: 'Intervention needed'
  },
  {
    name: 'Grade Analysis',
    href: '/grades',
    icon: GraduationCap,
    description: 'Grade-level trends'
  },
  {
    name: 'Monthly Trends',
    href: '/monthly',
    icon: TrendingUp,
    description: 'Monthly patterns'
  },
  {
    name: 'Late Arrivals',
    href: '/late-arrivals',
    icon: Clock,
    description: 'Tardiness analysis'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Generate reports'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Configure thresholds'
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn('flex h-full flex-col border-r bg-background', className)}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D68B2] text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-[#3366FF]">ClarityEd</h1>
              <p className="text-xs text-muted-foreground">School Leadership</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isActive && 'bg-[#3D68B2]/10 text-[#3D68B2] hover:bg-[#3D68B2]/15',
                    !isActive && 'hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {!collapsed && <span>System Online</span>}
        </div>
      </div>
    </div>
  )
}