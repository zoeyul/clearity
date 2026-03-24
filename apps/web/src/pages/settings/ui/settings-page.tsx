"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Label } from "@clearity/ui"
import { LeftSidebar } from "@/shared/ui/left-sidebar"
import { MobileSidebar } from "@/shared/ui/mobile-sidebar"
import { useChatHistory } from "@/shared/lib/use-chat-history"
import { useNewSession } from "@/shared/lib/use-new-session"
import { createClient } from "@clearity/lib"
import { Key, Eye, EyeOff, Check, Trash2, UserCircle } from "lucide-react"
import { Textarea } from "@clearity/ui"

export function SettingsPage() {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const supabase = createClient()
  const [aboutMe, setAboutMe] = useState("")
  const [aboutSaved, setAboutSaved] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const storedKey = localStorage.getItem("clearity-api-key")
    if (storedKey) setApiKey(storedKey)
    const storedAbout = localStorage.getItem("clearity-about-me")
    if (storedAbout) setAboutMe(storedAbout)
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("clearity-api-key", apiKey.trim())
    } else {
      localStorage.removeItem("clearity-api-key")
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleNewSession = useNewSession()

  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        <main className="flex-1 min-w-0 h-full">
          <div className="glass flex flex-col h-full !rounded-3xl p-8 overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
              <MobileSidebar />
              <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Settings</h1>
            </div>

            {/* About Me */}
            <div className="glass-subtle !rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">About Me</h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Tell Clara about yourself — your role, goals, what you're working through. This context is included in every conversation for more relevant responses.
              </p>
              <Textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="e.g. I'm a software developer dealing with career transition thoughts. I tend to overthink decisions and want help organizing my priorities..."
                rows={10}
                className="glass-subtle !rounded-xl bg-transparent border-0 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 resize-none mb-3"
              />
              <Button
                onClick={() => {
                  if (aboutMe.trim()) {
                    localStorage.setItem("clearity-about-me", aboutMe.trim())
                  } else {
                    localStorage.removeItem("clearity-about-me")
                  }
                  setAboutSaved(true)
                  setTimeout(() => setAboutSaved(false), 2000)
                }}
                className="glass-solid !rounded-xl w-fit gap-2"
              >
                {aboutSaved ? <Check className="h-4 w-4" /> : null}
                {aboutSaved ? "Saved!" : "Save"}
              </Button>
            </div>

            {/* API Key Section */}
            <div className="glass-subtle !rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Gemini API Key</h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Get your free API key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  Google AI Studio
                </a>
                . Your key is stored locally and never sent to our servers.
              </p>

              <div className="flex flex-col gap-3">
                <Label htmlFor="apiKey" className="text-xs text-zinc-600 dark:text-zinc-300">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="glass-subtle !rounded-xl h-11 bg-transparent border-0 pr-10 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleSave}
                  className="glass-solid !rounded-xl w-fit gap-2"
                >
                  {saved ? <Check className="h-4 w-4" /> : null}
                  {saved ? "Saved!" : "Save Key"}
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="glass-subtle !rounded-2xl p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Trash2 className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Delete Account</h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                This will permanently delete your account and all conversation data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="!rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
                >
                  Delete My Account
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-red-500 font-medium">Are you sure? All your data will be permanently deleted.</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setIsDeleting(true)
                        const res = await fetch("/api/account/delete", { method: "POST" })
                        if (res.ok) {
                          localStorage.removeItem("clearity-api-key")
                          await supabase.auth.signOut()
                          router.push("/login")
                        } else {
                          setIsDeleting(false)
                          setShowDeleteConfirm(false)
                        }
                      }}
                      disabled={isDeleting}
                      className="!rounded-xl bg-red-500 hover:bg-red-600 text-white"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete"}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="!rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
