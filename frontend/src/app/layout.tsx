import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'DevBlog – Share Your Knowledge',
  description: 'A modern blogging platform for developers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 py-8 mt-16">
            <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
              <p>© {new Date().getFullYear()} DevBlog. Built with Next.js &amp; Go.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
