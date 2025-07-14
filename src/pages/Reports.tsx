import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Package, Users, TrendingUp, Download } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface ReportData {
  totalExpenses: number
  totalMembers: number
  lowStockItems: number
  monthlyExpenses: Array<{ month: string; amount: number }>
  expensesByCategory: Array<{ category: string; amount: number }>
  recentActivities: Array<{ action: string; description: string; created_at: string }>
}

export default function Reports() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    totalExpenses: 0,
    totalMembers: 0,
    lowStockItems: 0,
    monthlyExpenses: [],
    expensesByCategory: [],
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchReportData()
    }
  }, [user])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Get user's profile to find their mess
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single()

      if (!profile?.mess_id) {
        setLoading(false)
        return
      }

      // Fetch total expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, created_at')
        .eq('mess_id', profile.mess_id)

      // Fetch member count
      const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .eq('mess_id', profile.mess_id)

      // Fetch low stock items
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('current_stock, minimum_stock')
        .eq('mess_id', profile.mess_id)

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('action, description, created_at')
        .eq('mess_id', profile.mess_id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Process data
      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
      const lowStockCount = inventory?.filter(item => item.current_stock <= item.minimum_stock).length || 0
      
      // Group expenses by category
      const categoryExpenses = expenses?.reduce((acc, exp) => {
        const category = exp.category || 'other'
        acc[category] = (acc[category] || 0) + Number(exp.amount)
        return acc
      }, {} as Record<string, number>) || {}

      const expensesByCategory = Object.entries(categoryExpenses).map(([category, amount]) => ({
        category,
        amount
      }))

      // Group expenses by month (last 6 months)
      const monthlyData = expenses?.reduce((acc, exp) => {
        const month = new Date(exp.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        acc[month] = (acc[month] || 0) + Number(exp.amount)
        return acc
      }, {} as Record<string, number>) || {}

      const monthlyExpenses = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount
      })).slice(-6)

      setReportData({
        totalExpenses,
        totalMembers: members?.length || 0,
        lowStockItems: lowStockCount,
        monthlyExpenses,
        expensesByCategory,
        recentActivities: activities || []
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    // Simple CSV export functionality
    const csvData = [
      ['Category', 'Amount'],
      ...reportData.expensesByCategory.map(item => [item.category, item.amount.toString()])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mess-expenses-report.csv'
    link.click()
    toast.success('Report exported successfully')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your mess performance and expenses</p>
        </div>
        <Button onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reportData.lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.round(reportData.totalExpenses / Math.max(reportData.monthlyExpenses.length, 1)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Breakdown of spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.expensesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="font-semibold">₹{item.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Spending trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.monthlyExpenses.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{item.month}</span>
                      </div>
                      <div className="font-semibold">₹{item.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest actions performed in your mess</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {reportData.recentActivities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}