import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FilterBar from "@/components/FilterBar";
import StoreCard from "@/components/StoreCard";
import RatingModal from "@/components/RatingModal";
import { Loader2 } from "lucide-react";

interface Store {
  id: string;
  name: string;
  address: string;
  averageRating: number;
  userRating?: number;
}

interface UserDashboardProps {
  userId: string;
}

const UserDashboard = ({ userId }: UserDashboardProps) => {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  useEffect(() => {
    fetchStores();
  }, [userId]);

  useEffect(() => {
    filterStores();
  }, [searchTerm, stores]);

  const fetchStores = async () => {
    setLoading(true);

    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('*');

    if (storesError) {
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('*');

    if (ratingsError) {
      toast({
        title: "Error",
        description: "Failed to fetch ratings",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const storesWithRatings = storesData.map(store => {
      const storeRatings = ratingsData.filter(r => r.store_id === store.id);
      const averageRating = storeRatings.length > 0
        ? storeRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatings.length
        : 0;
      const userRating = storeRatings.find(r => r.user_id === userId)?.rating;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating,
        userRating,
      };
    });

    setStores(storesWithRatings);
    setLoading(false);
  };

  const filterStores = () => {
    const filtered = stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStores(filtered);
  };

  const handleRateStore = (store: Store) => {
    setSelectedStore(store);
    setIsRatingModalOpen(true);
  };

  const handleSubmitRating = async (rating: number) => {
    if (!selectedStore) return;

    const existingRating = selectedStore.userRating;

    if (existingRating) {
      const { error } = await supabase
        .from('ratings')
        .update({ rating })
        .eq('user_id', userId)
        .eq('store_id', selectedStore.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update rating",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rating Updated",
        description: `You updated your rating for ${selectedStore.name} to ${rating} stars`,
      });
    } else {
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: userId,
          store_id: selectedStore.id,
          rating,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit rating",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rating Submitted",
        description: `You rated ${selectedStore.name} ${rating} stars`,
      });
    }

    fetchStores();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Browse Stores
        </h1>
        <p className="text-muted-foreground">
          Find and rate your favorite stores
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by name or address..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onRate={() => handleRateStore(store)}
          />
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stores found matching your search</p>
        </div>
      )}

      {selectedStore && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSubmit={handleSubmitRating}
          storeName={selectedStore.name}
          currentRating={selectedStore.userRating}
          isEditing={selectedStore.userRating !== undefined && selectedStore.userRating > 0}
        />
      )}
    </div>
  );
};

export default UserDashboard;
