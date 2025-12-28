import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'username parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.TWITTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'TWITTER_API_KEY not configured in .env.local file' },
        { status: 500 }
      )
    }

    console.log(`[API] Fetching followings for username: ${username}`)

    const url = `https://api.twitterapi.io/twitter/user/followings?userName=${username}&pageSize=200`
    console.log(`[API] Request URL: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const data = await response.json()

    console.log(`[API] TwitterAPI.io followings response status: ${response.status}`)

    if (!response.ok) {
      console.error('[API] Error from TwitterAPI.io:', data)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Free tier: 100 requests/day',
            retryAfter: 60
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: data.msg || data.message || 'Failed to fetch followings',
          details: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[API] Route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}