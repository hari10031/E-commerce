'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const addressSchema = z.object({
  line1: z.string().min(5, 'Address must be at least 5 characters'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
})

export type AddressFormData = z.infer<typeof addressSchema>

interface SavedAddress {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void
  savedAddresses?: SavedAddress[]
  defaultValues?: Partial<AddressFormData>
  isLoading?: boolean
}

export function AddressForm({ onSubmit, savedAddresses = [], defaultValues, isLoading }: AddressFormProps) {
  const [selectedSavedId, setSelectedSavedId] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues ?? {},
  })

  function selectSavedAddress(addr: SavedAddress) {
    setSelectedSavedId(addr.id)
    setValue('line1', addr.line1)
    setValue('line2', addr.line2 ?? '')
    setValue('city', addr.city)
    setValue('state', addr.state)
    setValue('pincode', addr.pincode)
  }

  // Prefill with the saved address so returning customers don't retype.
  React.useEffect(() => {
    if (!defaultValues && savedAddresses.length > 0 && selectedSavedId === null) {
      selectSavedAddress(savedAddresses[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses])

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors',
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-neutral-200 focus:ring-brand/15 focus:border-brand'
    )

  return (
    <div className="space-y-6">
      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Addresses</h3>
          <div className="space-y-2">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => selectSavedAddress(addr)}
                className={cn(
                  'w-full text-left p-3.5 rounded-xl border text-sm transition-colors',
                  selectedSavedId === addr.id
                    ? 'border-brand bg-brand-soft'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <p className="font-medium text-ink">{addr.line1}</p>
                {addr.line2 && <p className="text-neutral-500">{addr.line2}</p>}
                <p className="text-neutral-500">
                  {addr.city}, {addr.state} – {addr.pincode}
                </p>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or enter a new address</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('line1')}
            placeholder="House no., Street name"
            className={inputClass(!!errors.line1)}
          />
          {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            {...register('line2')}
            placeholder="Apartment, Area, Landmark"
            className={inputClass(false)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              {...register('city')}
              placeholder="City"
              className={inputClass(!!errors.city)}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              {...register('state')}
              placeholder="State"
              className={inputClass(!!errors.state)}
            />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>
        </div>

        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            {...register('pincode')}
            placeholder="6-digit pincode"
            maxLength={6}
            className={inputClass(!!errors.pincode)}
          />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors',
            'bg-ink hover:bg-brand',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? 'Saving...' : 'Continue to Payment'}
        </button>
      </form>
    </div>
  )
}
