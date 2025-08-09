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

export type Cost = {
  id: string;
  date: string; // ISO
  category: "feed" | "vet" | "transport" | "labor" | "other";
  vendor?: string;
  quantity?: number;
  unit?: string;
  amount: number;
  notes?: string;
};

const initialForm: Omit<Cost, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  category: "feed",
  vendor: "",
  quantity: 0,
  unit: "",
  amount: 0,
  notes: "",
};

export default function Costs() {
  const [costs, setCosts] = useLocalStorage<Cost[]>("farm_costs", []);
  const [form, setForm] = useState<Omit<Cost, "id">>(initialForm);

  const addCost = () => {
    const id = crypto.randomUUID();
    const newCost: Cost = { id, ...form, quantity: Number(form.quantity), amount: Number(form.amount) };
    setCosts([newCost, ...costs]);
    toast({ title: "Cost added", description: `${newCost.category} cost recorded.` });
    setForm(initialForm);
  };

  const remove = (id: string) => {
    setCosts(costs.filter((c) => c.id !== id));
    toast({ title: "Cost removed" });
  };

  const totalCosts = costs.reduce((s,c)=>s + c.amount,0);
  const feedCosts = costs.filter(c=>c.category==='feed').reduce((s,c)=>s + c.amount,0);

  return (
    <main className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Costs — Cattle Manager</title>
        <meta name="description" content="Track farm input costs like feed, veterinary, transport, and labor." />
        <link rel="canonical" href="/costs" />
      </Helmet>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Farm Input Costs</h1>
        <p className="text-muted-foreground">Log feed and other operating expenses.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add Cost</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v: Cost["category"])=>setForm({...form, category: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feed">Feed</SelectItem>
                <SelectItem value="vet">Veterinary</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input id="vendor" value={form.vendor} onChange={(e)=>setForm({...form, vendor: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={0} value={form.quantity} onChange={(e)=>setForm({...form, quantity: Number(e.target.value)})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" value={form.unit} onChange={(e)=>setForm({...form, unit: e.target.value})} placeholder="e.g. kg, bag" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount: Number(e.target.value)})} />
          </div>
          <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button onClick={addCost}>Add Cost</Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div>Total Costs: <span className="font-medium text-foreground">${totalCosts.toLocaleString()}</span></div>
          <div>Feed Costs: <span className="font-medium text-foreground">${feedCosts.toLocaleString()}</span></div>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No costs yet.</TableCell>
                  </TableRow>
                ) : (
                  costs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.date}</TableCell>
                      <TableCell className="capitalize">{c.category}</TableCell>
                      <TableCell>{c.vendor || '-'}</TableCell>
                      <TableCell>{c.quantity ?? '-'}</TableCell>
                      <TableCell>{c.unit || '-'}</TableCell>
                      <TableCell>${c.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={c.notes}>{c.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={()=>remove(c.id)}>Delete</Button>
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
