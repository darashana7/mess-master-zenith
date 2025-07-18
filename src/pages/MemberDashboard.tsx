import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Receipt, Clock, ChefHat } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  day_of_week: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
}

interface CostSummary {
  monthlyShare: number;
  totalPaid: number;
  balance: number;
  dueDate: string;
}

const MemberDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary>({
    monthlyShare: 0,
    totalPaid: 0,
    balance: 0,
    dueDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchMemberData();
    }
  }, [user]);

  const fetchMemberData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      if (!profileData?.mess_id) {
        setLoading(false);
        return;
      }

      // Fetch weekly menu
      const { data: menu } = await supabase
        .from('menu_items')
        .select('*')
        .eq('mess_id', profileData.mess_id)
        .eq('is_active', true)
        .order('day_of_week');

      setMenuItems(menu || []);

      // Fetch member payments
      const { data: memberPayments } = await supabase
        .from('member_payments')
        .select('*')
        .eq('member_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      setPayments(memberPayments || []);

      // Calculate cost summary
      await calculateCostSummary(profileData.mess_id);

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCostSummary = async (messId: string) => {
    try {
      // Get current month expenses
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('mess_id', messId)
        .gte('expense_date', firstDay.toISOString().split('T')[0]);

      // Get total members in mess
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', messId);

      // Get member's total payments this month
      const { data: monthlyPayments } = await supabase
        .from('member_payments')
        .select('amount')
        .eq('member_id', user?.id)
        .gte('payment_date', firstDay.toISOString().split('T')[0]);

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const monthlyShare = memberCount ? totalExpenses / memberCount : 0;
      const totalPaid = monthlyPayments?.reduce((sum, pay) => sum + Number(pay.amount), 0) || 0;
      const balance = totalPaid - monthlyShare;

      // Calculate due date (end of month)
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      setCostSummary({
        monthlyShare: Math.round(monthlyShare),
        totalPaid: Math.round(totalPaid),
        balance: Math.round(balance),
        dueDate: lastDay.toLocaleDateString()
      });

    } catch (error) {
      console.error('Error calculating cost summary:', error);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-green-100 text-green-800',
      'dinner': 'bg-blue-100 text-blue-800',
      'snacks': 'bg-purple-100 text-purple-800',
      'main': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const groupMenuByDay = (menu: MenuItem[]) => {
    return menu.reduce((acc, item) => {
      const day = item.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {} as Record<number, MenuItem[]>);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!profile?.mess_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              No Mess Found
            </CardTitle>
            <CardDescription>
              You need to join a mess to view your dashboard. Please create or join a mess first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Go to Main Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuByDay = groupMenuByDay(menuItems);

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Mess Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Share</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{costSummary.monthlyShare.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Your share of expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{costSummary.totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total payments made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${costSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(costSummary.balance).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {costSummary.balance >= 0 ? 'Credit' : `Due by ${costSummary.dueDate}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Menu */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              This Week's Menu
            </CardTitle>
            <CardDescription>Check out what's planned for each day</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(menuByDay).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(menuByDay)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([day, items]) => (
                    <div key={day} className="space-y-2">
                      <h3 className="font-semibold text-lg">{getDayName(Number(day))}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{item.name}</span>
                              <Badge className={getCategoryColor(item.category)}>
                                {item.category}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No menu planned yet</h3>
                <p className="text-muted-foreground">The menu will be updated soon!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>Your recent payment records</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_method}</Badge>
                      </TableCell>
                      <TableCell>{payment.reference_number || '-'}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments yet</h3>
                <p className="text-muted-foreground">Your payment history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MemberDashboard;