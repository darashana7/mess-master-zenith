import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { DollarSign, Target, AlertTriangle, TrendingUp, Plus, Edit2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  period: 'monthly' | 'weekly'
}

interface CategoryBudget {
  category: string
  budget: number
  spent: number
  percentage: number
  status: 'safe' | 'warning' | 'exceeded'
}

export default function BudgetTracker() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newAmount, setNewAmount] = useState('')

  useEffect(() => {
    if (user) {
      fetchBudgetData()
    }
  }, [user])

  const fetchBudgetData = async () => {
    try {
      setLoading(true)
      
      // Get user's mess
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single()

      if (!profile?.mess_id) return

      // Get current month expenses by category
      const currentMonth = new Date()
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('mess_id', profile.mess_id)
        .gte('expense_date', firstDay.toISOString().split('T')[0])

      // Sample budget data (in real app, this would come from a budgets table)
      const budgetData = [
        { category: 'groceries', budget: 15000, spent: 0 },
        { category: 'utilities', budget: 5000, spent: 0 },
        { category: 'maintenance', budget: 3000, spent: 0 },
        { category: 'other', budget: 2000, spent: 0 }
      ]

      // Calculate actual spending
      const categorySpending = expenses?.reduce((acc, expense) => {
        const category = expense.category || 'other'
        acc[category] = (acc[category] || 0) + Number(expense.amount)
        return acc
      }, {} as Record<string, number>) || {}

      // Update budget data with actual spending
      const updatedBudgets = budgetData.map(item => {
        const spent = categorySpending[item.category] || 0
        const percentage = (spent / item.budget) * 100
        const status: 'safe' | 'warning' | 'exceeded' = 
          percentage > 100 ? 'exceeded' : 
          percentage > 80 ? 'warning' : 'safe'
        
        return {
          ...item,
          spent,
          percentage,
          status
        }
      })

      setBudgets(updatedBudgets)
      setTotalBudget(budgetData.reduce((sum, b) => sum + b.budget, 0))
      setTotalSpent(Object.values(categorySpending).reduce((sum, s) => sum + s, 0))

    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const addBudget = () => {
    if (!newCategory || !newAmount) {
      toast.error('Please fill in all fields')
      return
    }

    const existingBudget = budgets.find(b => b.category.toLowerCase() === newCategory.toLowerCase())
    if (existingBudget) {
      toast.error('Budget for this category already exists')
      return
    }

    const newBudget: CategoryBudget = {
      category: newCategory,
      budget: Number(newAmount),
      spent: 0,
      percentage: 0,
      status: 'safe'
    }

    setBudgets([...budgets, newBudget])
    setTotalBudget(totalBudget + Number(newAmount))
    setNewCategory('')
    setNewAmount('')
    setShowAddBudget(false)
    toast.success('Budget added successfully')
  }

  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Monthly Budget Overview
              </CardTitle>
              <CardDescription>Track your spending against planned budgets</CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddBudget(!showAddBudget)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Budget</p>
                <p className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Remaining</p>
                <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{(totalBudget - totalSpent).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{totalPercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(totalPercentage, 100)} 
                className={`h-3 ${totalPercentage > 80 ? 'bg-red-100' : 'bg-green-100'}`}
              />
              {totalPercentage > 100 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Budget exceeded by ₹{(totalSpent - totalBudget).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Budget Form */}
      {showAddBudget && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., groceries"
                />
              </div>
              <div>
                <Label htmlFor="amount">Budget Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="15000"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={addBudget}>Add Budget</Button>
                <Button variant="outline" onClick={() => setShowAddBudget(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {budget.category}
                </CardTitle>
                <Badge 
                  variant={budget.status === 'safe' ? 'default' : 
                          budget.status === 'warning' ? 'secondary' : 'destructive'}
                >
                  {budget.status === 'safe' ? 'On Track' :
                   budget.status === 'warning' ? 'Warning' : 'Exceeded'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>₹{budget.spent.toLocaleString()} of ₹{budget.budget.toLocaleString()}</span>
                  <span>{budget.percentage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className={`h-2 ${
                    budget.status === 'exceeded' ? 'bg-red-100' :
                    budget.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}
                />
                <div className="text-sm text-muted-foreground">
                  Remaining: ₹{(budget.budget - budget.spent).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget vs Actual Chart */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget vs Actual Spending
            </CardTitle>
            <CardDescription>Compare planned vs actual spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                budget: {
                  label: "Budget (₹)",
                  color: "hsl(var(--primary))",
                },
                spent: {
                  label: "Spent (₹)", 
                  color: "hsl(var(--destructive))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={budgets}>
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="budget" fill="var(--color-budget)" name="Budget" />
                <Bar dataKey="spent" fill="var(--color-spent)" name="Spent" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}