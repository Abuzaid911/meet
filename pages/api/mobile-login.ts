// pages/api/mobile-login.ts

import { type NextApiRequest, type NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken } = req.body;

  // OPTIONAL: Verify the idToken using Google's API or firebase-admin here

  // Create a user session manually or respond with token and user info
  // In reality, NextAuth doesn't support programmatic login on the server from mobile

  return res.status(200).json({
    token: idToken, // or a JWT you issue
    user: {
      name: 'Sample',
      email: 'sample@gmail.com',
      image: 'https://...',
    },
  });
}