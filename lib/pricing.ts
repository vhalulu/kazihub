export const PRICING = {
  // NO COMMISSION!
  commission: {
    rate: 0,
    calculateFee: () => 0
  },

  // Premium features
  features: {
    urgentTask: 200,         // Push notifications + priority
    taskInsurance: 150,      // Protection for both parties
    verifiedBadge: 1500,     // One-time verification
  },

  // Subscriptions
  subscriptions: {
    taskerPro: {
      monthly: 500,
      annual: 5000,
      benefits: [
        'Unlimited task applications',
        'Priority in search results',
        'Featured Pro badge',
        'Advanced analytics',
        'Early access to tasks'
      ]
    },
    businessAccount: {
      monthly: 2000,
      benefits: [
        'Post unlimited tasks',
        'Team member access',
        'Dedicated support',
        'Custom invoicing',
        'Priority customer service'
      ]
    }
  },

  minimums: {
    taskBudget: 100,
    withdrawal: 500
  }
}

// Calculate what client pays
export function calculateTaskPayment(
  taskAmount: number,
  options: {
    isUrgent?: boolean
    hasInsurance?: boolean
  } = {}
) {
  const urgentFee = options.isUrgent ? PRICING.features.urgentTask : 0
  const insuranceFee = options.hasInsurance ? PRICING.features.taskInsurance : 0
  const totalAmount = taskAmount + urgentFee + insuranceFee

  return {
    taskAmount,
    urgentFee,
    insuranceFee,
    totalAmount,
    taskerReceives: taskAmount, // 100% of task budget!
  }
}