import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BottomNav from '@/components/BottomNav'
import { Users, UserPlus, Search, Check, X, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const queryClient = useQueryClient()

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiClient.getFriends(),
  })

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => apiClient.getFriendRequests(),
  })

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search-users', debouncedSearchQuery],
    queryFn: () => apiClient.searchUsers(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length >= 2,
  })

  const sendRequestMutation = useMutation({
    mutationFn: (friendId: string) => apiClient.sendFriendRequest(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      toast.success('Friend request sent!')
    },
    onError: () => {
      toast.error('Failed to send friend request')
    },
  })

  const respondToRequestMutation = useMutation({
    mutationFn: ({ friendshipId, action }: { friendshipId: string; action: 'accept' | 'decline' }) =>
      apiClient.respondToFriendRequest(friendshipId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Request updated!')
    },
    onError: () => {
      toast.error('Failed to update request')
    },
  })

  const unfriendMutation = useMutation({
    mutationFn: (friendshipId: string) => apiClient.unfriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Unfriended successfully')
    },
    onError: () => {
      toast.error('Failed to unfriend')
    },
  })

  const friends = (friendsData as any)?.friends || []
  const requests = (requestsData as any)?.requests || []
  const searchResults = (searchData as any)?.users || []

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="text-muted-foreground">Connect with other adventurers</p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {requests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-4">
            {friendsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : friends.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Search for users to add them as friends
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {friends.map((friendship: any) => (
                  <Card key={friendship.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friendship.friend.avatarUrl || ''} />
                            <AvatarFallback>
                              {friendship.friend.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{friendship.friend.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Level {friendship.friend.level} • {friendship.friend.totalXp} XP
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => unfriendMutation.mutate(friendship.id)}
                          disabled={unfriendMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfriend
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : requests.length === 0 ? (
              <Card className="p-8 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No pending requests</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {requests.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.user.avatarUrl || ''} />
                            <AvatarFallback>
                              {request.user.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{request.user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Level {request.user.level} • {request.user.totalXp} XP
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              respondToRequestMutation.mutate({
                                friendshipId: request.id,
                                action: 'accept',
                              })
                            }
                            disabled={respondToRequestMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              respondToRequestMutation.mutate({
                                friendshipId: request.id,
                                action: 'decline',
                              })
                            }
                            disabled={respondToRequestMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Users */}
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : debouncedSearchQuery.length < 2 ? (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Enter at least 2 characters to search
                  </p>
                </Card>
              ) : searchResults.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No users found</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((user: any) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatarUrl || ''} />
                              <AvatarFallback>
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                Level {user.level} • {user.totalXp} XP
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => sendRequestMutation.mutate(user.id)}
                            disabled={
                              user.friendshipStatus === 'pending' ||
                              user.friendshipStatus === 'accepted' ||
                              sendRequestMutation.isPending
                            }
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {user.friendshipStatus === 'pending'
                              ? 'Request Sent'
                              : user.friendshipStatus === 'accepted'
                              ? 'Friends'
                              : 'Add Friend'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  )
}
