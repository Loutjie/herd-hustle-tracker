import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-cattle.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Transaction } from "./Transactions";
import type { Cost } from "./Costs";

export default function Index() {
  const [transactions] = useLocalStorage<Transaction[]>("cattle_transactions", []);
  const [costs] = useLocalStorage<Cost[]>("farm_costs", []);

  const herdBought = transactions.filter(t=>t.type==='buy').reduce((s,t)=>s + t.headCount,0);
  const herdSold = transactions.filter(t=>t.type==='sell').reduce((s,t)=>s + t.headCount,0);
  const herdSize = herdBought - herdSold;
  const purchases = transactions.filter(t=>t.type==='buy').reduce((s,t)=>s + t.headCount * t.pricePerHead,0);
  const sales = transactions.filter(t=>t.type==='sell').reduce((s,t)=>s + t.headCount * t.pricePerHead,0);
  const totalCosts = costs.reduce((s,c)=>s + c.amount,0);
  const pnl = sales - purchases - totalCosts;

  const onPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--pointer-x", `${x}px`);
    e.currentTarget.style.setProperty("--pointer-y", `${y}px`);
  };

  return (
    <main className="min-h-screen">
      <Helmet>
        <title>Cattle Manager — Dashboard</title>
        <meta name="description" content="Dashboard for tracking cattle purchases, sales, and input costs like feed." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Cattle Manager",
          url: "/"
        })}</script>
      </Helmet>

      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-secondary" />
        <div className="relative overflow-hidden" onMouseMove={onPointerMove}>
          <img src={heroImage} alt="Herd of cattle grazing on a green pasture at golden hour" loading="lazy" className="w-full h-[44vh] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(500px_circle_at_var(--pointer-x,_50%)_var(--pointer-y,_50%),hsl(var(--accent)/0.3),transparent_60%)] motion-reduce:opacity-0" />
        </div>
        <div className="container mx-auto -mt-16 pb-6">
          <div className="rounded-lg border bg-card/80 backdrop-blur p-6 shadow-lg">
            <h1 className="text-3xl font-semibold tracking-tight">Cattle Operations Dashboard</h1>
            <p className="text-muted-foreground">At-a-glance view of herd size, costs, and performance.</p>
            <div className="mt-4 flex gap-3">
              <Button asChild>
                <Link to="/transactions">Record Transaction</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/costs">Add Cost</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Herd Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{herdSize}</div>
            <div className="text-sm text-muted-foreground">Bought {herdBought} • Sold {herdSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${purchases.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Livestock acquisitions</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${sales.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Livestock sales</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-semibold ${pnl >= 0 ? '' : ''}`}>${pnl.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Sales - Purchases - Costs</div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
