import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Create a wrapper function around the default auth handler
const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error) {
    console.error("Auth POST error:", error);
    
    // If the error is related to verification token, provide a more specific message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("verification") && errorMessage.includes("token")) {
      return NextResponse.json(
        { 
          error: "Authentication service temporarily unavailable",
          details: "Please try again in a few moments"
        }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
} 