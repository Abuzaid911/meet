import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Create OAuth clients for both web and iOS
const webClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const iOSClient = new OAuth2Client(process.env.GOOGLE_IOS_CLIENT_ID)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { idToken, clientType = 'ios' } = body

    // Select the appropriate client based on the type
    const client = clientType === 'web' ? webClient : iOSClient
    const clientId = clientType === 'web' 
      ? process.env.GOOGLE_CLIENT_ID 
      : process.env.GOOGLE_IOS_CLIENT_ID

    console.log(`Verifying token for client type: ${clientType}`)
    console.log(`Using client ID: ${clientId}`)

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    })

    const payload = ticket.getPayload()
    if (!payload) {
      console.log('Invalid token payload')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('Token verified successfully')
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Create a custom session token
    const sessionToken = jwt.sign(
      {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '1d' }
    )

    // Set the session cookie
    const cookieStore = cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    })

    // Return user info and access token
    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture
      },
      accessToken: sessionToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 })
  }
}