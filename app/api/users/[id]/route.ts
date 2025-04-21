// app/api/users/[id]/route.ts
import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params; // Awaiting the params Promise
    const session = await auth.api.getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        events: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 5,
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine friendship status
    let friendStatus: "none" | "pending" | "friends" = "none";

    const friendship = await prisma.user.findFirst({
      where: {
        id: currentUserId,
        friends: { some: { id: userId } },
      },
    });

    if (friendship) {
      friendStatus = "friends";
    } else {
      const pendingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
          status: "pending",
        },
      });

      if (pendingRequest) {
        friendStatus = "pending";
      }
    }

    return NextResponse.json({ ...user, friendStatus });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Error fetching user profile" },
      { status: 500 }
    );
  }
}