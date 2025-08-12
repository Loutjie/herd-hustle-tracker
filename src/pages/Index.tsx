import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Beef, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Beef className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Cattle Farm Manager</h1>
            </div>
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
          </div>
          <p className="text-muted-foreground mt-2">Track your cattle transactions and farm expenses</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Dashboard
              </CardTitle>
              <CardDescription>
                View farm performance and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get insights into your cattle count, costs, and profit & loss for the year.
              </p>
              <Link to="/dashboard">
                <Button className="w-full">View Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beef className="h-5 w-5 text-primary" />
                Cattle Transactions
              </CardTitle>
              <CardDescription>
                Track buying and selling of cattle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Record purchases and sales with detailed information including breed, weight, and pricing.
              </p>
              <Link to="/transactions">
                <Button variant="outline" className="w-full">Manage Transactions</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Input Costs
              </CardTitle>
              <CardDescription>
                Track feed and operational expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor all farm input costs including feed, veterinary care, and other operational expenses.
              </p>
              <Link to="/costs">
                <Button variant="outline" className="w-full">Manage Costs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;