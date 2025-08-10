import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Beef, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Beef className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Cattle Farm Manager</h1>
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
                <Button className="w-full">Manage Transactions</Button>
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

          <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                Farm overview at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Cattle:</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Costs:</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net Position:</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;