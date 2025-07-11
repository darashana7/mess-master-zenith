import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Mess {
  id: string;
  name: string;
  description: string;
  address: string;
}

interface MessJoinProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MessJoin({ onSuccess, onCancel }: MessJoinProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableMesses();
  }, []);

  const fetchAvailableMesses = async () => {
    try {
      const { data, error } = await supabase
        .from('mess')
        .select('*')
        .limit(10);

      if (error) throw error;
      setMesses(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching messes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMess = async (messId: string) => {
    if (!user) return;

    setJoining(messId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mess_id: messId,
          role: 'member'
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Successfully joined mess",
        description: "You are now a member of this mess."
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error joining mess",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading available messes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Join Existing Mess</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messes available to join at the moment.
            </div>
          ) : (
            messes.map((mess) => (
              <Card key={mess.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{mess.name}</h3>
                      {mess.description && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {mess.description}
                        </p>
                      )}
                      {mess.address && (
                        <p className="text-muted-foreground text-xs mt-2">
                          📍 {mess.address}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleJoinMess(mess.id)}
                      disabled={joining === mess.id}
                      size="sm"
                    >
                      {joining === mess.id ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}