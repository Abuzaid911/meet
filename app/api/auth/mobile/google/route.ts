import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
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

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day

    // Create a NextAuth compatible session token
    const sessionToken = jwt.sign(
      {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        sub: payload.sub, // NextAuth uses 'sub' as the user ID
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expires.getTime() / 1000),
        jti: crypto.randomUUID(), // Required by NextAuth
        // Add NextAuth specific claims
        email_verified: payload.email_verified,
        aud: "authenticated",
        iss: process.env.NEXTAUTH_URL,
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": ["user"],
          "x-hasura-default-role": "user",
          "x-hasura-role": "user",
          "x-hasura-user-id": payload.sub
        }
      },
      process.env.NEXTAUTH_SECRET!
    )

    // Create response with session token
    const response = NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture
      },
      accessToken: sessionToken,
      expires: expires.toISOString()
    })

    // Set the session cookie in the response
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expires
    })

    return response

  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 })
  }
} 