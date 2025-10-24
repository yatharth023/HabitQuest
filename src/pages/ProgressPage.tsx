import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'
import { Flame, Trophy, Calendar } from 'lucide-react'

export default function ProgressPage() {

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => apiClient.getProgress(),
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats(),
  })

  if (progressLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const topStreaks = (progressData as any)?.topStreaks || []
  const heatmapData = (progressData as any)?.heatmapData || []
  const stats = (statsData as any) || {}

  // Generate heatmap visualization
  const generateHeatmap = () => {
    const weeks = 12
    const daysPerWeek = 7
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (weeks * 7))

    const heatmap = []
    for (let week = 0; week < weeks; week++) {
      const weekData = []
      for (let day = 0; day < daysPerWeek; day++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + (week * 7) + day)
        
        const dateKey = date.toISOString().split('T')[0]
        const dayData = heatmapData.find((d: any) => d.date === dateKey)
        const count = dayData?.count || 0
        
        let intensity = 'bg-muted'
        if (count > 0) {
          if (count <= 2) intensity = 'bg-green-200'
          else if (count <= 4) intensity = 'bg-green-400'
          else intensity = 'bg-green-600'
        }
        
        weekData.push({
          date: dateKey,
          count,
          intensity,
          isToday: dateKey === today.toISOString().split('T')[0]
        })
      }
      heatmap.push(weekData)
    }
    
    return heatmap
  }

  const heatmap = generateHeatmap()

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Your Progress</h1>
          <p className="text-muted-foreground">Track your consistency and achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalHabits || 0}</div>
              <div className="text-sm text-muted-foreground">Total Habits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.totalCompletions || 0}</div>
              <div className="text-sm text-muted-foreground">Total Completions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{stats.currentStreak || 0}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.completedChallenges || 0}</div>
              <div className="text-sm text-muted-foreground">Challenges Won</div>
            </CardContent>
          </Card>
        </div>

        {/* Consistency Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consistency Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Last 12 weeks</span>
                <div className="flex items-center gap-4">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-muted rounded"></div>
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {heatmap.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 rounded-sm ${day.intensity} ${
                          day.isToday ? 'ring-2 ring-primary' : ''
                        }`}
                        title={`${day.date}: ${day.count} completions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStreaks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No streaks yet. Complete some habits to build your first streak!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topStreaks.map((habit: any) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{habit.icon}</div>
                      <div>
                        <div className="font-medium">{habit.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {habit.streak} day streak
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span className="font-bold">{habit.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BottomNav />
    </div>
  )
}
