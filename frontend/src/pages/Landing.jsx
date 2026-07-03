import { Link } from 'react-router-dom'
import { QrCode, Link2, BarChart3, Zap, Repeat } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <QrCode className="w-7 h-7" /> Rentabout
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
          <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
          <Link to="/login?signup=1" className="btn-primary text-sm">Start Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 text-yellow-300" /> Free to start · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            Dynamic QR Codes &<br />URL Shortener
          </h1>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            Create short links and QR codes you can update anytime — without reprinting.
            Track every scan with real-time analytics.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login?signup=1"
              className="bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-base">
              Create Free Account →
            </Link>
            <Link to="/pricing"
              className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Link2, title: 'URL Shortener', desc: 'Turn long links into short, shareable URLs. Track clicks with country, device, and browser breakdown.' },
              { icon: QrCode, title: 'Dynamic QR Codes', desc: 'QR codes that update without reprinting. Change the destination URL anytime from your dashboard.' },
              { icon: BarChart3, title: 'Click Analytics', desc: 'See who scans and clicks: device type, browser, country, referrer — all in one place.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How dynamic QR codes work</h2>
          <p className="text-gray-500 mb-12">The QR image stays the same. Only the destination changes.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Shorten your URL', desc: 'Paste any long URL — get a short redirect link' },
              { step: '2', title: 'Generate a QR code', desc: 'Create a QR that encodes your short link' },
              { step: '3', title: 'Update anytime', desc: 'Change the destination without touching the QR image' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="card text-center">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start for free today</h2>
        <p className="text-gray-500 mb-8">20 short URLs · 5 QR codes · No credit card needed</p>
        <Link to="/login?signup=1" className="btn-primary text-base px-8 py-3">
          Create Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 font-semibold text-gray-700 mb-2">
          <QrCode className="w-5 h-5 text-indigo-600" /> Rentabout
        </div>
        <p>© {new Date().getFullYear()} Rentabout · Built with ❤️ in India</p>
      </footer>
    </div>
  )
}

