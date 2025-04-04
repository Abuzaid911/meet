"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();

  // Redirect to the events page with a query parameter to open the add event modal
  useEffect(() => {
    // We need to use router.push to navigate to the events page
    // and we'll handle opening the modal in the events page component
    router.push("/events?openAddEventModal=true");
  }, [router]);

  // Show a loading indicator while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <span className="ml-2 text-gray-500">Redirecting to create event form...</span>
    </div>
  );
}