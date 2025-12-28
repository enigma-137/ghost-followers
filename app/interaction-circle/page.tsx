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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  // Function to distribute users across concentric circles
  const getCirclePosition = (index: number, total: number) => {
    const circles = [
      { radius: 80, maxUsers: 8 },   // Inner circle
      { radius: 130, maxUsers: 16 }, // Middle circle  
      { radius: 180, maxUsers: 32 }  // Outer circle
    ]
    
    let userIndex = index
    for (const circle of circles) {
      if (userIndex < circle.maxUsers) {
        const angle = (userIndex / circle.maxUsers) * 2 * Math.PI - Math.PI / 2
        const centerX = 250
        const centerY = 250
        const x = Math.cos(angle) * circle.radius + centerX
        const y = Math.sin(angle) * circle.radius + centerY
        return { x: x - 24, y: y - 24 }
      }
      userIndex -= circle.maxUsers
    }
    
    
    const angle = (userIndex / 32) * 2 * Math.PI - Math.PI / 2
    const x = Math.cos(angle) * 180 + 250
    const y = Math.sin(angle) * 180 + 250
    return { x: x - 24, y: y - 24 }
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Twitter Interaction Circle</h1>

      {!showResults ? (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Enter Twitter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Generate Circle'}
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Your 2025 Top Mutuals</h2>
          <div className="relative mx-auto mb-6" style={{ width: '500px', height: '500px' }}>
            {user && (
              <img
                src={user.profilePicture}
                alt={user.userName || user.name}
                className="absolute w-16 h-16 rounded-full border-4 border-blue-500"
                style={{ left: 250 - 32, top: 250 - 32 }}
              />
            )}

            {mutuals.map((mutual: any, index: number) => {
              const position = getCirclePosition(index, mutuals.length)

              return (
                <img
                  key={mutual.id}
                  src={mutual.profilePicture || mutual.profile_image_url_https || mutual.profile_image_url}
                  alt={mutual.userName || mutual.name || mutual.screen_name || mutual.username}
                  className="absolute w-12 h-12 rounded-full border-2 border-white shadow-lg"
                  style={{ left: position.x, top: position.y }}
                  title={`${mutual.userName || mutual.name || mutual.screen_name || mutual.username} (${(mutual.followers_count || mutual.followers || 0).toLocaleString()} followers)`}
                />
              )
            })}
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleShare} variant="outline">
              Copy Link
            </Button>
            <Button onClick={handleTwitterShare} variant="outline">
              Share on Twitter
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Try Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
