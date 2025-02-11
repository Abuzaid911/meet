import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"

// Extend the built-in Session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

/**
 * Generates a unique username from a name by removing spaces, converting to lowercase,
 * and adding a random number
 */
function generateUsername(name: string): string {
  // Remove any special characters and spaces, convert to lowercase
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

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials")
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" && user.email) {
          if (!user.name) {
            console.error("User name is missing from Google profile")
            return false
          }

          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              // Update name and image if they've changed in Google profile
              name: user.name,
              image: user.image,
            },
            create: {
              name: user.name,
              email: user.email,
              image: user.image,
              username: generateUsername(user.name),
            },
          })
        }
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub

        // Ensure username is always available in session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true },
        })

        if (dbUser) {
          session.user.name = dbUser.username
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

