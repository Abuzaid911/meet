import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Providers } from './providers'
import { NavBar } from './components/nav-bar'
import { ToastProvider } from './components/ui/use-toast'

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
            <div className="flex flex-col min-h-screen">
              <header className="bg-primary text-primary-foreground p-4">
                <div className="container mx-auto flex justify-between items-center">
                  <Link href="/" className="text-2xl font-bold">Social Scheduler</Link>
                  <NavBar />
                </div>
              </header>
              <main className="flex-grow container mx-auto p-4">
                {children}
              </main>
              <footer className="bg-muted p-4 text-center">
                <p>&copy; 2023 Social Scheduler</p>
              </footer>
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}

