import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

// Define a schema for user creation
const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  bio: z.string().optional(),
})

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userCreateSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { username: validatedData.username }],
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: validatedData,
    })
    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error creating user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const deletedUser = await prisma.user.delete({ where: { id } });
    return NextResponse.json(deletedUser);
  } catch {
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const updatedUser = await prisma.user.update({ where: { id }, data });
    return NextResponse.json(updatedUser);
  } catch {
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

