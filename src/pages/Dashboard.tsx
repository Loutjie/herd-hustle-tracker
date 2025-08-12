import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function Dashboard() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: transactions, error } = await supabase.from('cattle_transactions').select('*').order('occurred_on', { ascending: false })
      if (error) {
        console.error(error)
      } else {
        setData(transactions)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="p-6">Loading cattle data...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recent Transactions</h1>
      {data.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((t: any) => (
            <li key={t.id} className="text-sm">
              {new Date(t.occurred_on).toLocaleDateString()} · {t.type} · {t.quantity} head · ${Number(t.total_amount).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
