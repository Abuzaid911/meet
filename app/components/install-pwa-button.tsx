'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setIsInstallable(true); // Indicate the app is installable
      console.log("'beforeinstallprompt' event fired");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Optional: Listen for app installed event to maybe hide the button
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstallable(false);
      setInstallPromptEvent(null);
      // Optionally hide the button or give feedback
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      console.log('Install prompt event not available');
      return;
    }
    try {
      await installPromptEvent.prompt();
      console.log('Install prompt shown');
      // Wait for the user to respond to the prompt
      const { outcome } = await installPromptEvent.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, it can't be used again.
      setInstallPromptEvent(null);
      setIsInstallable(false); // Hide button after prompt
    } catch (error) {
      console.error('Error showing install prompt:', error);
      // Handle error (e.g., prompt couldn't be shown)
      setIsInstallable(false); // Hide button if prompt fails
      setInstallPromptEvent(null);
    }
  };

  // Only render the button if the app is installable
  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="hidden sm:inline-flex gap-2 items-center border-primary text-primary hover:bg-primary/10 hover:text-primary"
      aria-label="Install App"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
} 