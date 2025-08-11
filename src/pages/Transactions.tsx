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

const transactionSchema = z
  .object({
    type: z.enum(["buy", "sell"]),
    quantity: z.string().min(1, "Quantity is required"),
    price_per_head: z.string().min(1, "Price per head is required"),
    breed: z.string().optional(),
    average_weight_kg: z.string().optional(),
    occurred_on: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
    batch_id: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "sell" && !val.batch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a batch for the sale",
        path: ["batch_id"],
      });
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
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<AvailableBatch[]>([]);
  const { toast } = useToast();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "buy",
      quantity: "",
      price_per_head: "",
      breed: "",
      average_weight_kg: "",
      occurred_on: new Date().toISOString().split('T')[0],
      notes: "",
      batch_id: "",
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

      const quantity = parseInt(data.quantity);
      const pricePerHead = parseFloat(data.price_per_head);
      const totalAmount = quantity * pricePerHead;
      const averageWeight = data.average_weight_kg ? parseFloat(data.average_weight_kg) : null;

      const selectedBatch = data.type === 'sell'
        ? batches.find(b => b.batch_id === data.batch_id)
        : undefined;

      if (data.type === 'sell') {
        if (!data.batch_id || !selectedBatch) {
          throw new Error('Please select a batch');
        }
        if (quantity > selectedBatch.remaining_quantity) {
          toast({
            title: "Invalid quantity",
            description: `You can only sell up to ${selectedBatch.remaining_quantity} from this batch`,
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('cattle_transactions')
        .insert({
          type: data.type,
          quantity,
          price_per_head: pricePerHead,
          total_amount: totalAmount,
          breed: data.breed || null,
          average_weight_kg: averageWeight,
          occurred_on: data.occurred_on,
          notes: data.notes || null,
          user_id: user.id,
          batch_id: data.type === 'sell' ? data.batch_id : null,
        });


      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });

      form.reset();
      fetchTransactions();
      fetchAvailableBatches();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
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
                          if (v === 'sell') fetchAvailableBatches();
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
                    <FormField
                      control={form.control}
                      name="batch_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch for Sale</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={batches.length ? "Select a batch" : "No batches available"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-50 bg-popover text-popover-foreground max-h-72">
                              {batches.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No available batches</div>
                              ) : (
                                batches.map((b) => (
                                  <SelectItem key={b.batch_id} value={b.batch_id}>
                                    {new Date(b.purchase_date).toLocaleDateString()} · {b.breed || 'Mixed'} · Rem: {b.remaining_quantity}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}


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