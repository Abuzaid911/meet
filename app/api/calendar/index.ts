import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Initialize Google Calendar API client with user's OAuth credentials
 */
export async function getGoogleCalendarClient() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    throw new Error('No access token available');
  }
  
  // Create OAuth client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
  
  // Set token
  oauth2Client.setCredentials({
    access_token: session.accessToken,
  });
  
  // Return calendar client
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Generate colors for calendar events based on calendar ID
 */
export function getEventColor(colorId: string | null | undefined, source = 'app') {
  // Google Calendar color mapping
  const googleColors: Record<string, string> = {
    '1': '#4285F4', // Blue
    '2': '#33B679', // Green
    '3': '#F4511E', // Orange/Red
    '4': '#8E24AA', // Purple
    '5': '#E67C73', // Red/Pink
    '6': '#F6BF26', // Yellow
    '7': '#039BE5', // Light Blue
    '8': '#0B8043', // Dark Green
    '9': '#7986CB', // Light Purple
    '10': '#616161', // Gray
    '11': '#3F51B5', // Indigo
  };
  
  if (source === 'google' && colorId && googleColors[colorId]) {
    return googleColors[colorId];
  }
  
  // Default colors
  if (source === 'app') {
    return '#14b8a6'; // Teal
  } else if (source === 'apple') {
    return '#FF3B30'; // Apple Calendar Red
  } else {
    return '#4F46E5'; // Indigo
  }
} 