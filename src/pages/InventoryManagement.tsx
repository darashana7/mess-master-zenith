import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Plus, Edit, Trash2, AlertTriangle, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  supplier: string | null;
  last_purchased: string | null;
}

const CATEGORIES = ['groceries', 'vegetables', 'spices', 'dairy', 'meat', 'beverages', 'cleaning', 'other'];
const UNITS = ['kg', 'liters', 'pieces', 'packets', 'bottles', 'cans', 'bags'];

const InventoryManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'groceries',
    unit: 'kg',
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    supplier: ''
  });

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mess_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.mess_id) return;

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('mess_id', profile.mess_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching inventory",
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
          .from('inventory_items')
          .update({
            name: formData.name,
            category: formData.category,
            unit: formData.unit,
            current_stock: formData.current_stock,
            minimum_stock: formData.minimum_stock,
            cost_per_unit: formData.cost_per_unit,
            supplier: formData.supplier || null
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Item updated",
          description: "Inventory item has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert({
            mess_id: profile.mess_id,
            name: formData.name,
            category: formData.category,
            unit: formData.unit,
            current_stock: formData.current_stock,
            minimum_stock: formData.minimum_stock,
            cost_per_unit: formData.cost_per_unit,
            supplier: formData.supplier || null
          });

        if (error) throw error;
        
        toast({
          title: "Item added",
          description: "New inventory item has been added successfully."
        });
      }

      setFormData({
        name: '',
        category: 'groceries',
        unit: 'kg',
        current_stock: 0,
        minimum_stock: 0,
        cost_per_unit: 0,
        supplier: ''
      });
      setIsAddingItem(false);
      setEditingItem(null);
      fetchInventoryItems();
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
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully."
      });
      
      fetchInventoryItems();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      cost_per_unit: item.cost_per_unit,
      supplier: item.supplier || ''
    });
    setIsAddingItem(true);
  };

  const filteredItems = inventoryItems.filter(item => {
    if (filter === 'low-stock') return item.current_stock <= item.minimum_stock;
    if (filter === 'out-of-stock') return item.current_stock === 0;
    if (filter !== 'all') return item.category === filter;
    return true;
  });

  const lowStockItems = inventoryItems.filter(item => item.current_stock <= item.minimum_stock && item.current_stock > 0);
  const outOfStockItems = inventoryItems.filter(item => item.current_stock === 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Inventory Management</h1>
              <p className="text-muted-foreground">Track your stock levels and supplies</p>
            </div>
          </div>
          
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  category: 'groceries',
                  unit: 'kg',
                  current_stock: 0,
                  minimum_stock: 0,
                  cost_per_unit: 0,
                  supplier: ''
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the inventory item details' : 'Add a new item to your inventory'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basmati Rice"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minimum_stock">Minimum Stock</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimum_stock}
                      onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cost_per_unit">Cost per Unit (₹)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Optional supplier name"
                  />
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

        {/* Alert Cards */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {outOfStockItems.length > 0 && (
              <Card className="border-destructive">
                <CardHeader className="pb-3">
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Out of Stock ({outOfStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {outOfStockItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <Badge variant="destructive" className="text-xs">0 {item.unit}</Badge>
                    </div>
                  ))}
                  {outOfStockItems.length > 3 && (
                    <p className="text-muted-foreground mt-2">+{outOfStockItems.length - 3} more items</p>
                  )}
                </CardContent>
              </Card>
            )}
            
            {lowStockItems.length > 0 && (
              <Card className="border-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Low Stock ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {lowStockItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <Badge variant="secondary" className="text-xs">{item.current_stock} {item.unit}</Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-muted-foreground mt-2">+{lowStockItems.length - 3} more items</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className={`${item.current_stock === 0 ? 'border-destructive' : item.current_stock <= item.minimum_stock ? 'border-yellow-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Stock:</span>
                    <span className={`font-medium ${item.current_stock === 0 ? 'text-destructive' : item.current_stock <= item.minimum_stock ? 'text-yellow-600' : ''}`}>
                      {item.current_stock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Stock:</span>
                    <span>{item.minimum_stock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Unit:</span>
                    <span>₹{item.cost_per_unit}</span>
                  </div>
                  {item.supplier && (
                    <div className="flex justify-between">
                      <span>Supplier:</span>
                      <span className="text-xs">{item.supplier}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'Start by adding your first inventory item.' : 'No items match the current filter.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;