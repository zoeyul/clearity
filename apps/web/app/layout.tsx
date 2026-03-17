import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" })
const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-kr",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Clearity - AI Counseling Dashboard",
  description:
    "Your personal AI-powered mental wellness companion for guided conversations and emotional insights",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${pretendard.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
