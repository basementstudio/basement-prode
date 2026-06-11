import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PRODE/BASEMENT — World Cup 2026',
  description: 'Internal prediction pool for World Cup 2026. Basement crew only.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-[#000000]`}
    >
      <body className="font-sans antialiased min-h-screen text-[#EBEBEB]">
        {children}
      </body>
    </html>
  )
}
