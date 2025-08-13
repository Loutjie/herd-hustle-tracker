import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Beef } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const transactionSchema = z.object({
  type: z.enum(["buy", "sell"]),
  quantity: z.string().optional(),
  price_per_head: z.string().optional(),
  total_sale_price: z.string().optional(),
  breed: z.string().optional(),
  average_weight_kg: z.string().optional(),
  occurred_on: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  input_cost_deduction: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.type === "buy") {
    if (!val.quantity || String(val.quantity).trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantity is required", path: ["quantity"] });
    }
    if (!val.price_per_head || String(val.price_per_head).trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price per head is required", path: ["price_per_head"] });
    }
  }
  if (val.type === "sell") {
    if (!val.total_sale_price || String(val.total_sale_price).trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total sale price is required", path: ["total_sale_price"] });
    }
  }
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  price_per_head: number;
  total_amount: number;
  breed?: string;
  average_weight_kg?: number;
  occurred_on: string;
  notes?: string;
}

interface AvailableBatch {
  batch_id: string;
  purchase_date: string;
  breed: string | null;
  purchased_quantity: number;
  sold_quantity: number;
  remaining_quantity: number;
  price_per_head: number | null;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<AvailableBatch[]>([]);
const { toast } = useToast();

  const [allocations, setAllocations] = useState<{ batch_id: string; quantity: number }[]>([]);
  const [allocSums, setAllocSums] = useState<Record<string, number>>({});
  const [unaccountedCost, setUnaccountedCost] = useState<number>(0);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "buy",
      quantity: "",
      price_per_head: "",
      total_sale_price: "",
      breed: "",
      average_weight_kg: "",
      occurred_on: new Date().toISOString().split('T')[0],
      notes: "",
      input_cost_deduction: "",
    },
  });

  const typeValue = form.watch("type");

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cattle_transactions')
        .select('*')
        .order('occurred_on', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('available_batches')
        .select('*')
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      // Silent fail for batches; surfaced in UI when selling
    }
  };

  const fetchAllocationsAggregate = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_batch_allocations')
        .select('purchase_transaction_id, quantity');
      if (error) throw error;
      const sums: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const key = row.purchase_transaction_id as string;
        const q = Number(row.quantity) || 0;
        sums[key] = (sums[key] || 0) + q;
      });
      setAllocSums(sums);
    } catch (error) {
      // ignore
    }
  };

  const fetchUnaccountedCost = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const { data: costs, error: costsErr } = await supabase
        .from('input_costs')
        .select('amount');
      if (costsErr) throw costsErr;
      const totalCosts = (costs || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      const { data: sells, error: sellsErr } = await supabase
        .from('cattle_transactions')
        .select('input_cost_deduction, type')
        .eq('type', 'sell');
      if (sellsErr) throw sellsErr;
      const deducted = (sells || []).reduce((s: number, r: any) => s + Number(r.input_cost_deduction || 0), 0);

      setUnaccountedCost(Math.max(0, totalCosts - deducted));
    } catch (e) {
      // ignore
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add a transaction.",
          variant: "destructive",
        });
        return;
      }

      let quantity = 0;
      let pricePerHead = 0;
      let totalAmount = 0;
      const inputDeduction = data.input_cost_deduction ? parseFloat(data.input_cost_deduction) : 0;

      if (data.type === 'sell') {
        if (!allocations.length) {
          toast({ title: "Allocation required", description: "Add at least one batch allocation.", variant: "destructive" });
          return;
        }
        if (allocations.some(a => !a.batch_id || !a.quantity || a.quantity <= 0)) {
          toast({ title: "Invalid allocation", description: "Each allocation needs a batch and quantity > 0.", variant: "destructive" });
          return;
        }

        const saleQuantity = allocations.reduce((s, a) => s + (Number(a.quantity) || 0), 0);
        if (saleQuantity <= 0) {
          toast({ title: "Quantity required", description: "Enter allocation quantities.", variant: "destructive" });
          return;
        }

        // Validate available per batch
        const allocationsByBatch: Record<string, number> = {};
        allocations.forEach(a => { allocationsByBatch[a.batch_id] = (allocationsByBatch[a.batch_id] || 0) + Number(a.quantity || 0); });
        for (const [batchId, q] of Object.entries(allocationsByBatch)) {
          const batch = batches.find(b => b.batch_id === batchId);
          const baseRemaining = batch ? Number(batch.remaining_quantity || 0) : 0;
          const alreadyAllocated = Number(allocSums[batchId] || 0);
          const available = Math.max(0, baseRemaining - alreadyAllocated);
          if (q > available) {
            toast({ title: "Over-allocation", description: `Batch exceeds available (${available}).`, variant: "destructive" });
            return;
          }
        }

        if (isNaN(inputDeduction) || inputDeduction < 0) {
          toast({ title: "Invalid deduction", description: "Deduction must be a positive number.", variant: "destructive" });
          return;
        }
        if (inputDeduction > unaccountedCost) {
          toast({ title: "Exceeds unaccounted costs", description: "Reduce the deduction amount.", variant: "destructive" });
          return;
        }

        const totalSalePrice = data.total_sale_price ? parseFloat(data.total_sale_price) : NaN;
        if (isNaN(totalSalePrice) || totalSalePrice <= 0) {
          toast({ title: "Total sale price required", description: "Enter a valid total sale price.", variant: "destructive" });
          return;
        }

        quantity = saleQuantity;
        totalAmount = totalSalePrice;
        pricePerHead = totalSalePrice / saleQuantity;
      } else {
        const q = parseInt(data.quantity || '0');
        const pph = parseFloat(data.price_per_head || '0');
        if (!q || !pph) {
          toast({ title: "Invalid purchase", description: "Quantity and price per head are required.", variant: "destructive" });
          return;
        }
        quantity = q;
        pricePerHead = pph;
        totalAmount = q * pph;
      }

      const averageWeight = data.type === 'buy' && data.average_weight_kg ? parseFloat(data.average_weight_kg) : null;

      // Insert transaction
      const { data: inserted, error: insertErr } = await supabase
        .from('cattle_transactions')
        .insert({
          type: data.type,
          quantity,
          price_per_head: pricePerHead,
          total_amount: totalAmount,
          breed: data.type === 'buy' ? (data.breed || null) : null,
          average_weight_kg: averageWeight,
          occurred_on: data.occurred_on,
          notes: data.notes || null,
          user_id: user.id,
          batch_id: data.type === 'sell' ? null : null,
          input_cost_deduction: data.type === 'sell' ? inputDeduction : 0,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Insert allocations if sale
      if (data.type === 'sell' && inserted?.id) {
        const rows = allocations.map((a) => {
          const batch = batches.find((b) => b.batch_id === a.batch_id);
          const cost = Number(batch?.price_per_head || 0);
          return {
            user_id: user.id,
            sale_transaction_id: inserted.id,
            purchase_transaction_id: a.batch_id,
            quantity: Number(a.quantity),
            cost_per_head: cost,
          };
        });
        const { error: allocErr } = await supabase.from('sale_batch_allocations').insert(rows);
        if (allocErr) throw allocErr;
      }

      toast({ title: "Success", description: "Transaction added successfully" });

      form.reset();
      setAllocations([]);
      fetchTransactions();
      fetchAvailableBatches();
      fetchAllocationsAggregate();
      fetchUnaccountedCost();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add transaction", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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
            <Beef className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Cattle Transactions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Transaction
              </CardTitle>
                <CardDescription>Record a new cattle purchase or sale (choose a batch for sales)</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select onValueChange={(v) => {
                          field.onChange(v);
                          if (v === 'sell') {
                            fetchAvailableBatches();
                            fetchAllocationsAggregate();
                            fetchUnaccountedCost();
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-50 bg-popover text-popover-foreground">
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {typeValue === 'sell' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Allocate Sale Across Batches</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAllocations((prev) => [...prev, { batch_id: '', quantity: 0 }])}
                        >
                          Add allocation
                        </Button>
                      </div>

                      {allocations.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add at least one batch allocation.</p>
                      )}

                      {allocations.map((row, idx) => {
                        const otherQtyOnSameBatch = allocations
                          .filter((_, i) => i !== idx && _.batch_id === row.batch_id)
                          .reduce((s, r) => s + (Number(r.quantity) || 0), 0);
                        const batch = batches.find((b) => b.batch_id === row.batch_id);
                        const baseRemaining = batch ? Number(batch.remaining_quantity || 0) : 0;
                        const alreadyAllocated = row.batch_id ? Number(allocSums[row.batch_id] || 0) : 0;
                        const available = Math.max(0, baseRemaining - alreadyAllocated - otherQtyOnSameBatch);

                        return (
                          <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-7">
                              <Label>Batch</Label>
                              <Select
                                value={row.batch_id}
                                onValueChange={(v) => {
                                  const next = [...allocations];
                                  next[idx].batch_id = v;
                                  setAllocations(next);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={batches.length ? "Select a batch" : "No batches available"} />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-popover text-popover-foreground max-h-72">
                                  {batches.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No available batches</div>
                                  ) : (
                                    batches.map((b) => {
                                      const currentRowOtherQty = allocations
                                        .filter((_, i) => i !== idx && _.batch_id === b.batch_id)
                                        .reduce((s, r) => s + (Number(r.quantity) || 0), 0);
                                      const adjAvailable = Math.max(0, Number(b.remaining_quantity || 0) - Number(allocSums[b.batch_id] || 0) - currentRowOtherQty);
                                      return (
                                        <SelectItem key={b.batch_id} value={b.batch_id}>
                                          {b.breed || 'Mixed'} · Price/Head: ${Number(b.price_per_head || 0).toFixed(2)} · Rem: {adjAvailable}
                                        </SelectItem>
                                      );
                                    })
                                  )}
                                </SelectContent>
                              </Select>
                              {row.batch_id && (
                                <p className="text-xs text-muted-foreground mt-1">Available: {available}</p>
                              )}
                            </div>
                            <div className="col-span-4">
                              <Label>Qty</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.quantity || ''}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value || '0');
                                  const next = [...allocations];
                                  next[idx].quantity = isNaN(v) ? 0 : v;
                                  setAllocations(next);
                                }}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAllocations((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      <FormField
                        control={form.control}
                        name="input_cost_deduction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Input cost deduction (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Unaccounted available: ${unaccountedCost.toFixed(2)}</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="total_sale_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total sale price</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}


                  {typeValue !== 'sell' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input placeholder="Number of cattle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price_per_head"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Head</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {typeValue !== 'sell' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="breed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breed (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Angus, Holstein" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="average_weight_kg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avg Weight (kg)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="occurred_on"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Adding..." : "Add Transaction"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your cattle transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {new Date(transaction.occurred_on).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'buy' ? 'destructive' : 'default'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>${Number(transaction.total_amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Transactions;