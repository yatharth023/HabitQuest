import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import XPBar from '@/components/XPBar'
import HabitCard from '@/components/HabitCard'
import BottomNav from '@/components/BottomNav'
import { Plus, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function HomePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: habitsData, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => apiClient.getHabits(),
  })

  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null)

  const completeHabitMutation = useMutation({
    mutationFn: (habitId: string) => apiClient.completeHabit(habitId),
    onSuccess: (data: any) => {
      // Update the habits query with optimistic update
      queryClient.setQueryData(['habits'], (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          habits: oldData.habits.map((habit: any) => 
            habit.id === data.completion.habitId 
              ? { ...habit, completedToday: true }
              : habit
          )
        }
      })
      
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setCompletingHabitId(null)
    },
    onError: (error) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.error(`Failed to complete habit: ${error.message}`)
      setCompletingHabitId(null)
    },
  })

  const handleCompleteHabit = (habitId: string) => {
    setCompletingHabitId(habitId)
    
    // Optimistic update - immediately update the UI
    queryClient.setQueryData(['habits'], (oldData: any) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        habits: oldData.habits.map((habit: any) => 
          habit.id === habitId 
            ? { ...habit, completedToday: true }
            : habit
        )
      }
    })
    
    // Then make the API call
    completeHabitMutation.mutate(habitId)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (habitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const habits = (habitsData as any)?.habits || []
  const completedHabits = habits.filter((habit: any) => habit.completedToday)
  const pendingHabits = habits.filter((habit: any) => !habit.completedToday)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.username || 'Adventurer'}!
              </h1>
              <p className="text-muted-foreground">{today}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">Level {user?.level}</div>
              <div className="text-sm text-muted-foreground">{user?.totalXp} XP</div>
            </div>
          </div>
          
          <XPBar currentXp={user?.totalXp || 0} level={user?.level || 1} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{habits.length}</div>
              <div className="text-sm text-muted-foreground">Total Habits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{completedHabits.length}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Habits Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's Quests</h2>
            <Link to="/add-habit">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Habit
              </Button>
            </Link>
          </div>

          {habits.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-6xl">🎯</div>
                <div>
                  <h3 className="text-lg font-semibold">No habits yet!</h3>
                  <p className="text-muted-foreground">
                    Create your first habit to start your adventure.
                  </p>
                </div>
                <Link to="/add-habit">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Habit
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingHabits.map((habit: any) => (
                <div key={habit.id} className="animate-in slide-in-from-left duration-300">
                  <HabitCard
                    habit={habit}
                    onComplete={handleCompleteHabit}
                    isCompleting={completingHabitId === habit.id}
                  />
                </div>
              ))}
              
              {completedHabits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-success flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Completed Today
                  </h3>
                  {completedHabits.map((habit: any) => (
                    <div key={habit.id} className="animate-in slide-in-from-right duration-300">
                      <HabitCard
                        habit={habit}
                        onComplete={handleCompleteHabit}
                        isCompleting={completingHabitId === habit.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
