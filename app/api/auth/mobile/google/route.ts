import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth.config'

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

    // Create NextAuth session
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Failed to create session')
      return NextResponse.json({ error: 'Failed to create session' }, { status: 401 })
    }

    // Return user info and access token
    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture
      },
      accessToken: session.accessToken,
      expires: session.expires
    })
  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 })
  }
} 