import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, UserPlus, Edit3, Trash2, Mail, Phone } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Member {
  id: string
  user_id: string
  full_name: string | null
  phone: string | null
  role: string | null
  created_at: string
}

interface Payment {
  id: string
  member_id: string
  amount: number
  payment_date: string
  payment_method: string | null
  notes: string | null
}

export default function MemberManagement() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [userMessId, setUserMessId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'member'
  })

  const [paymentFormData, setPaymentFormData] = useState({
    member_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      fetchUserMessId()
    }
  }, [user])

  useEffect(() => {
    if (userMessId) {
      fetchMembers()
      fetchPayments()
    }
  }, [userMessId])

  const fetchUserMessId = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single()
      
      setUserMessId(profile?.mess_id || null)
    } catch (error) {
      console.error('Error fetching user mess ID:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('mess_id', userMessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('member_payments')
        .select('*')
        .eq('mess_id', userMessId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const handleUpdateMember = async () => {
    if (!selectedMember) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role
        })
        .eq('id', selectedMember.id)

      if (error) throw error

      toast.success('Member updated successfully')
      setDialogOpen(false)
      fetchMembers()
      
      // Log activity
      await supabase.from('activities').insert({
        mess_id: userMessId,
        user_id: user?.id,
        action: 'member_updated',
        description: `Updated member: ${formData.full_name}`,
        entity_type: 'member',
        entity_id: selectedMember.id
      })
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    }
  }

  const handleAddPayment = async () => {
    try {
      const { error } = await supabase
        .from('member_payments')
        .insert({
          mess_id: userMessId,
          member_id: paymentFormData.member_id,
          amount: parseFloat(paymentFormData.amount),
          payment_method: paymentFormData.payment_method,
          notes: paymentFormData.notes || null
        })

      if (error) throw error

      toast.success('Payment recorded successfully')
      setPaymentDialogOpen(false)
      setPaymentFormData({
        member_id: '',
        amount: '',
        payment_method: 'cash',
        notes: ''
      })
      fetchPayments()

      // Log activity
      const member = members.find(m => m.id === paymentFormData.member_id)
      await supabase.from('activities').insert({
        mess_id: userMessId,
        user_id: user?.id,
        action: 'payment_recorded',
        description: `Payment of ₹${paymentFormData.amount} recorded for ${member?.full_name}`,
        entity_type: 'payment',
        entity_id: paymentFormData.member_id
      })
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to record payment')
    }
  }

  const openMemberDialog = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      full_name: member.full_name || '',
      phone: member.phone || '',
      role: member.role || 'member'
    })
    setDialogOpen(true)
  }

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (!userMessId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">You need to be part of a mess to manage members.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Member Management</h1>
          <p className="text-muted-foreground">Manage mess members and track payments</p>
        </div>
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Member Payment</DialogTitle>
              <DialogDescription>
                Record a payment made by a mess member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member">Member</Label>
                <Select value={paymentFormData.member_id} onValueChange={(value) => 
                  setPaymentFormData(prev => ({ ...prev, member_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || 'Unnamed Member'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={paymentFormData.payment_method} onValueChange={(value) => 
                  setPaymentFormData(prev => ({ ...prev, payment_method: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPayment}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              members.map((member) => (
                <Card key={member.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {member.full_name || 'Unnamed Member'}
                        </CardTitle>
                      </div>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role || 'member'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Joined: {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMemberDialog(member)}
                        className="gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track all member payments and dues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => {
                  const member = members.find(m => m.id === payment.member_id)
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{member?.full_name || 'Unknown Member'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+₹{payment.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
                {payments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No payments recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, role: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateMember}>Update Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}