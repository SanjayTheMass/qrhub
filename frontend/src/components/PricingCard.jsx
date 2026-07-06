import { Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { createOrder, verifyPayment } from '../api/payments'

export default function PricingCard({ name, price, billing, features, cta, ctaLink, plan, highlighted }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleUpgrade = async () => {
    if (!user) { navigate('/login'); return }

    try {
      const { data } = await createOrder({ plan })
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'Rentabout',
        description: `Pro ${billing === 'monthly' ? 'Monthly ₹499' : 'Yearly ₹3999'}`,
        handler: async (response) => {
          try {
            await verifyPayment({ ...response, plan })
            toast.success('🎉 Welcome to Pro! Enjoy unlimited everything.')
            navigate('/dashboard')
          } catch {
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        prefill: { email: user.email },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => toast('Payment cancelled') },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not initiate payment. Try again.')
    }
  }

  const base = highlighted
    ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 shadow-2xl'
    : 'bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm'

  return (
    <div className={`rounded-2xl p-8 flex flex-col ${base}`}>
      <div>
        <p className={`text-sm font-semibold mb-1 ${highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{name}</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-extrabold">₹{price.toLocaleString('en-IN')}</span>
          {price > 0 && (
            <span className={`text-sm ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
              /{billing === 'monthly' ? 'month' : 'year'}
            </span>
          )}
        </div>
        {highlighted && billing === 'yearly' && (
          <p className="text-indigo-300 text-xs mb-1">≈ ₹333/mo · Save ₹2,000/year</p>
        )}
      </div>

      <ul className="my-8 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${highlighted ? 'text-indigo-200' : 'text-indigo-600'}`} />
            <span className={highlighted ? 'text-indigo-100' : 'text-gray-700'}>{f}</span>
          </li>
        ))}
      </ul>

      {ctaLink ? (
        <Link to={ctaLink}
          className={`block text-center w-full rounded-xl py-3.5 font-semibold text-sm transition-colors ${
            highlighted ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}>
          {cta}
        </Link>
      ) : (
        <button onClick={handleUpgrade}
          className={`w-full rounded-xl py-3.5 font-semibold text-sm transition-colors ${
            highlighted ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}>
          {cta}
        </button>
      )}
    </div>
  )
}

