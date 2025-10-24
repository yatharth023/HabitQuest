import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100, 'Habit name must be less than 100 characters'),
  goalType: z.string().default('check'),
  goalValue: z.union([z.number().int().min(1).max(10000), z.undefined()]).optional(),
  goalUnit: z.union([z.string().max(50), z.undefined()]).optional(),
})

type HabitForm = z.infer<typeof habitSchema> & { icon: string }

const icons = [
  { name: 'Book', emoji: '📚' },
  { name: 'Dumbbell', emoji: '🏋️' },
  { name: 'Coffee', emoji: '☕' },
  { name: 'Code', emoji: '💻' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Heart', emoji: '❤️' },
  { name: 'Brain', emoji: '🧠' },
  { name: 'Sparkles', emoji: '✨' },
]

export default function AddHabitPage() {
  const [selectedIcon, setSelectedIcon] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      goalType: 'check',
    },
  })

  const createHabitMutation = useMutation({
    mutationFn: (data: HabitForm) => apiClient.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit created successfully!')
      navigate('/home')
    },
    onError: (error) => {
      console.error('Failed to create habit:', error)
      toast.error(`Failed to create habit: ${error.message}`)
    },
  })

  const onSubmit = (data: HabitForm) => {
    console.log('Form submitted with data:', data)
    console.log('Selected icon:', selectedIcon)
    console.log('Form errors:', form.formState.errors)
    console.log('Form is valid:', form.formState.isValid)
    
    if (!selectedIcon) {
      toast.error('Please select an icon')
      return
    }
    
    console.log('Creating habit with data:', { ...data, icon: selectedIcon })
    createHabitMutation.mutate({
      name: data.name,
      icon: selectedIcon,
      goalType: data.goalType,
      goalValue: data.goalValue,
      goalUnit: data.goalUnit,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Create New Habit</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Habit Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                console.log('Form submit event triggered')
                form.handleSubmit(onSubmit)(e)
              }} className="space-y-6">
                {/* Habit Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Habit Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Read for 30 minutes"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Icon Selection */}
                <div className="space-y-2">
                  <Label>Choose an Icon</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => {
                          console.log('Icon selected:', icon.name)
                          setSelectedIcon(icon.name)
                        }}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedIcon === icon.name
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl">{icon.emoji}</div>
                        <div className="text-xs mt-1">{icon.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Type */}
                <div className="space-y-2">
                  <Label htmlFor="goalType">Goal Type</Label>
                  <select
                    id="goalType"
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    {...form.register('goalType')}
                  >
                    <option value="check">Simple Check (Complete/Incomplete)</option>
                    <option value="count">Count (Number of times)</option>
                    <option value="duration">Duration (Time spent)</option>
                  </select>
                </div>

                {/* Goal Value (if not simple check) */}
                {form.watch('goalType') !== 'check' && (
                  <div className="space-y-2">
                    <Label htmlFor="goalValue">Goal Value</Label>
                    <Input
                      id="goalValue"
                      type="number"
                      placeholder="Enter your goal"
                      {...form.register('goalValue', { valueAsNumber: true })}
                    />
                    {form.formState.errors.goalValue && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.goalValue.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Goal Unit (if not simple check) */}
                {form.watch('goalType') !== 'check' && (
                  <div className="space-y-2">
                    <Label htmlFor="goalUnit">Unit</Label>
                    <Input
                      id="goalUnit"
                      placeholder="e.g., minutes, pages, glasses"
                      {...form.register('goalUnit')}
                    />
                    {form.formState.errors.goalUnit && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.goalUnit.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createHabitMutation.isPending || !selectedIcon}
                >
                  {createHabitMutation.isPending ? 'Creating...' : 'Create Habit'}
                </Button>
                
                {/* Debug Info */}
                {false && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                    <div>Selected Icon: {selectedIcon || 'None'}</div>
                    <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
                    <div>Form Errors: {Object.keys(form.formState.errors).length}</div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
