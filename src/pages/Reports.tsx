import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction } from "./Transactions";
import type { Cost } from "./Costs";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

export default function Reports() {
  const [transactions] = useLocalStorage<Transaction[]>("cattle_transactions", []);
  const [costs] = useLocalStorage<Cost[]>("farm_costs", []);

  const map = new Map<string, { month: string; purchases: number; sales: number; costs: number; pnl: number }>();

  transactions.forEach(t => {
    const mk = monthKey(t.date);
    const entry = map.get(mk) || { month: mk, purchases: 0, sales: 0, costs: 0, pnl: 0 };
    const total = t.headCount * t.pricePerHead;
    if (t.type === 'buy') entry.purchases += total; else entry.sales += total;
    map.set(mk, entry);
  });

  costs.forEach(c => {
    const mk = monthKey(c.date);
    const entry = map.get(mk) || { month: mk, purchases: 0, sales: 0, costs: 0, pnl: 0 };
    entry.costs += c.amount;
    map.set(mk, entry);
  });

  const data = Array.from(map.values())
    .sort((a,b)=>a.month.localeCompare(b.month))
    .map(d => ({ ...d, pnl: d.sales - d.purchases - d.costs }));

  return (
    <main className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Reports — Cattle Manager</title>
        <meta name="description" content="Visualize monthly purchases, sales, costs and profit for your cattle operation." />
        <link rel="canonical" href="/reports" />
      </Helmet>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Monthly performance overview.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--sidebar-ring))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="purchases" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pnl" stroke="hsl(var(--accent-foreground))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
