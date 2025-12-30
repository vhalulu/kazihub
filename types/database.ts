export type UserType = 'client' | 'tasker' | 'both'

export type TaskCategory =
  | 'cleaning'
  | 'delivery'
  | 'handyman'
  | 'plumbing'
  | 'electrical'
  | 'painting'
  | 'moving'
  | 'gardening'
  | 'tech_support'
  | 'tutoring'
  | 'other'

export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export interface Profile {
  id: string
  full_name: string
  phone_number: string
  user_type: UserType
  avatar_url: string | null
  county: string | null
  town: string | null
  bio: string | null
  rating: number
  total_tasks_completed: number
  total_earned: number
  available_balance: number
  is_verified: boolean
  is_pro_tasker: boolean
  is_business_account: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  client_id: string
  title: string
  description: string
  category: TaskCategory
  budget: number
  county: string
  town: string | null
  specific_location: string | null
  is_urgent: boolean
  has_insurance: boolean
  status: TaskStatus
  assigned_tasker_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}