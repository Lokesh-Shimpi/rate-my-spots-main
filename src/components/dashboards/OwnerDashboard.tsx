import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Users, Loader2 } from "lucide-react";

interface OwnerDashboardProps {
  userId: string;
}

const OwnerDashboard = ({ userId }: OwnerDashboardProps) => {
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [userId]);

  const fetchStoreData = async () => {
    setLoading(true);

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (storeError) {
      toast({
        title: "Error",
        description: "Failed to fetch store data",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!storeData) {
      toast({
        title: "No Store Found",
        description: "You don't have a store assigned to your account",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setStore(storeData);

    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq('store_id', storeData.id);

    if (ratingsError) {
      toast({
        title: "Error",
        description: "Failed to fetch ratings",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const avg = ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
      : 0;

    setAverageRating(avg);
    setRatings(ratingsData);
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No store assigned to your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Store Owner Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage and view your store's performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-elegant hover:shadow-glow transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">{store.name}</CardTitle>
            <CardDescription>{store.address}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contact Email</p>
              <p className="font-medium">{store.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Customer Ratings</CardTitle>
          </div>
          <CardDescription>View all customers who rated your store</CardDescription>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ratings yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell className="font-medium">
                        {rating.users?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{rating.users?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStars(rating.rating)}
                          <span className="text-sm font-medium">{rating.rating}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
