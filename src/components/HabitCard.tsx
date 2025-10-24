import { useState } from 'react'
import { Check, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Confetti from 'react-confetti-boom'

interface HabitCardProps {
  habit: {
    id: string
    name: string
    icon: string
    streak: number
    completedToday: boolean
  }
  onComplete: (habitId: string) => void
  isCompleting?: boolean
}

export default function HabitCard({ habit, onComplete, isCompleting = false }: HabitCardProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  const handleComplete = () => {
    if (habit.completedToday || isCompleting) return

    setShowConfetti(true)
    toast.success(`+10 XP! Great job! 🎉`)
    onComplete(habit.id)
    
    setTimeout(() => setShowConfetti(false), 2000)
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          mode="boom"
          particleCount={100}
          colors={['#8B5CF6', '#A78BFA', '#F59E0B', '#10B981']}
        />
      )}
      
      <Card className={cn(
        "p-4 transition-all duration-300 hover:shadow-md",
        habit.completedToday && "bg-success/5 border-success/20 shadow-success/20",
        isCompleting && "animate-pulse"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{habit.icon}</div>
            <div>
              <h3 className="font-medium text-foreground">{habit.name}</h3>
              {habit.streak > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{habit.streak} day streak</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleComplete}
            disabled={habit.completedToday || isCompleting}
            className={cn(
              "relative h-12 w-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center group",
              "hover:scale-105 active:scale-95 disabled:scale-100",
              habit.completedToday 
                ? "bg-success border-success text-success-foreground shadow-success" 
                : "border-primary/30 hover:border-primary hover:bg-primary/5",
              isCompleting && "animate-pulse"
            )}
          >
            {habit.completedToday ? (
              <Check className="h-6 w-6 animate-in zoom-in-50 duration-300" />
            ) : (
              <div className="h-6 w-6 border-2 border-current rounded-full group-hover:border-primary group-hover:bg-primary/10 transition-colors duration-200" />
            )}
            
            {/* Ripple effect */}
            {!habit.completedToday && (
              <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-200" />
            )}
          </button>
        </div>
      </Card>
    </>
  )
}
