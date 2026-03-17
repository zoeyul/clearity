import { LoginForm } from "@/components/auth/login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Same teal background as dashboard */}
      <div className="absolute inset-0 bg-[#f0f4f4] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d0e4e4]/50 blur-[120px] dark:bg-[#2a4040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#c8dede]/45 blur-[120px] dark:bg-[#253838]/15" />

      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  )
}
