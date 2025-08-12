import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: cattle, error } = await supabase.from('cattle').select('*')
      if (error) {
        console.error(error)
      } else {
        setData(cattle)
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
      <h1 className="text-2xl font-bold mb-4">Cattle Records</h1>
      {data.length === 0 ? (
        <p>No cattle found.</p>
      ) : (
        <ul>
          {data.map((cow) => (
            <li key={cow.id}>{cow.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
