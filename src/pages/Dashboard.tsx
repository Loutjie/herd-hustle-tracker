import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Beef, DollarSign, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardMetrics {
  totalCattle: number;
  costPrice: number;
  revenue: number;
  totalCosts: number;
  pnl: number;
  cattlePurchased: number;
  cattleSold: number;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCattle: 0,
    costPrice: 0,
    revenue: 0,
    totalCosts: 0,
    pnl: 0,
    cattlePurchased: 0,
    cattleSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      // Fetch cattle transactions for the current year
      const { data: transactions, error: transactionsError } = await supabase
        .from('cattle_transactions')
        .select('*')
        .gte('occurred_on', yearStart)
        .lte('occurred_on', yearEnd);

      if (transactionsError) throw transactionsError;

      // Fetch input costs for the current year
      const { data: costs, error: costsError } = await supabase
        .from('input_costs')
        .select('*')
        .gte('occurred_on', yearStart)
        .lte('occurred_on', yearEnd);

      if (costsError) throw costsError;

      // Calculate metrics
      const buyTransactions = transactions?.filter(t => t.type === 'buy') || [];
      const sellTransactions = transactions?.filter(t => t.type === 'sell') || [];

      const cattlePurchased = buyTransactions.reduce((sum, t) => sum + t.quantity, 0);
      const cattleSold = sellTransactions.reduce((sum, t) => sum + t.quantity, 0);
      const totalCattle = cattlePurchased - cattleSold;

      const costPrice = buyTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const revenue = sellTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const totalCosts = costs?.reduce((sum, c) => sum + c.amount, 0) || 0;

      const pnl = revenue - costPrice - totalCosts;

      setMetrics({
        totalCattle,
        costPrice,
        revenue,
        totalCosts,
        pnl,
        cattlePurchased,
        cattleSold,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return "text-green-600";
    if (pnl < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getPnLIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (pnl < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Calculator className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-2">Farm performance overview for {new Date().getFullYear()}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Cattle Inventory */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Cattle</CardTitle>
                <Beef className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCattle}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.cattlePurchased} purchased, {metrics.cattleSold} sold
                </p>
              </CardContent>
            </Card>

            {/* Total Investment in Cattle */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cattle Investment</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.costPrice)}</div>
                <p className="text-xs text-muted-foreground">
                  Total cost of cattle purchases
                </p>
              </CardContent>
            </Card>

            {/* Revenue from Sales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue from cattle sales
                </p>
              </CardContent>
            </Card>

            {/* Operating Costs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operating Costs</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalCosts)}</div>
                <p className="text-xs text-muted-foreground">
                  Feed, vet, and other expenses
                </p>
              </CardContent>
            </Card>

            {/* P&L for the Year */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit & Loss (YTD)</CardTitle>
                {getPnLIcon(metrics.pnl)}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getPnLColor(metrics.pnl)}`}>
                  {formatCurrency(metrics.pnl)}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="text-green-600">+{formatCurrency(metrics.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cattle Costs:</span>
                    <span className="text-red-600">-{formatCurrency(metrics.costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operating Costs:</span>
                    <span className="text-red-600">-{formatCurrency(metrics.totalCosts)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Net Profit/Loss:</span>
                    <span className={getPnLColor(metrics.pnl)}>
                      {formatCurrency(metrics.pnl)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/transactions">
                  <Button variant="outline" className="w-full justify-start">
                    <Beef className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </Link>
                <Link to="/costs">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Cost
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;