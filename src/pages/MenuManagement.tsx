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
import { Calendar, Plus, Edit, Trash2, ChefHat } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  day_of_week: number;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'];

const MenuManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'lunch',
    day_of_week: 0
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) return;

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('mess_id', profile.mess_id)
        .order('day_of_week', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching menu items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) throw new Error('No mess found');

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            description: formData.description || null,
            category: formData.category,
            day_of_week: formData.day_of_week
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Menu item updated",
          description: "The menu item has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert({
            mess_id: profile.mess_id,
            name: formData.name,
            description: formData.description || null,
            category: formData.category,
            day_of_week: formData.day_of_week
          });

        if (error) throw error;
        
        toast({
          title: "Menu item added",
          description: "New menu item has been added successfully."
        });
      }

      setFormData({ name: '', description: '', category: 'lunch', day_of_week: 0 });
      setIsAddingItem(false);
      setEditingItem(null);
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: editingItem ? "Error updating item" : "Error adding item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Menu item deleted",
        description: "The menu item has been deleted successfully."
      });
      
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      day_of_week: item.day_of_week
    });
    setIsAddingItem(true);
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    const day = item.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, MenuItem[]>);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Menu Management</h1>
              <p className="text-muted-foreground">Plan your weekly meals</p>
            </div>
          </div>
          
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', category: 'lunch', day_of_week: 0 });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the menu item details' : 'Add a new item to your weekly menu'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chicken Curry with Rice"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select value={formData.day_of_week.toString()} onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {DAYS.map((day, dayIndex) => (
            <Card key={dayIndex} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedItems[dayIndex]?.map(item => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {item.category}
                    </Badge>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">No items planned</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;