// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma" // Use the prisma singleton

function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000).toString()
}

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
    async signIn({ user, account, profile }) {
      // Allow sign in if the user exists or if it's a new account
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true }
        })

        // If user doesn't exist, create a new one
        if (!existingUser && user.name) {
          const username = generateUsername(user.name)
          await prisma.user.create({
            data: {
              name: user.name,
              email: user.email!,
              image: user.image,
              username,
            },
          })
          return true
        }

        // If user exists but hasn't linked this OAuth account yet
        if (existingUser && existingUser.accounts.length === 0) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          })
          return true
        }

        // Allow sign in if the account is already linked
        return true
      }

      return true
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }