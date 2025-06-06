'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorContent />
    </Suspense>
  )
}

function ErrorContent() {
  const searchParams = useSearchParams()

  // Handle the case where searchParams might be null
  if (!searchParams) {
    return <p>Loading...</p>; // Or some other fallback UI
  }

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>{searchParams.get('error') || 'An unknown error occurred.'}</p>
    </div>
  )
}