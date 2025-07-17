import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileSetup } from '@/components/ProfileSetup';
import { MessCreate } from '@/components/MessCreate';
import { MessJoin } from '@/components/MessJoin';
import { useToast } from '@/hooks/use-toast';
import NotificationCenter from '@/components/NotificationCenter';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChefHat, Users, Calendar, DollarSign, Package, TrendingUp, Plus, Settings, AlertTriangle } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  mess_id: string | null;
}

interface Mess {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
}

interface DashboardStats {
  totalMembers: number;
  monthlyExpenses: number;
  menuItems: number;
  lowStockItems: number;
  monthlyExpenseData: Array<{ month: string; amount: number }>;
  categoryExpenses: Array<{ category: string; amount: number; color: string }>;
  recentActivities: Array<{ 
    action: string; 
    description: string; 
    created_at: string;
    type: 'success' | 'warning' | 'info';
  }>;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'create-mess' | 'join-mess'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMembers: 0,
    monthlyExpenses: 0,
    menuItems: 0,
    lowStockItems: 0,
    monthlyExpenseData: [],
    categoryExpenses: [],
    recentActivities: []
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.mess_id) {
        const { data: messData, error: messError } = await supabase
          .from('mess')
          .select('*')
          .eq('id', profileData.mess_id)
          .single();

        if (messError) throw messError;
        setMess(messData);
        
        // Fetch dashboard analytics
        await fetchDashboardStats(profileData.mess_id);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (messId: string) => {
    try {
      // Fetch member count
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', messId);

      // Fetch current month expenses
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, created_at')
        .eq('mess_id', messId)
        .gte('expense_date', firstDay.toISOString().split('T')[0]);

      // Fetch menu items count
      const { count: menuCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', messId)
        .eq('is_active', true);

      // Fetch low stock items
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('current_stock, minimum_stock')
        .eq('mess_id', messId);

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('action, description, created_at')
        .eq('mess_id', messId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch monthly expense trends (last 6 months)
      const sixMonthsAgo = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5, 1);
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .eq('mess_id', messId)
        .gte('expense_date', sixMonthsAgo.toISOString().split('T')[0]);

      // Process data
      const totalMonthlyExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const lowStockCount = inventory?.filter(item => item.current_stock <= item.minimum_stock).length || 0;

      // Group expenses by category with colors
      const categoryData = expenses?.reduce((acc, exp) => {
        const category = exp.category || 'other';
        acc[category] = (acc[category] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      const categoryExpenses = Object.entries(categoryData).map(([category, amount], index) => ({
        category,
        amount,
        color: colors[index % colors.length]
      }));

      // Group monthly expenses
      const monthlyData = monthlyExpenses?.reduce((acc, exp) => {
        const month = new Date(exp.expense_date).toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit'
        });
        acc[month] = (acc[month] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const monthlyExpenseData = Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .slice(-6);

      // Format activities with types
      const recentActivities = activities?.map(activity => ({
        ...activity,
        type: activity.action.includes('expense') ? 'warning' as const :
              activity.action.includes('member') ? 'success' as const : 'info' as const
      })) || [];

      setDashboardStats({
        totalMembers: memberCount || 0,
        monthlyExpenses: totalMonthlyExpenses,
        menuItems: menuCount || 0,
        lowStockItems: lowStockCount,
        monthlyExpenseData,
        categoryExpenses,
        recentActivities
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleMessActionSuccess = () => {
    setView('dashboard');
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show profile setup if profile is incomplete
  if (!profile?.full_name || !profile?.phone) {
    return <ProfileSetup />;
  }

  if (view === 'create-mess') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <MessCreate
            onSuccess={handleMessActionSuccess}
            onCancel={() => setView('dashboard')}
          />
        </div>
      </div>
    );
  }

  if (view === 'join-mess') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <MessJoin
            onSuccess={handleMessActionSuccess}
            onCancel={() => setView('dashboard')}
          />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Members",
      value: dashboardStats.totalMembers.toString(),
      icon: Users,
      change: "Active members",
      color: "text-green-600"
    },
    {
      title: "Monthly Expenses",
      value: `₹${dashboardStats.monthlyExpenses.toLocaleString()}`,
      icon: DollarSign,
      change: "Current month",
      color: "text-blue-600"
    },
    {
      title: "Menu Items",
      value: dashboardStats.menuItems.toString(),
      icon: Calendar,
      change: "Active items",
      color: "text-purple-600"
    },
    {
      title: "Low Stock Alert",
      value: dashboardStats.lowStockItems.toString(),
      icon: dashboardStats.lowStockItems > 0 ? AlertTriangle : Package,
      change: "Items need restocking",
      color: dashboardStats.lowStockItems > 0 ? "text-red-600" : "text-green-600"
    }
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Mess Status */}
        {!mess ? (
          <Card className="mb-8 border-dashed border-2">
            <CardHeader>
              <CardTitle>Welcome to Mess Management</CardTitle>
              <CardDescription>
                Get started by creating a new mess or joining an existing one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => setView('create-mess')} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Mess
                </Button>
                <Button onClick={() => setView('join-mess')} variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Existing Mess
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {mess.name}
              </CardTitle>
              <CardDescription>{mess.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {mess.address && (
                <p className="text-sm text-muted-foreground">📍 {mess.address}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Only show if user has a mess */}
        {mess && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Analytics Charts - Only show if user has a mess */}
        {mess && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Expense Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Expense Trend
                </CardTitle>
                <CardDescription>Expense patterns over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount (₹)",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart data={dashboardStats.monthlyExpenseData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="var(--color-amount)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-amount)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Expense Categories
                </CardTitle>
                <CardDescription>Spending breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount (₹)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={dashboardStats.categoryExpenses}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {dashboardStats.categoryExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {dashboardStats.categoryExpenses.map((category, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="flex-1">{category.category}</span>
                      <span className="font-medium">₹{category.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/menu'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Menu
              </CardTitle>
              <CardDescription>
                Plan and manage weekly meal schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Menu</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/inventory'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Inventory
              </CardTitle>
              <CardDescription>
                Track stock levels and manage inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Inventory</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/finances'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Finances
              </CardTitle>
              <CardDescription>
                Monitor expenses and member payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Reports</Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and changes in your mess
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.recentActivities.length > 0 ? (
                dashboardStats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;