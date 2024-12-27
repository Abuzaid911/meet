import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in callback. User:', user, 'Account:', account, 'Profile:', profile)
      if (account?.provider === "google") {
        return profile?.email_verified && profile?.email?.endsWith("@gmail.com")
      }
      return true
    },
    async session({ session, user }) {
      console.log('Session callback. Session:', session, 'User:', user)
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback. Token:', token, 'User:', user, 'Account:', account, 'Profile:', profile)
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
  logger: {
    error: (code, metadata) => {
      console.error('NextAuth error:', code, metadata)
    },
    warn: (code) => {
      console.warn('NextAuth warning:', code)
    },
    debug: (code, metadata) => {
      console.log('NextAuth debug:', code, metadata)
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

