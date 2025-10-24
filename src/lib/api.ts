const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api'

// API client for backend communication
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as any).Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth endpoints
  async register(data: { email: string; password: string; username: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Habit endpoints
  async getHabits() {
    return this.request('/habits')
  }

  async createHabit(data: {
    name: string
    icon: string
    goalType?: string
    goalValue?: number
    goalUnit?: string
  }) {
    return this.request('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async completeHabit(habitId: string) {
    return this.request('/habits/complete', {
      method: 'POST',
      body: JSON.stringify({ habitId }),
    })
  }

  async deleteHabit(habitId: string) {
    return this.request(`/habits/${habitId}`, {
      method: 'DELETE',
    })
  }

  // Challenge endpoints
  async getAvailableChallenges() {
    return this.request('/challenges/available')
  }

  async getActiveChallenges() {
    return this.request('/challenges/active')
  }

  async getCompletedChallenges() {
    return this.request('/challenges/completed')
  }

  async joinChallenge(challengeId: string) {
    return this.request('/challenges/join', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    })
  }

  async abandonChallenge(challengeId: string) {
    return this.request(`/challenges/${challengeId}`, {
      method: 'DELETE',
    })
  }

  // Friend endpoints
  async getFriends() {
    return this.request('/friends')
  }

  async getFriendRequests() {
    return this.request('/friends/requests')
  }

  async searchUsers(query: string) {
    return this.request(`/friends/search?query=${encodeURIComponent(query)}`)
  }

  async sendFriendRequest(friendId: string) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    })
  }

  async respondToFriendRequest(friendshipId: string, action: 'accept' | 'decline') {
    return this.request('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ friendshipId, action }),
    })
  }

  async unfriend(friendshipId: string) {
    return this.request(`/friends/${friendshipId}`, {
      method: 'DELETE',
    })
  }

  // Progress endpoints
  async getProgress() {
    return this.request('/progress')
  }

  async getStats() {
    return this.request('/progress/stats')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
