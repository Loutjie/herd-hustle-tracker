import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const costSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  occurred_on: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type CostFormData = z.infer<typeof costSchema>;

interface Cost {
  id: string;
  category: string;
  amount: number;
  occurred_on: string;
  description?: string;
}

const COST_CATEGORIES = [
  "Feed",
  "Veterinary",
  "Equipment",
  "Labor",
  "Utilities",
  "Insurance",
  "Transportation",
  "Maintenance",
  "Other"
];

const Costs = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      category: "",
      amount: "",
      occurred_on: new Date().toISOString().split('T')[0],
      description: "",
    },
  });

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('input_costs')
        .select('*')
        .order('occurred_on', { ascending: false });

      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch costs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const onSubmit = async (data: CostFormData) => {
    setSubmitting(true);
    try {
      const amount = parseFloat(data.amount);

      const { error } = await supabase
        .from('input_costs')
        .insert({
          category: data.category,
          amount,
          occurred_on: data.occurred_on,
          description: data.description || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cost added successfully",
      });

      form.reset();
      fetchCosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add cost",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Feed: "bg-blue-100 text-blue-800",
      Veterinary: "bg-red-100 text-red-800",
      Equipment: "bg-green-100 text-green-800",
      Labor: "bg-yellow-100 text-yellow-800",
      Utilities: "bg-purple-100 text-purple-800",
      Insurance: "bg-orange-100 text-orange-800",
      Transportation: "bg-pink-100 text-pink-800",
      Maintenance: "bg-gray-100 text-gray-800",
      Other: "bg-indigo-100 text-indigo-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Input Costs</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Cost
              </CardTitle>
              <CardDescription>Record a new farm expense</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COST_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Adding..." : "Add Cost"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Costs</CardTitle>
              <CardDescription>Your farm expense history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading costs...</p>
              ) : costs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No costs recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costs.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell className="font-medium">
                            {new Date(cost.occurred_on).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cost.category)}`}>
                              {cost.category}
                            </span>
                          </TableCell>
                          <TableCell>${cost.amount.toFixed(2)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {cost.description || "-"}
                          </TableCell>
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

export default Costs;