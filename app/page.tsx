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
          <div className="flex gap-6 items-center">
            <Link href="#how-it-works" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="/login" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors">
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">

          {/* Hero Section */}
          <div className="text-center mb-20 space-y-8">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
              🇰🇪 Built for Kenya
            </span>

            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
                Kenya’s Most Trusted Marketplace
              </span>
              <br />
              <span className="text-gray-800">for Getting Tasks Done</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed space-y-3">
              <span className="block">
                KaziHub connects you with verified local taskers for cleaning, repairs, errands, and more — paid securely with M-Pesa after the work is done.
              </span>
              <span className="block">
                Post tasks or find work, complete jobs with confidence, and keep 100% of what you earn. No commissions. No hidden fees.
              </span>
            </p>

            <div className="flex gap-4 justify-center pt-6">
              <Link
                href="/signup"
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300"
              >
                Post a Task (Hire Help) →
              </Link>
              <Link
                href="/signup"
                className="px-10 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
              >
                Become a Tasker (Earn Money)
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <section id="how-it-works" className="mb-24">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Post a Task</h3>
                <p className="text-gray-600">
                  Describe what you need done, when, and where. Tasks can be anything from home services to professional support.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-cyan-100 text-cyan-700 rounded-xl flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Choose a Tasker</h3>
                <p className="text-gray-600">
                  Receive offers, compare prices and profiles, and select a verified tasker you trust.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Pay After Completion</h3>
                <p className="text-gray-600">
                  Pay securely with M-Pesa only after the task is completed to your satisfaction.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg"></div>
              <span className="font-bold text-gray-800">KaziHub</span>
            </div>

            <div className="flex gap-6 text-sm text-gray-600 font-semibold">
              <Link href="#" className="hover:text-blue-600">About</Link>
              <Link href="#" className="hover:text-blue-600">Safety & Trust</Link>
              <Link href="#" className="hover:text-blue-600">Terms</Link>
              <Link href="#" className="hover:text-blue-600">Privacy</Link>
              <Link href="#" className="hover:text-blue-600">Contact</Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} KaziHub. All rights reserved.
          </p>
        </div>
      </footer>

    </main>
  )
}
