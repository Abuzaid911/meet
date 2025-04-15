import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"
import GithubProvider from "next-auth/providers/github"

/**
 * Extending NextAuth's Session type to include user.id
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
    }
  }
}

/**
 * Generates a unique username from a name by removing spaces, converting to lowercase,
 * and adding a random number
 */
function generateUsername(name: string): string {
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) // Limit base length to allow for numbers

  // Generate a random 3-digit number
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")

  return `${baseName}${randomNum}`
}

// Ensure required env variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials")
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    /**
     * Handles the sign-in process
     */
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" && user.email) {
          if (!user.name) {
            console.error("User name is missing from Google profile")
            return false
          }

          // Check if the user already exists in the database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          })

          if (existingUser) {
            // If the user exists but doesn't have a Google account, create it
            const existingGoogleAccount = existingUser.accounts.some(
              (acc) => acc.provider === "google"
            )

            if (!existingGoogleAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                  type: "oauth",
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              })
            }
          } else {
            // If the user doesn't exist, create a new one with a Google account
            await prisma.user.create({
              data: {
                name: user.name,
                email: user.email,
                image: user.image,
                username: generateUsername(user.name),
                accounts: {
                  create: {
                    provider: "google",
                    providerAccountId: account.providerAccountId,
                    type: "oauth",
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                  },
                },
              },
            })
          }
        }
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },

    /**
     * Manages JWT token behavior
     */
    async jwt({ token, user, account }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        token.id = user!.id;
        return token;
      }

      if (!dbUser.username) {
        await prisma.user.update({
          where: {
            id: dbUser.id,
          },
          data: {
            username: dbUser.name?.split(" ").join("").toLowerCase(),
          },
        });
      }
      
      // Store access token for Google Calendar access
      if (account && account.provider === 'google') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        username: dbUser.username,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        accessTokenExpires: token.accessTokenExpires
      };
    },

    /**
     * Handles session updates
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
        
        // Add Google calendar token if available
        if (token.accessToken) {
          session.accessToken = token.accessToken;
        }
      }
      return session;
    },
  },

  /**
   * Custom authentication pages
   */
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  /**
   * Debugging & Session Strategy
   */
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}