import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

// Define user type
interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
}

// Define our token interface matching the actual structure
interface Token {
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  username?: string | null;
}

// Define Session interface matching better-auth
interface SessionType {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
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

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Assuming PostgreSQL based on PrismaClient import
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["openid", "email", "profile"],
    },
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
  },
  jwt: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // Custom user creation hook to handle username generation
    onUserCreated: async ({ user }: { user: User }) => {
      if (user.name && !user.username) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: generateUsername(user.name) }
        });
      }
      return user;
    },
    // Custom session handling
    session: ({ session, token }: { session: SessionType, token: Token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
      }
      return session;
    }
  }
});