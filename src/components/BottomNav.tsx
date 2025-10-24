import { Link, useLocation } from 'react-router-dom'
import { Home, BarChart3, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/progress', icon: BarChart3, label: 'Progress' },
  { path: '/challenges', icon: Trophy, label: 'Challenges' },
  { path: '/friends', icon: Users, label: 'Friends' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
