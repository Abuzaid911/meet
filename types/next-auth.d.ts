import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string
      /** The user's username */
      username?: string
      name?: string | null
      email?: string | null
      image?: string | null
    } & DefaultSession["user"]
    /** Google API access token for calendar access */
    accessToken?: string
    /** Google API refresh token */
    refreshToken?: string
    /** Expiration time for the access token */
    accessTokenExpires?: number
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's unique identifier */
    id: string
    /** The user's username */
    username?: string
    /** Google API access token for calendar access */
    accessToken?: string
    /** Google API refresh token */
    refreshToken?: string
    /** Expiration time for the access token */
    accessTokenExpires?: number
  }
}
