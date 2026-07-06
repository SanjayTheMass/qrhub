import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import PricingCard from '../components/PricingCard'
import { useAuth } from '../contexts/AuthContext'

const FREE_FEATURES = ['20 short URLs', '5 dynamic QR codes', '7-day click analytics', 'Standard short codes', 'PNG QR download']
const PRO_FEATURES  = ['Unlimited URLs', 'Unlimited QR codes', '1-year analytics', 'Custom slugs', 'URL expiry dates', 'Logo inside QR code', 'Priority support']

export default function Pricing() {
  const [billing, setBilling] = useState('monthly')
  const { user } = useAuth()
  const isTestMode = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').startsWith('rzp_test_')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <QrCode className="w-7 h-7" /> QrHub
          </Link>
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
              <Link to="/login?signup=1" className="btn-primary text-sm">Start Free</Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 text-lg mb-8">Start free. Upgrade when your audience grows.</p>
          <div className="inline-flex items-center bg-gray-200 rounded-xl p-1">
            {['monthly', 'yearly'].map((b) => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billing === b ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {b === 'monthly' ? 'Monthly' : 'Yearly  🎉 Save 33%'}
              </button>
            ))}
          </div>
        </div>

        {isTestMode && (
          <div className="max-w-3xl mx-auto mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold mb-2">🧪 Razorpay Test Mode — no real money is charged</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>
                <strong>UPI (recommended):</strong> choose UPI → click <em>Enter UPI ID</em> → type{' '}
                <code className="bg-white/60 px-1.5 py-0.5 rounded">success@razorpay</code>
              </li>
              <li>
                <strong>Card (Mastercard):</strong>{' '}
                <code className="bg-white/60 px-1.5 py-0.5 rounded">5267 3181 8797 5449</code> · any future expiry · CVV{' '}
                <code className="bg-white/60 px-1.5 py-0.5 rounded">123</code>
              </li>
              <li>
                <strong>Card (Visa India):</strong>{' '}
                <code className="bg-white/60 px-1.5 py-0.5 rounded">4386 2894 0766 0153</code>
              </li>
              <li>
                <strong>Do NOT scan</strong> the UPI QR with your own UPI app — Razorpay blocks self-payment in test mode.
              </li>
            </ul>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <PricingCard name="Free" price={0} billing={billing} features={FREE_FEATURES}
            cta="Get Started Free" ctaLink="/login?signup=1" plan={null} />
          <PricingCard name="Pro" price={billing === 'monthly' ? 499 : 3999}
            billing={billing} features={PRO_FEATURES}
            cta={user ? 'Upgrade to Pro' : 'Start Pro'}
            plan={billing === 'monthly' ? 'pro_monthly' : 'pro_yearly'}
            highlighted />
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">
          All payments processed securely via Razorpay · Cancel anytime · Indian billing (INR)
        </p>
      </div>
    </div>
  )
}

