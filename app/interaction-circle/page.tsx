'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function InteractionCircle() {
  const [username, setUsername] = useState('')
  const [user, setUser] = useState<any>(null)
  const [mutuals, setMutuals] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSubmit = async () => {
    if (!username) return

    setLoading(true)
    try {
      // Fetch user data, followers and followings
      const [userRes, followersRes, followingsRes] = await Promise.all([
        fetch(`/api/twitter/user?username=${username}`),
        fetch(`/api/twitter/followers?username=${username}`),
        fetch(`/api/twitter/followings?username=${username}`)
      ])

      if (!userRes.ok || !followersRes.ok || !followingsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const userData = await userRes.json()
      const followersData = await followersRes.json()
      const followingsData = await followingsRes.json()

      setUser(userData.data)

      // Compute mutuals
      const followerIds = new Set(followersData.followers?.map((u: any) => u.id) || followersData.data?.map((u: any) => u.id))
      const mutualsList = (followingsData.followings || followingsData.data)?.filter((user: any) => followerIds.has(user.id)) || []

      const sortedMutuals = mutualsList
        .sort((a: any, b: any) => (b.followers_count || b.followers || 0) - (a.followers_count || a.followers || 0))
        .slice(0, 100)

      setMutuals(sortedMutuals)
      setShowResults(true)
    } catch (error) {
      console.error(error)
      alert('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!')
    })
  }

  const handleTwitterShare = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out my 2025 Twitter interaction circle!`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleReset = () => {
    setShowResults(false)
    setUsername('')
    setUser(null)
    setMutuals([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#E9D5FF' }}>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Twitter Interaction Circle</h1>

        {!showResults ? (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Enter Twitter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? 'Loading...' : 'Generate Circle'}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Your 2025 Top Mutuals</h2>
            
            {/* Grid Layout */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="grid grid-cols-7 gap-3 justify-items-center">
                {mutuals.map((mutual: any, index: number) => (
                  <div
                    key={mutual.id}
                    className="w-20 h-20 rounded-full border-4 border-black overflow-hidden shadow-lg hover:scale-110 transition-transform"
                    title={`${mutual.userName || mutual.name || mutual.screen_name || mutual.username} (${(mutual.followers_count || mutual.followers || 0).toLocaleString()} followers)`}
                  >
                    <img
                      src={mutual.profilePicture || mutual.profile_image_url_https || mutual.profile_image_url}
                      alt={mutual.userName || mutual.name || mutual.screen_name || mutual.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center max-w-md mx-auto">
              <Button onClick={handleShare} variant="outline">
                Copy Link
              </Button>
              <Button onClick={handleTwitterShare} variant="outline">
                Twitter
              </Button>
              <Button asChild variant="outline">
                <a href="/">Ghost</a>
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Try Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}