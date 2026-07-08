'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MpesaPaymentModal from '@/components/MpesaPaymentModal'

const PLANS = [
  { id: '1week', label: '1 Week', duration: 7, amount: 100, billing_cycle: 'weekly', popular: false },
  { id: '1month', label: '1 Month', duration: 30, amount: 10, billing_cycle: 'monthly', popular: true },
  { id: '3months', label: '3 Months', duration: 90, amount: 900, billing_cycle: 'quarterly', popular: false, save: 'Save KSh 150' },
  { id: '6months', label: '6 Months', duration: 180, amount: 1500, billing_cycle: 'biannual', popular: false, save: 'Save KSh 600' },
  { id: '1year', label: '1 Year', duration: 365, amount: 2500, billing_cycle: 'yearly', popular: false, save: 'Save KSh 1,700' },
]

interface SubscriptionPlansProps {
  userId: string
  userPhone: string
  isPro: boolean
  onSuccess?: () => void
}

export default function SubscriptionPlans({ userId, userPhone, isPro, onSuccess }: SubscriptionPlansProps) {
  const supabase = createClient()
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentSub, setCurrentSub] = useState<any>(null)

  useEffect(() => {
    loadCurrentSubscription()
  }, [])

  const loadCurrentSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single()

    if (data) setCurrentSub(data)
  }

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleSuccess = () => {
    loadCurrentSubscription()
    if (onSuccess) onSuccess()
  }

  // Check if subscription is still valid
  const isActiveAndValid = isPro && currentSub && new Date(currentSub.expires_at) > new Date()
  const daysRemaining = currentSub
    ? Math.ceil((new Date(currentSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  // Show plans only if expired or expiring within 7 days
  const showPlans = !isActiveAndValid || daysRemaining <= 7

  return (
    <div>
      {/* Current subscription status */}
      {isPro && currentSub && (
        <div className={`mb-6 p-4 rounded-xl border ${
          daysRemaining <= 7
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <svg className={`w-5 h-5 ${daysRemaining <= 7 ? 'text-amber-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className={`font-bold ${daysRemaining <= 7 ? 'text-amber-700' : 'text-green-700'}`}>
              Active Pro Subscription
            </p>
          </div>
          <p className={`text-sm ${daysRemaining <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
            Expires: {new Date(currentSub.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            {daysRemaining <= 7 && daysRemaining > 0 && (
              <span className="ml-2 font-semibold">⚠️ Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}!</span>
            )}
          </p>
        </div>
      )}

      {showPlans ? (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isActiveAndValid && daysRemaining <= 7
              ? 'Renew Before Expiry'
              : isPro
              ? 'Renew Subscription'
              : 'Choose a Subscription Plan'}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Unlock unlimited task applications with a KaziHub Pro subscription.
          </p>

          <div className="space-y-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  plan.popular
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{plan.label}</p>
                    {plan.save && (
                      <p className="text-xs text-green-600 font-semibold">{plan.save}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">KSh {plan.amount.toLocaleString()}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan) }}
                      className={`mt-1 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-800 text-white hover:bg-gray-900'
                      }`}
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">
            Your subscription is active for <strong>{daysRemaining} more days</strong>.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Renewal options will appear when your subscription is within 7 days of expiring.
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlan && (
        <MpesaPaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          amount={selectedPlan.amount}
          type="subscription"
          title="KaziHub Pro Subscription"
          description={`Pay KSh ${selectedPlan.amount.toLocaleString()} via MPesa for ${selectedPlan.label} unlimited applications.`}
          defaultPhone={userPhone}
        />
      )}
    </div>
  )
}
