import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, Edit, Trash2, Receipt, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  expense_date: string;
  added_by: string;
  profiles?: { full_name: string | null };
}

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  profiles?: { full_name: string | null };
}

interface Member {
  id: string;
  full_name: string | null;
  user_id: string;
}

const EXPENSE_CATEGORIES = ['groceries', 'utilities', 'maintenance', 'cleaning', 'gas', 'other'];
const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque'];

const FinancialManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: 0,
    category: 'groceries',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [paymentForm, setPaymentForm] = useState({
    member_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) return;

      // Fetch expenses with user profiles
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('mess_id', profile.mess_id)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch added_by profiles for expenses
      const expenseUserIds = expensesData?.map(expense => expense.added_by) || [];
      const { data: expenseProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', expenseUserIds);

      // Fetch payments with member profiles
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('member_payments')
        .select('*')
        .eq('mess_id', profile.mess_id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch member profiles for payments
      const memberIds = paymentsData?.map(payment => payment.member_id) || [];
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', memberIds);

      // Merge profiles with expenses and payments
      const expensesWithProfiles = expensesData?.map(expense => ({
        ...expense,
        profiles: expenseProfiles?.find(p => p.user_id === expense.added_by)
      })) || [];

      const paymentsWithProfiles = paymentsData?.map(payment => ({
        ...payment,
        profiles: memberProfiles?.find(p => p.id === payment.member_id)
      })) || [];

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .eq('mess_id', profile.mess_id);

      if (membersError) throw membersError;

      setExpenses(expensesWithProfiles || []);
      setPayments(paymentsWithProfiles || []);
      setMembers(membersData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) throw new Error('No mess found');

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update({
            title: expenseForm.title,
            description: expenseForm.description || null,
            amount: expenseForm.amount,
            category: expenseForm.category,
            expense_date: expenseForm.expense_date
          })
          .eq('id', editingExpense.id);

        if (error) throw error;
        
        toast({
          title: "Expense updated",
          description: "The expense has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert({
            mess_id: profile.mess_id,
            added_by: user?.id,
            title: expenseForm.title,
            description: expenseForm.description || null,
            amount: expenseForm.amount,
            category: expenseForm.category,
            expense_date: expenseForm.expense_date
          });

        if (error) throw error;
        
        toast({
          title: "Expense added",
          description: "New expense has been recorded successfully."
        });
      }

      setExpenseForm({
        title: '',
        description: '',
        amount: 0,
        category: 'groceries',
        expense_date: new Date().toISOString().split('T')[0]
      });
      setIsAddingExpense(false);
      setEditingExpense(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: editingExpense ? "Error updating expense" : "Error adding expense",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) throw new Error('No mess found');

      if (editingPayment) {
        const { error } = await supabase
          .from('member_payments')
          .update({
            member_id: paymentForm.member_id,
            amount: paymentForm.amount,
            payment_date: paymentForm.payment_date,
            payment_method: paymentForm.payment_method,
            reference_number: paymentForm.reference_number || null,
            notes: paymentForm.notes || null
          })
          .eq('id', editingPayment.id);

        if (error) throw error;
        
        toast({
          title: "Payment updated",
          description: "The payment has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('member_payments')
          .insert({
            mess_id: profile.mess_id,
            member_id: paymentForm.member_id,
            amount: paymentForm.amount,
            payment_date: paymentForm.payment_date,
            payment_method: paymentForm.payment_method,
            reference_number: paymentForm.reference_number || null,
            notes: paymentForm.notes || null
          });

        if (error) throw error;
        
        toast({
          title: "Payment recorded",
          description: "New payment has been recorded successfully."
        });
      }

      setPaymentForm({
        member_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: ''
      });
      setIsAddingPayment(false);
      setEditingPayment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: editingPayment ? "Error updating payment" : "Error recording payment",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = totalPayments - totalExpenses;

  const currentMonthExpenses = expenses.filter(expense => 
    new Date(expense.expense_date).getMonth() === new Date().getMonth()
  ).reduce((sum, expense) => sum + expense.amount, 0);

  const currentMonthPayments = payments.filter(payment => 
    new Date(payment.payment_date).getMonth() === new Date().getMonth()
  ).reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Financial Management</h1>
              <p className="text-muted-foreground">Track expenses and member payments</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(balance).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {balance >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month: ₹{currentMonthExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month: ₹{currentMonthPayments.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">
                Active members
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payments">Member Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Expenses</h2>
              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingExpense(null);
                    setExpenseForm({
                      title: '',
                      description: '',
                      amount: 0,
                      category: 'groceries',
                      expense_date: new Date().toISOString().split('T')[0]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    <DialogDescription>
                      {editingExpense ? 'Update the expense details' : 'Record a new expense for your mess'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Expense Title</Label>
                      <Input
                        id="title"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                        placeholder="e.g., Grocery Shopping"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        placeholder="Optional description..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="expense_date">Expense Date</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingExpense ? 'Update Expense' : 'Add Expense'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddingExpense(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {expenses.map(expense => (
                <Card key={expense.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{expense.title}</CardTitle>
                        <CardDescription>
                          {expense.profiles?.full_name} • {new Date(expense.expense_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold">₹{expense.amount.toLocaleString()}</div>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {expense.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {expenses.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No expenses recorded</h3>
                    <p className="text-muted-foreground">Start by adding your first expense.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Member Payments</h2>
              <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPayment(null);
                    setPaymentForm({
                      member_id: '',
                      amount: 0,
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'cash',
                      reference_number: '',
                      notes: ''
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPayment ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
                    <DialogDescription>
                      {editingPayment ? 'Update the payment details' : 'Record a payment from a member'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="member_id">Member</Label>
                      <Select value={paymentForm.member_id} onValueChange={(value) => setPaymentForm({ ...paymentForm, member_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || 'Unnamed Member'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map(method => (
                              <SelectItem key={method} value={method}>
                                {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reference_number">Reference Number</Label>
                      <Input
                        id="reference_number"
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                        placeholder="Transaction ID, Check number, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Optional notes..."
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingPayment ? 'Update Payment' : 'Record Payment'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddingPayment(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {payments.map(payment => (
                <Card key={payment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{payment.profiles?.full_name || 'Unknown Member'}</CardTitle>
                        <CardDescription>
                          {payment.payment_method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} • {new Date(payment.payment_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">+₹{payment.amount.toLocaleString()}</div>
                        {payment.reference_number && (
                          <div className="text-xs text-muted-foreground">Ref: {payment.reference_number}</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {payment.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{payment.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {payments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No payments recorded</h3>
                    <p className="text-muted-foreground">Start by recording your first payment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialManagement;