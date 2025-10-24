import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BottomNav from '@/components/BottomNav'
import { Trophy, Clock, Target, X } from 'lucide-react'
import { toast } from 'sonner'

export default function ChallengesPage() {
  const queryClient = useQueryClient()

  const { data: availableData, isLoading: availableLoading } = useQuery({
    queryKey: ['challenges', 'available'],
    queryFn: () => apiClient.getAvailableChallenges(),
  })

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: () => apiClient.getActiveChallenges(),
  })

  const { data: completedData, isLoading: completedLoading } = useQuery({
    queryKey: ['challenges', 'completed'],
    queryFn: () => apiClient.getCompletedChallenges(),
  })

  const joinChallengeMutation = useMutation({
    mutationFn: (challengeId: string) => apiClient.joinChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Challenge joined!')
    },
    onError: () => {
      toast.error('Failed to join challenge')
    },
  })

  const abandonChallengeMutation = useMutation({
    mutationFn: (challengeId: string) => apiClient.abandonChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Challenge abandoned')
    },
    onError: () => {
      toast.error('Failed to abandon challenge')
    },
  })

  const availableChallenges = (availableData as any)?.challenges || []
  const activeChallenges = (activeData as any)?.challenges || []
  const completedChallenges = (completedData as any)?.challenges || []

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Take on epic quests and earn bonus XP</p>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Available Challenges */}
          <TabsContent value="available" className="space-y-4">
            {availableLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : availableChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No challenges available</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableChallenges.map((challenge: any) => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{challenge.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{challenge.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Target: {challenge.targetValue}</span>
                          <span>Duration: {challenge.durationDays} days</span>
                          <span className="text-accent font-medium">
                            +{challenge.xpReward} XP
                          </span>
                        </div>
                        
                        <Button
                          onClick={() => joinChallengeMutation.mutate(challenge.id)}
                          disabled={challenge.joined || joinChallengeMutation.isPending}
                          className="w-full"
                        >
                          {challenge.joined ? 'Already Joined' : 'Join Challenge'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-4">
            {activeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No active challenges</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((userChallenge: any) => (
                  <Card key={userChallenge.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{userChallenge.challenge.icon}</div>
                        <div>
                          <CardTitle className="text-lg">
                            {userChallenge.challenge.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {userChallenge.challenge.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {userChallenge.currentProgress} / {userChallenge.challenge.targetValue}
                            </span>
                          </div>
                          <Progress value={userChallenge.progressPercentage} />
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{userChallenge.daysRemaining} days left</span>
                          </div>
                          <span className="text-accent font-medium">
                            +{userChallenge.challenge.xpReward} XP
                          </span>
                        </div>
                        
                        <Button
                          variant="destructive"
                          onClick={() => abandonChallengeMutation.mutate(userChallenge.challengeId)}
                          disabled={abandonChallengeMutation.isPending}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Abandon Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Challenges */}
          <TabsContent value="completed" className="space-y-4">
            {completedLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : completedChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No completed challenges yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedChallenges.map((userChallenge: any) => (
                  <Card key={userChallenge.id} className="border-success/20 bg-success/5">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{userChallenge.challenge.icon}</div>
                        <div>
                          <CardTitle className="text-lg text-success">
                            {userChallenge.challenge.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Completed on {new Date(userChallenge.completedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Final Progress: {userChallenge.currentProgress} / {userChallenge.challenge.targetValue}
                        </span>
                        <span className="text-accent font-bold">
                          +{userChallenge.challenge.xpReward} XP Earned
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  )
}
