import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsChart({ data }) {
  const { clicks_by_day = [], device_breakdown = [], country_breakdown = [], total_clicks = 0 } = data

  const byDay     = clicks_by_day.map((d) => ({ date: d.click_date?.slice(5), clicks: Number(d.click_count) }))
  const byDevice  = device_breakdown.map((d) => ({ name: d.device_type, value: Number(d.cnt) }))
  const byCountry = country_breakdown.map((d) => ({ country: d.country || 'Unknown', clicks: Number(d.cnt) }))

  return (
    <div className="space-y-6">
      {/* Clicks over time */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-6">
          Clicks Over Time
          <span className="ml-2 text-gray-400 font-normal text-sm">{total_clicks} total</span>
        </h3>
        {byDay.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">No clicks recorded in this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={byDay} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#4f46e5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Device breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-6">Device Breakdown</h3>
          {byDevice.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byDevice} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {byDevice.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Country breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-6">Top Countries</h3>
          {byCountry.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCountry} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="country" type="category" width={75} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

