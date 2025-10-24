import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface XPBarProps {
  currentXp: number
  level: number
  className?: string
}

export default function XPBar({ currentXp, level, className }: XPBarProps) {
  const xpForCurrentLevel = (level - 1) * 100
  const xpForNextLevel = level * 100
  const progress = ((currentXp - xpForCurrentLevel) / 100) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Level {level}</span>
        <span className="text-muted-foreground">
          {currentXp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel} XP
        </span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-muted"
      />
    </div>
  )
}
