import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from './components/ui/toaster'
import { ToastProvider } from './components/ui/use-toast'
import { NavBar } from './components/nav-bar'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Social Scheduler',
  description: 'Schedule meetings and events with your friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <NavBar />
            <main className={`min-h-screen flex-col px-8 py-14 md:py-16 md:px-24 ${inter.className}`}>
              {children}
            </main>
            <Toaster />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}