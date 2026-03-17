"use client"

import { useState } from "react"
import { Button } from "@clearity/ui"
import { Sparkles } from "lucide-react"
import { createClient } from "@clearity/lib"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="glass p-8">
      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
        <div className="glass-solid flex h-14 w-14 items-center justify-center !rounded-2xl">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            Clearity
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Clear your mind, find your clarity
          </p>
        </div>
      </div>

      {/* Google Login */}
      <div className="relative z-10">
        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}
        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
          className="glass-interactive w-full !rounded-2xl h-12 gap-3 text-zinc-700 dark:text-zinc-300 !border-white/20 text-base"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLoading ? "Connecting..." : "Continue with Google"}
        </Button>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-6 text-center text-xs text-zinc-400">
        By continuing, you agree to our Terms of Service
      </p>
    </div>
  )
}
