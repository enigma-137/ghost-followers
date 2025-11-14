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

    console.log(`[API] Fetching user: ${username}`)

    const url = `https://api.twitterapi.io/twitter/user/info?userName=${username}`
    console.log(`[API] Request URL: ${url}`)

    // Retry logic with exponential backoff
    let response;
    let lastError;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[API] Attempt ${attempt + 1}/${maxRetries}`)
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`[API] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message)
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!response) {
      throw lastError;
    }

    const data = await response.json()
    
    console.log(`[API] TwitterAPI.io response status: ${response.status}`)

    if (!response.ok) {
      console.error('[API] Error from TwitterAPI.io:', data)
      return NextResponse.json(
        { 
          error: data.msg || data.message || 'Failed to fetch user',
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