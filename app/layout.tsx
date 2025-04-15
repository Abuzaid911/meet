import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from './components/ui/toaster'
import { ToastProvider } from './components/ui/use-toast'
import { NavBar } from './components/nav-bar'
import { Providers } from './providers'
import { Footer } from './components/footer'

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
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        {/* Add meta tags for iOS splash screens/icons if needed */}
      </head>
      <body className={`${inter.className} flex flex-col min-h-full`}>
        <Providers>
          <ToastProvider>
            <NavBar />
            <main className={`flex-grow min-h-screen flex-col px-8 py-14 md:py-16 md:px-24 ${inter.className}`}>
              {children}
            </main>
            <Toaster />
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}