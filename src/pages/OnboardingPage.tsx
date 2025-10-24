import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Target, Users, ArrowRight, ArrowLeft } from 'lucide-react'

const steps = [
  {
    icon: Trophy,
    title: "Welcome to HabitQuest!",
    description: "Transform your daily habits into an epic RPG adventure. Complete habits to earn XP, level up, and unlock achievements!",
    color: "text-primary"
  },
  {
    icon: Target,
    title: "Build Your Quest",
    description: "Create habits that matter to you. Each completion earns 10 XP and builds your streak. The longer your streak, the stronger you become!",
    color: "text-success"
  },
  {
    icon: Users,
    title: "Join the Community",
    description: "Connect with friends, take on challenges together, and compete on the leaderboard. Your journey is better with companions!",
    color: "text-accent"
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/auth')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className={`h-8 w-8 ${currentStepData.color}`} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                {currentStepData.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              <Button onClick={nextStep} className="flex-1">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
