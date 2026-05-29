'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Truck, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import { BrandLogo } from '@/components/brand/BrandLogo'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const PERKS = [
  { icon: Truck, text: 'Complimentary shipping above ₹999' },
  { icon: ShieldCheck, text: 'Authentic, directly-sourced weaves' },
  { icon: Sparkles, text: 'Early access to new collections' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    try {
      const res = await api.post<{
        token: string
        refreshToken: string
        user: { id: string; name: string; email: string; role: string }
      }>('/api/auth/login', data)
      // Storefront is customer-only — staff must use the admin app.
      if (res.user.role !== 'customer') {
        toast({
          title: 'Staff accounts can’t sign in here',
          description: `This store is for shopping. Please use the ${BRAND.name} admin app.`,
          variant: 'destructive',
        })
        return
      }
      setAuth(res.token, res.refreshToken, res.user)
      toast({ title: `Welcome back, ${res.user.name.split(' ')[0]}!` })
      router.push('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast({ title: 'Login failed', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors',
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-neutral-200 focus:ring-brand/15 focus:border-brand'
    )

  return (
    <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-101px)]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[var(--color-ink)] text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />
        <div className="relative">
          <BrandLogo href={undefined} showTagline={false} imageClassName="h-11 brightness-110" />
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/40 mt-2">{BRAND.tagline}</p>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-semibold font-[var(--font-display)] leading-tight">
            Timeless weaves,
            <br />
            <span className="text-[var(--color-gold)]">delivered with care.</span>
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-sm leading-relaxed">
            Sign in to continue your journey through India&apos;s finest sarees,
            designer ensembles, and temple-gold jewellery.
          </p>
          <div className="gold-rule w-20 my-7" />
          <ul className="space-y-3.5">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                <Icon className="h-4 w-4 text-[var(--color-gold)] shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/30">
          &copy; {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-8 sm:py-12 bg-cream pb-safe">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-6 sm:mb-8">
            <p className="eyebrow">Welcome Back</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
              Sign in to your account
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(inputClass(!!errors.password), 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors',
                  'bg-ink hover:bg-brand',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand font-semibold hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
