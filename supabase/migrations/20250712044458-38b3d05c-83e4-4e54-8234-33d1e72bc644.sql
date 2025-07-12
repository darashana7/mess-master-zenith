-- Phase 3: Operational Management Features

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'main', -- breakfast, lunch, dinner, snacks
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'groceries', -- groceries, vegetables, spices, etc.
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, liters, pieces, etc.
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  last_purchased TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  added_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'groceries', -- groceries, utilities, maintenance, etc.
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member payments table
CREATE TABLE public.member_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  member_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash', -- cash, upi, bank_transfer
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table for tracking changes
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'menu_updated', 'expense_added', 'payment_received', etc.
  description TEXT NOT NULL,
  entity_type TEXT, -- 'menu', 'expense', 'payment', 'inventory'
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menu_items
CREATE POLICY "Members can view menu items of their mess" ON public.menu_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = menu_items.mess_id
  )
);

CREATE POLICY "Admins and managers can manage menu items" ON public.menu_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.mess_id = menu_items.mess_id 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Create RLS policies for inventory_items
CREATE POLICY "Members can view inventory of their mess" ON public.inventory_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = inventory_items.mess_id
  )
);

CREATE POLICY "Admins and managers can manage inventory" ON public.inventory_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.mess_id = inventory_items.mess_id 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Create RLS policies for expenses
CREATE POLICY "Members can view expenses of their mess" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = expenses.mess_id
  )
);

CREATE POLICY "Admins and managers can manage expenses" ON public.expenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.mess_id = expenses.mess_id 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Create RLS policies for member_payments
CREATE POLICY "Members can view payments of their mess" ON public.member_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = member_payments.mess_id
  )
);

CREATE POLICY "Admins and managers can manage payments" ON public.member_payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.mess_id = member_payments.mess_id 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Create RLS policies for activities
CREATE POLICY "Members can view activities of their mess" ON public.activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = activities.mess_id
  )
);

CREATE POLICY "Users can create activities for their mess" ON public.activities
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.mess_id = activities.mess_id
  )
);

-- Create triggers for updating timestamps
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_payments_updated_at
BEFORE UPDATE ON public.member_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_menu_items_mess_id ON public.menu_items(mess_id);
CREATE INDEX idx_menu_items_day_of_week ON public.menu_items(day_of_week);
CREATE INDEX idx_inventory_items_mess_id ON public.inventory_items(mess_id);
CREATE INDEX idx_expenses_mess_id ON public.expenses(mess_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_member_payments_mess_id ON public.member_payments(mess_id);
CREATE INDEX idx_member_payments_member_id ON public.member_payments(member_id);
CREATE INDEX idx_activities_mess_id ON public.activities(mess_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);