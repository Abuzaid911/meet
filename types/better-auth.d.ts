import { DefaultSession } from "better-auth"

declare module "better-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string
      /** The user's username */
      username?: string | null
      name?: string | null
      email?: string | null
      image?: string | null
    } & DefaultSession["user"]
  }

  interface JWT {
    /** The user's unique identifier */
    id: string
    /** The user's username */
    username?: string | null
    /** The user's profile picture */
    picture?: string | null
    /** The user's name */
    name?: string | null
    /** The user's email */
    email?: string | null
  }
} 