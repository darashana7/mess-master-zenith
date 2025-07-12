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
import { ChefHat, Users, Calendar, DollarSign, Package, TrendingUp, Plus, Settings } from 'lucide-react';

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'create-mess' | 'join-mess'>('dashboard');

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
      value: "142",
      icon: Users,
      change: "+5 this month"
    },
    {
      title: "Monthly Expenses",
      value: "₹45,230",
      icon: DollarSign,
      change: "-8% from last month"
    },
    {
      title: "Menu Items",
      value: "28",
      icon: Calendar,
      change: "4 new items added"
    },
    {
      title: "Stock Items",
      value: "156",
      icon: Package,
      change: "12 items low stock"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{mess?.name || 'Mess Management'}</h1>
              <p className="text-sm text-muted-foreground">Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{profile.role}</Badge>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Menu updated for next week</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock alert: Rice (5kg remaining)</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New member joined: John Doe</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;