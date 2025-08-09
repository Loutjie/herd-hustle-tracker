import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export type Transaction = {
  id: string;
  date: string; // ISO
  type: "buy" | "sell";
  headCount: number;
  pricePerHead: number;
  breed?: string;
  notes?: string;
};

const initialForm: Omit<Transaction, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  type: "buy",
  headCount: 1,
  pricePerHead: 0,
  breed: "",
  notes: "",
};

export default function Transactions() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("cattle_transactions", []);
  const [form, setForm] = useState<Omit<Transaction, "id">>(initialForm);

  const addTransaction = () => {
    const id = crypto.randomUUID();
    const newTx: Transaction = { id, ...form, headCount: Number(form.headCount), pricePerHead: Number(form.pricePerHead) };
    setTransactions([newTx, ...transactions]);
    toast({ title: "Transaction added", description: `${newTx.type === "buy" ? "Purchase" : "Sale"} recorded.` });
    setForm(initialForm);
  };

  const remove = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    toast({ title: "Transaction removed" });
  };

  const totalBuy = transactions.filter(t=>t.type==='buy').reduce((s,t)=>s + t.headCount * t.pricePerHead,0);
  const totalSell = transactions.filter(t=>t.type==='sell').reduce((s,t)=>s + t.headCount * t.pricePerHead,0);

  return (
    <main className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Transactions — Cattle Manager</title>
        <meta name="description" content="Record and view cattle buy and sell transactions." />
        <link rel="canonical" href="/transactions" />
      </Helmet>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Cattle Transactions</h1>
        <p className="text-muted-foreground">Record purchases and sales of cattle.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add Transaction</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v: "buy"|"sell")=>setForm({...form, type: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="headCount">Head Count</Label>
            <Input id="headCount" type="number" min={1} value={form.headCount} onChange={(e)=>setForm({...form, headCount: Number(e.target.value)})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price per Head</Label>
            <Input id="price" type="number" min={0} step="0.01" value={form.pricePerHead} onChange={(e)=>setForm({...form, pricePerHead: Number(e.target.value)})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="breed">Breed (optional)</Label>
            <Input id="breed" value={form.breed} onChange={(e)=>setForm({...form, breed: e.target.value})} />
          </div>
          <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button onClick={addTransaction}>Add Transaction</Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-muted-foreground">Total Purchases: <span className="font-medium text-foreground">${totalBuy.toLocaleString()}</span></div>
          <Separator orientation="vertical" className="h-5" />
          <div className="text-sm text-muted-foreground">Total Sales: <span className="font-medium text-foreground">${totalSell.toLocaleString()}</span></div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Price/Head</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No transactions yet.</TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell className={t.type === 'buy' ? 'text-foreground' : 'text-foreground'}>{t.type === 'buy' ? 'Buy' : 'Sell'}</TableCell>
                      <TableCell>{t.headCount}</TableCell>
                      <TableCell>${t.pricePerHead.toLocaleString()}</TableCell>
                      <TableCell>${(t.pricePerHead * t.headCount).toLocaleString()}</TableCell>
                      <TableCell>{t.breed || '-'}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={t.notes}>{t.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={()=>remove(t.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
