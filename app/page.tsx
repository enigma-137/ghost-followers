"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Search,
  Users,
  Activity,
  AlertCircle,
  Loader2,
  TrendingDown,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GhostFollowersInsight() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<any>(null)
  const [analysisCompleted, setAnalysisCompleted] = useState(false)

  useEffect(() => {
    const savedResults = localStorage.getItem('ghostFollowersResults')
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults)
        setResults(parsed)
        setAnalysisCompleted(true)
        setUsername(parsed.username)
      } catch (e) {
        console.error('Failed to parse saved results:', e)
      }
    }
  }, [])

  const analyzeFollowersQuick = async (username: string, totalFollowers: number) => {
    // Statistical estimation based on follower count and account age
    // Industry averages suggest:
    // - 30-40% ghost followers for accounts with 10k+ followers
    // - 15-25% inactive followers
    // - Rest are active
    
    const ghostRate = totalFollowers > 10000 ? 0.35 : totalFollowers > 1000 ? 0.25 : 0.15
    const inactiveRate = 0.20
    const activeRate = 1 - ghostRate - inactiveRate
    
  
    const variance = 0.05
    const randomGhostRate = ghostRate + (Math.random() - 0.5) * variance * 2
    const randomInactiveRate = inactiveRate + (Math.random() - 0.5) * variance * 2
    const randomActiveRate = 1 - randomGhostRate - randomInactiveRate
    
    const ghost = Math.round(totalFollowers * randomGhostRate)
    const inactive = Math.round(totalFollowers * randomInactiveRate)
    const active = totalFollowers - ghost - inactive
    
    return {
      username,
      total_followers: totalFollowers,
      analyzed: totalFollowers,
      active,
      inactive,
      ghost,
      avg_ghost_score: randomGhostRate,
      estimation_method: "statistical",
      timestamp: new Date().toISOString(),
    }
  }


  const analyzeFollowers = async () => {
    if (!username.trim()) {
      setError("Please enter a Twitter username")
      return
    }

    setLoading(true)
    setError("")
    setResults(null)

    try {
      const cleanUsername = username.replace("@", "").trim()

     
      const userResponse = await fetch(`/api/twitter/user?username=${cleanUsername}`)

      if (!userResponse.ok) {
        const errorData = await userResponse.json()

        if (userResponse.status === 401) {
          throw new Error("Invalid API key. Check your .env.local file")
        } else if (userResponse.status === 404) {
          throw new Error(`User @${cleanUsername} not found`)
        } else if (userResponse.status === 429) {
          throw new Error("Rate limit exceeded. Please wait 5 seconds between requests.")
        } else if (userResponse.status === 504) {
          throw new Error("Connection timeout. TwitterAPI.io may be temporarily unavailable.")
        } else {
          throw new Error(errorData.error || errorData.suggestion || "Failed to fetch user data")
        }
      }

      const userData = await userResponse.json()
      const userInfo = userData.data || userData
      const totalFollowers = userInfo.followers || 0

      // Use statistical analysis instead of fetching all followers
      const analysisResults = await analyzeFollowersQuick(cleanUsername, totalFollowers)
      setResults(analysisResults)
      setAnalysisCompleted(true)

      
      localStorage.setItem('ghostFollowersResults', JSON.stringify(analysisResults))

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error("Analysis error:", err)
    } finally {
      setLoading(false)
    }
  }


  const chartData = results
    ? [
        {
          name: "Active",
          value: results.active,
          color: "#22c55e",
          percentage: ((results.active / results.total_followers) * 100).toFixed(1),
        },
        {
          name: "Inactive",
          value: results.inactive,
          color: "#f59e0b",
          percentage: ((results.inactive / results.total_followers) * 100).toFixed(1),
        },
        {
          name: "Ghost",
          value: results.ghost,
          color: "#ef4444",
          percentage: ((results.ghost / results.total_followers) * 100).toFixed(1),
        },
      ]
    : []

  const barChartData = results
    ? [
        { name: "Active", count: results.active, fill: "#22c55e" },
        { name: "Inactive", count: results.inactive, fill: "#f59e0b" },
        { name: "Ghost", count: results.ghost, fill: "#ef4444" },
      ]
    : []

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
      
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
           
            <h1 className="text-4xl md:text-5xl font-bold">De💀d Followers</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how many of your followers are inactive or ☠ with statistical analysis
          </p>
        </div>


        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className=" md:flex gap-2">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !loading && analyzeFollowers()}
                placeholder="Enter Twitter username (e.g., elonmusk)"
                disabled={loading}
                className="flex-1 "
              />
              <Button onClick={analyzeFollowers} disabled={loading || analysisCompleted} size="lg" className="mt-2 w-full md:w-48 md:mt-0">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing
                  </>
                ) : analysisCompleted ? (
                  <>
                    <Search className="w-4 h-4" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>• Uses statistical analysis based on follower count</p>
                <p>• Not entirely real</p>
              </div>
            </div>
          </CardContent>
        </Card>

       
        {error && (
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  {error.includes("Rate limit") && (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>• It might just be encoutering rate limiting issues from X</p>
                      
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

       
        {results && (
          <div className="space-y-8">
          
            {results.estimation_method && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-500 font-medium">
                    {results.estimation_method === "mock" 
                      ? "Demo Analysis - Using Simulated Data" 
                      : "Statistical Analysis - Based on Follower Count"}
                  </span>
                </div>
              </div>
            )}

            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{results.total_followers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyzed: {results.analyzed.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{results.active.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((results.active / results.total_followers) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-500" />
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-500">{results.inactive.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((results.inactive / results.total_followers) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                  
                    <CardTitle className="text-lg font-medium">☠</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">{results.ghost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((results.ghost / results.total_followers) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

           
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution</CardTitle>
                  <CardDescription>Follower activity breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparison</CardTitle>
                  <CardDescription>Follower counts by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

        
            <Card>
              <CardHeader>
                <CardTitle>Analysis Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4  rounded-lg border border-green-500/20">
                    <h4 className="font-semibold text-green-500 mb-2">Active Followers</h4>
                    <p className="text-muted-foreground">
                      Regular users who engage with content and maintain active accounts.
                    </p>
                  </div>
                  <div className="p-4  rounded-lg border border-amber-500/20">
                    <h4 className="font-semibold text-amber-500 mb-2">Inactive Followers</h4>
                    <p className="text-muted-foreground">
                      Users with reduced activity, occasional logins, less frequent engagement.
                    </p>
                  </div>
                  <div className="p-4  rounded-lg border border-red-500/20">
                    <h4 className="font-semibold text-red-500 mb-2">Ghost Followers</h4>
                    <p className="text-muted-foreground">
                      Likely abandoned accounts with no recent activity or engagement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

       
        {/* {!results && !loading && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Statistical Analysis:</strong> Uses industry-standard metrics and follower count 
                to estimate ghost followers without fetching individual follower data.
              </p>
            
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  )
}