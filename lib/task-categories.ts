// Organized Task Categories with Groups
export const TASK_CATEGORY_GROUPS = [
  {
    group: 'Home & Cleaning',
    icon: '🏠',
    categories: [
      { value: 'cleaning', label: 'Cleaning (Mama Fua)', icon: '🧹' },
      { value: 'deep_cleaning', label: 'Deep Cleaning', icon: '🧼' },
      { value: 'laundry', label: 'Laundry & Ironing', icon: '👕' },
      { value: 'organizing', label: 'Home Organizing', icon: '🗂️' },
    ]
  },
  {
    group: 'Repairs & Maintenance',
    icon: '🔧',
    categories: [
      { value: 'handyman', label: 'Handyman', icon: '🔧' },
      { value: 'plumbing', label: 'Plumbing', icon: '🚰' },
      { value: 'electrical', label: 'Electrical', icon: '💡' },
      { value: 'painting', label: 'Painting', icon: '🎨' },
      { value: 'carpentry', label: 'Carpentry & Woodwork', icon: '🪚' },
      { value: 'appliance_repair', label: 'Appliance Repair', icon: '🔌' },
      { value: 'tiling', label: 'Tiling & Masonry', icon: '🧱' },
      { value: 'roofing', label: 'Roofing', icon: '🏘️' },
    ]
  },
  {
    group: 'Transport & Delivery',
    icon: '🚚',
    categories: [
      { value: 'moving', label: 'Moving & Packing', icon: '🚚' },
      { value: 'delivery', label: 'Delivery & Errands', icon: '📦' },
      { value: 'shopping', label: 'Shopping & Groceries', icon: '🛒' },
      { value: 'courier', label: 'Courier Services', icon: '📬' },
      { value: 'driving', label: 'Driving Services', icon: '🚗' },
    ]
  },
  {
    group: 'Garden & Outdoor',
    icon: '🌳',
    categories: [
      { value: 'gardening', label: 'Gardening', icon: '🌱' },
      { value: 'landscaping', label: 'Landscaping', icon: '🌳' },
      { value: 'tree_cutting', label: 'Tree Cutting', icon: '🪓' },
      { value: 'waste_removal', label: 'Waste Removal', icon: '🗑️' },
    ]
  },
  {
    group: 'Tech & IT',
    icon: '💻',
    categories: [
      { value: 'tech_support', label: 'Tech Support', icon: '💻' },
      { value: 'phone_repair', label: 'Phone Repair', icon: '📱' },
      { value: 'computer_setup', label: 'Computer Setup', icon: '🖥️' },
      { value: 'software_help', label: 'Software Help', icon: '⚙️' },
    ]
  },
  {
    group: 'Education & Tutoring',
    icon: '📚',
    categories: [
      { value: 'tutoring', label: 'Tutoring', icon: '📚' },
      { value: 'homework_help', label: 'Homework Help', icon: '✏️' },
      { value: 'language_lessons', label: 'Language Lessons', icon: '🗣️' },
      { value: 'exam_prep', label: 'Exam Preparation', icon: '📝' },
    ]
  },
  {
    group: 'Care Services',
    icon: '🧒',
    categories: [
      { value: 'childcare', label: 'Childcare & Babysitting', icon: '🧒' },
      { value: 'elderly_care', label: 'Elderly Care', icon: '🧓' },
      { value: 'pet_care', label: 'Pet Care', icon: '🐕' },
      { value: 'house_sitting', label: 'House Sitting', icon: '🏠' },
    ]
  },
  {
    group: 'Events & Entertainment',
    icon: '🎉',
    categories: [
      { value: 'event_setup', label: 'Event Setup', icon: '🎉' },
      { value: 'catering_help', label: 'Catering Assistance', icon: '🍽️' },
      { value: 'decoration', label: 'Decoration', icon: '🎈' },
      { value: 'photography', label: 'Photography & Video', icon: '📸' },
    ]
  },
  {
    group: 'Automotive',
    icon: '🚗',
    categories: [
      { value: 'car_wash', label: 'Car Wash & Detailing', icon: '🚿' },
      { value: 'mechanic', label: 'Auto Repair', icon: '🛠️' },
    ]
  },
  {
    group: 'Professional Services',
    icon: '💼',
    categories: [
      { value: 'data_entry', label: 'Data Entry', icon: '⌨️' },
      { value: 'virtual_assistant', label: 'Virtual Assistant', icon: '🧑‍💼' },
      { value: 'accounting', label: 'Basic Accounting', icon: '📊' },
      { value: 'marketing', label: 'Marketing & Social Media', icon: '📣' },
      { value: 'graphic_design', label: 'Graphic Design', icon: '🎨' },
      { value: 'content_writing', label: 'Content Writing', icon: '📰' },
      { value: 'translation', label: 'Translation', icon: '🌍' },
    ]
  },
  {
    group: 'Construction',
    icon: '🏗️',
    categories: [
      { value: 'construction_help', label: 'Construction Labor', icon: '🏗️' },
    ]
  },
  {
    group: 'Security',
    icon: '🛡️',
    categories: [
      { value: 'security', label: 'Security & Night Watch', icon: '🛡️' },
    ]
  },
  {
    group: 'Beauty & Wellness',
    icon: '💅',
    categories: [
      { value: 'haircut', label: 'Haircut & Barber', icon: '💇‍♂️' },
      { value: 'salon', label: 'Salon & Beauty Services', icon: '💅' },
      { value: 'fitness', label: 'Fitness Training', icon: '💪' },
    ]
  },
  {
    group: 'Other',
    icon: '✨',
    categories: [
      { value: 'survey_tasks', label: 'Surveys & Fieldwork', icon: '📋' },
      { value: 'odd_jobs', label: 'Odd Jobs', icon: '🧩' },
      { value: 'other', label: 'Other', icon: '✨' },
    ]
  },
]

// Flat list for backward compatibility
export const TASK_CATEGORIES = TASK_CATEGORY_GROUPS.flatMap(group => 
  group.categories
)

// Helper to get category by value
export const getCategoryByValue = (value: string) => {
  return TASK_CATEGORIES.find(cat => cat.value === value)
}

// Helper to get category label
export const getCategoryLabel = (value: string) => {
  const cat = getCategoryByValue(value)
  return cat?.label || value
}

// Helper to get category icon
export const getCategoryIcon = (value: string) => {
  const cat = getCategoryByValue(value)
  return cat?.icon || '📋'
}

// Helper to get group for a category
export const getGroupForCategory = (value: string) => {
  return TASK_CATEGORY_GROUPS.find(group => 
    group.categories.some(cat => cat.value === value)
  )
}