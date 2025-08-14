import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface CsvRow {
  Date: string;
  Description: string;
  Amount: string;
  Balance: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  selected: boolean;
  category: string;
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

const CsvImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const parseDate = (dateStr: string): string => {
    // Parse YYYYMMDD format to YYYY-MM-DD
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedTransactions: ParsedTransaction[] = results.data
          .map((row: any) => {
            const amount = parseFloat(row.Amount?.replace(/,/g, '') || '0');
            // Only include negative amounts (costs)
            if (amount >= 0) return null;
            
            return {
              date: parseDate(row.Date || ''),
              description: row.Description || '',
              amount: Math.abs(amount), // Convert to positive for costs
              selected: false,
              category: 'Other' // Default category
            };
          })
          .filter(Boolean);
        
        setTransactions(parsedTransactions);
        
        toast({
          title: "File parsed successfully",
          description: `Found ${parsedTransactions.length} cost transactions`,
        });
      },
      error: (error) => {
        toast({
          title: "Error parsing file",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const toggleTransaction = (index: number) => {
    setTransactions(prev => 
      prev.map((t, i) => 
        i === index ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const updateCategory = (index: number, category: string) => {
    setTransactions(prev =>
      prev.map((t, i) =>
        i === index ? { ...t, category } : t
      )
    );
  };

  const selectAll = () => {
    setTransactions(prev => prev.map(t => ({ ...t, selected: true })));
  };

  const selectNone = () => {
    setTransactions(prev => prev.map(t => ({ ...t, selected: false })));
  };

  const handleImport = async () => {
    const selectedTransactions = transactions.filter(t => t.selected);
    
    if (selectedTransactions.length === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select transactions to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to import transactions.",
          variant: "destructive",
        });
        return;
      }

      const costsToInsert = selectedTransactions.map(t => ({
        user_id: user.id,
        category: t.category,
        amount: t.amount,
        occurred_on: t.date,
        description: t.description,
      }));

      const { error } = await supabase
        .from('input_costs')
        .insert(costsToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${selectedTransactions.length} transactions`,
      });

      // Reset state
      setFile(null);
      setTransactions([]);
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import transactions",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = transactions.filter(t => t.selected).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link to="/costs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Import CSV</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Upload a CSV file with columns: Date, Description, Amount, Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Review Transactions</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>
                      Select None
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Select transactions to import and assign categories. Only negative amounts (costs) are shown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Import</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={transaction.selected}
                              onCheckedChange={() => toggleTransaction(index)}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </TableCell>
                          <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select
                              value={transaction.category}
                              onValueChange={(value) => updateCategory(index, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COST_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} of {transactions.length} transactions selected
                  </p>
                  <Button
                    onClick={handleImport}
                    disabled={selectedCount === 0 || importing}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {importing ? "Importing..." : `Import ${selectedCount} Transactions`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CsvImport;