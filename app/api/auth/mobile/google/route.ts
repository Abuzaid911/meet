import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth.config'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { idToken } = body

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Create NextAuth session
    const session = await getServerSession(authOptions)
    if (!session) {
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
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
} 