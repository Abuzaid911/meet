import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create a custom handler that fixes verification issues
export async function customAuthHandler(req: NextRequest, { params }: { params: { betterauth: string[] } }) {
  // Check if it's a social sign-in request
  if (req.method === 'POST' && params.betterauth.includes('sign-in') && params.betterauth.includes('social')) {
    try {
      // Get the original handler from better-auth
      const originalHandler = toNextJsHandler(auth);
      
      // Call the original handler - use POST method
      try {
        const response = await originalHandler.POST(req);
        return response;
      } catch (error) {
        // Log the error for debugging
        console.log('Caught auth error, attempting to fix verification issue');
        
        // Extract the verification data from the request if possible
        const body = await req.json().catch(() => ({}));
        console.log('Request body:', body);
        
        // Try to create the verification record manually
        if (body.id && body.identifier && body.value) {
          try {
            // Create a verification record with the token field
            await prisma.$executeRaw`
              INSERT INTO verification (id, identifier, value, token, "expiresAt", "createdAt", "updatedAt")
              VALUES (
                ${body.id || ''},
                ${body.identifier || ''},
                ${body.value || ''},
                ${'placeholder_token'},
                ${new Date()},
                ${new Date()},
                ${new Date()}
              )
            `;
            
            console.log('Created verification record manually');
            
            // Try the auth request again
            const newRequest = new Request(req.url, {
              method: req.method,
              headers: req.headers,
              body: JSON.stringify(body),
            });
            
            return originalHandler.POST(newRequest);
          } catch (dbError) {
            console.error('Failed to create verification record manually:', dbError);
          }
        }
        
        // If we get here, we couldn't fix the issue, so throw the original error
        throw error;
      }
    } catch (error) {
      console.error('Error in custom auth handler:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  } else if (req.method === 'GET') {
    // For GET requests, use the original handler's GET method
    const originalHandler = toNextJsHandler(auth);
    return originalHandler.GET(req);
  }
  
  // For any other request types
  return NextResponse.json({ error: 'Method not supported' }, { status: 405 });
} 