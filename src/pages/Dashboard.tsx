import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Beef, ShoppingCart, Coins, TrendingUp, Package } from 'lucide-react'
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, Legend, XAxis, YAxis } from 'recharts'

export default function Dashboard() {
  type RangeKey = 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'ytd'

  const [transactions, setTransactions] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>('last30')

  const getRangeDates = (key: RangeKey) => {
    const today = new Date()
    switch (key) {
      case 'last7':
        return { start: subDays(today, 6), end: today }
      case 'last30':
        return { start: subDays(today, 29), end: today }
      case 'thisMonth': {
        const start = startOfMonth(today)
        const end = endOfMonth(today)
        return { start, end }
      }
      case 'lastMonth': {
        const lastMonth = subMonths(today, 1)
        const start = startOfMonth(lastMonth)
        const end = endOfMonth(lastMonth)
        return { start, end }
      }
      case 'ytd':
        return { start: startOfYear(today), end: today }
    }
  }

  const { start, end } = useMemo(() => getRangeDates(range), [range])

  useEffect(() => {
    // SEO: set title and meta description
    document.title = 'Cattle Dashboard | Performance & PnL'
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    metaDesc.setAttribute('content', 'Cattle performance dashboard with totals, costs, and PnL over your selected period.')
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')

      const [txRes, costRes, batchRes] = await Promise.all([
        supabase
          .from('cattle_transactions')
          .select('*')
          .gte('occurred_on', startStr)
          .lte('occurred_on', endStr)
          .order('occurred_on', { ascending: true }),
        supabase
          .from('input_costs')
          .select('*')
          .gte('occurred_on', startStr)
          .lte('occurred_on', endStr)
          .order('occurred_on', { ascending: true }),
        supabase
          .from('available_batches')
          .select('*')
          .order('purchase_date', { ascending: false })
      ])

      if (txRes.error) console.error(txRes.error)
      if (costRes.error) console.error(costRes.error)
      if (batchRes.error) console.error(batchRes.error)

      setTransactions(txRes.data || [])
      setCosts(costRes.data || [])
      setBatches(batchRes.data || [])
      setLoading(false)
    }

    fetchData()
  }, [start, end])

  const metrics = useMemo(() => {
    const buys = transactions.filter((t) => t.type === 'buy')
    const sells = transactions.filter((t) => t.type === 'sell')

    const totalPurchasedHead = buys.reduce((sum, t) => sum + Number(t.quantity || 0), 0)
    const totalSoldHead = sells.reduce((sum, t) => sum + Number(t.quantity || 0), 0)
    const netCattle = totalPurchasedHead - totalSoldHead

    // Only include cattle costs when cattle are sold (from sale_batch_allocations)
    const salesRevenue = sells.reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
    const inputCostTotal = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const inputCostDeductions = sells.reduce((sum, t) => sum + Number(t.input_cost_deduction || 0), 0)

    // PnL only includes costs from input_costs and input_cost_deductions on sales
    const pnl = salesRevenue - inputCostTotal - inputCostDeductions

    return { netCattle, salesRevenue, inputCostTotal, inputCostDeductions, pnl }
  }, [transactions, costs])

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start, end })

    // Build daily maps
    const sellMap: Record<string, number> = {}
    const costMap: Record<string, number> = {}
    const deductionMap: Record<string, number> = {}

    transactions.forEach((t) => {
      const key = String(t.occurred_on)
      if (t.type === 'sell') {
        sellMap[key] = (sellMap[key] || 0) + Number(t.total_amount || 0)
        deductionMap[key] = (deductionMap[key] || 0) + Number(t.input_cost_deduction || 0)
      }
    })
    costs.forEach((c) => {
      const key = String(c.occurred_on)
      costMap[key] = (costMap[key] || 0) + Number(c.amount || 0)
    })

    let cumulative = 0

    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const sales = sellMap[key] || 0
      const inputs = costMap[key] || 0
      const deductions = deductionMap[key] || 0
      // Daily PnL (excluding cattle purchase costs)
      const daily = sales - inputs - deductions
      cumulative += daily
      return {
        date: format(d, 'MMM d'),
        sales,
        inputs,
        deductions,
        pnl: cumulative,
      }
    })
  }, [transactions, costs, start, end])

  const currency = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Cattle Performance Dashboard</h1>
      </header>

      <section className="mb-6 flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing data from {format(start, 'PP')} to {format(end, 'PP')}
        </div>
        <Select value={range} onValueChange={(v: RangeKey) => setRange(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="thisMonth">This month</SelectItem>
            <SelectItem value="lastMonth">Last month</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cattle (net)</CardTitle>
              <Beef className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.netCattle}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currency(metrics.salesRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Input Costs</CardTitle>
              <Coins className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currency(metrics.inputCostTotal + metrics.inputCostDeductions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net PnL</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currency(metrics.pnl)}</div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Cattle Batches Section */}
      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cattle Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32" />
            ) : batches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No cattle batches found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Breed</TableHead>
                      <TableHead>Price per Head</TableHead>
                      <TableHead>Initial Quantity</TableHead>
                      <TableHead>Current Quantity</TableHead>
                      <TableHead>Avg Weight (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.batch_id}>
                        <TableCell>
                          {new Date(batch.purchase_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{batch.breed || '-'}</TableCell>
                        <TableCell>{currency(Number(batch.price_per_head || 0))}</TableCell>
                        <TableCell>{batch.purchased_quantity}</TableCell>
                        <TableCell>{batch.remaining_quantity}</TableCell>
                        <TableCell>{batch.average_weight_kg ? `${Number(batch.average_weight_kg).toFixed(1)} kg` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">Sales Revenue, Input Costs and Cumulative PnL</h2>
        </div>
        <div className="p-2">
          {loading ? (
            <Skeleton className="h-[320px]" />
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillInputs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillDeductions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="hsl(var(--primary))" fill="url(#fillSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="inputs" name="Input Costs" stroke="hsl(var(--destructive))" fill="url(#fillInputs)" strokeWidth={2} />
                  <Area type="monotone" dataKey="deductions" name="Cattle Cost Deductions" stroke="hsl(var(--muted-foreground))" fill="url(#fillDeductions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
