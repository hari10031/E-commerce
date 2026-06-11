'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Gift, Heart, PackageCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import { BrandLogo } from '@/components/brand/BrandLogo'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterFormData = z.infer<typeof registerSchema>

const PERKS = [
  { icon: Heart, text: 'Save favourites to your wishlist' },
  { icon: PackageCheck, text: 'Track every order in real time' },
  { icon: Gift, text: 'Member-only offers & coupons' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormData) {
    setLoading(true)
    try {
      // Backend returns the raw Supabase shape: { user, session }.
      const res = await api.post<{
        user?: { id: string; email?: string }
        session?: { access_token: string; refresh_token: string } | null
      }>('/api/auth/register', { ...data, role: 'customer' })

      if (res.session?.access_token && res.user) {
        setAuth(res.session.access_token, res.session.refresh_token, {
          id: res.user.id,
          name: data.name,
          email: data.email,
          role: 'customer',
        })
        toast({ title: `Welcome to ${BRAND.name}, ${data.name.split(' ')[0]}!` })
        router.push('/')
      } else {
        // No session — Supabase requires email confirmation before sign-in.
        toast({
          title: 'Account created',
          description: 'Check your email to confirm your account, then sign in.',
        })
        router.push('/login')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast({ title: 'Registration failed', description: msg, variant: 'destructive' })
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
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />
        <div className="relative">
          <BrandLogo href={undefined} showTagline={false} imageClassName="h-11 brightness-110" />
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/40 mt-2">{BRAND.tagline}</p>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-semibold font-[var(--font-display)] leading-tight">
            Join a community
            <br />
            <span className="text-[var(--color-gold)]">that loves heritage.</span>
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-sm leading-relaxed">
            Create your account to shop curated collections, save your favourites,
            and enjoy a seamless checkout every time.
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
          <div className="text-center mb-8">
            <p className="eyebrow">Get Started</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
              Create your account
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Your name"
                  className={inputClass(!!errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={inputClass(!!errors.phone)}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
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
                  'w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors mt-2',
                  'bg-ink hover:bg-brand',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
