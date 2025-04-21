'use client';

import Image from 'next/image';
import { createAuthClient } from 'better-auth/react';

const { signIn } = createAuthClient();

export default function GoogleButton() {
  return (
    <button
      onClick={() => signIn.social({ provider: 'google' })}
      className="flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-6 py-3 hover:shadow-md transition"
    >
      <Image src="/images/google.png" alt="Google" width={20} height={20} />
      <span className="text-base font-medium text-gray-800">Sign in with Google</span>
    </button>
  );
}