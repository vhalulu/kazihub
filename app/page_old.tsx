import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              KaziHub
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2.5 text-gray-700 hover:text-blue-600 font-semibold transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-20 space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                🇰🇪 Built for Kenya
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
                Kenya's Trusted Marketplace
              </span>
              <br />
              <span className="text-gray-800">for Local Tasks</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              KaziHub connects you with verified local taskers for cleaning, repairs, errands, and more — all paid securely with M-Pesa after the work is done.
Post tasks or find work, complete jobs with confidence, and keep 100% of what you earn. No commissions. No hidden fees.
            </p>

            <div className="flex gap-4 justify-center pt-6">
              <Link 
                href="/signup"
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300"
              >
                Post a Task →
              </Link>
              <Link 
                href="#how-it-works"
                className="px-10 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
              >
                Become a Tasker
              </Link>
            </div>
          </div>

          {/* Value Proposition Card */}
          <div className="mb-20">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 rounded-3xl p-12 shadow-2xl">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl -mr-36 -mt-36"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -ml-48 -mb-48"></div>
              
              <div className="relative z-10 text-center space-y-6">
                <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <p className="text-6xl">💰</p>
                </div>
                <h2 className="text-5xl font-bold text-white">
                  Keep 100% of Your Earnings
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                  No commissions. No hidden fees. Taskers keep every shilling they earn. We make money from premium features — not your hard work.
                </p>
                <div className="flex gap-8 justify-center pt-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white mb-1">0%</p>
                    <p className="text-blue-200">Commission</p>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white mb-1">100%</p>
                    <p className="text-blue-200">Your Money</p>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white mb-1">Ksh 0</p>
                    <p className="text-blue-200">Hidden Fees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            
            {/* For Clients */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <span className="text-3xl">💼</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Clients</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Post any task — from home services to professional support. Get multiple quotes, choose the best tasker, and pay securely with M-Pesa after task completion.
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  <span>Post a task</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
            
            {/* For Taskers */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-cyan-200">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Taskers</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Browse available tasks in your area. Apply with your price. Complete the work. Get paid instantly. Keep 100% of earnings.
                </p>
                <div className="flex items-center text-cyan-600 font-semibold group-hover:gap-2 transition-all">
                  <span>Find work</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
            
            {/* Built for Kenya */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <span className="text-3xl">🇰🇪</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Kenya</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  M-Pesa integration. All 47 counties. Local customer support. Fair pricing. Designed for Kenyan needs.
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  <span>See coverage</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform">
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">0%</p>
                <p className="text-gray-600 font-semibold">Platform Fee</p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">24/7</p>
                <p className="text-gray-600 font-semibold">Support</p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <p className="text-5xl mb-2">🔒</p>
                <p className="text-gray-600 font-semibold">Secure Payments</p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">47</p>
                <p className="text-gray-600 font-semibold">Counties</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}