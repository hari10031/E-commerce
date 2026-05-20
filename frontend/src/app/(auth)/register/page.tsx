'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'employee']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: RegisterFormData) {
    setLoading(true)
    try {
      const res = await api.post<{
        token?: string
        user?: { id: string; name: string; email: string; role: string }
        message?: string
        pending?: boolean
      }>('/api/auth/register', data)

      if (data.role === 'employee' || res.pending) {
        setPendingApproval(true)
        return
      }

      if (res.token && res.user) {
        setAuth(res.token, res.user)
        toast({ title: `Welcome to NanaBanana, ${res.user.name.split(' ')[0]}!` })
        router.push('/')
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
      'w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors',
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-gray-300 focus:ring-[oklch(0.60_0.22_35)]/30 focus:border-[oklch(0.60_0.22_35)]'
    )

  if (pendingApproval) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-orange-50/40">
        <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your employee account is pending admin approval. You&apos;ll receive an email once it&apos;s approved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white rounded-lg text-sm font-semibold hover:bg-[oklch(0.50_0.22_35)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-orange-50/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-2 text-sm">Join NanaBanana today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Your name"
                className={inputClass(!!errors.name)}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={inputClass(!!errors.email)}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                className={inputClass(!!errors.phone)}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['customer', 'employee'] as const).map((role) => (
                  <label
                    key={role}
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors',
                      selectedRole === role
                        ? 'border-[oklch(0.60_0.22_35)] bg-orange-50 text-[oklch(0.42_0.20_35)]'
                        : 'border-gray-200 hover:border-gray-400 text-gray-600'
                    )}
                  >
                    <input
                      {...register('role')}
                      type="radio"
                      value={role}
                      className="accent-[oklch(0.60_0.22_35)]"
                    />
                    <span className="font-medium capitalize">{role}</span>
                  </label>
                ))}
              </div>
              {selectedRole === 'employee' && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded p-2">
                  Employee accounts require admin approval before you can login.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors mt-2',
                'bg-[oklch(0.60_0.22_35)] hover:bg-[oklch(0.50_0.22_35)]',
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

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[oklch(0.60_0.22_35)] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
