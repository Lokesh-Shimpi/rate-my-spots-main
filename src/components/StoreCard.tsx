import { Star, MapPin, Mail } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoreCardProps {
  store: {
    id: string;
    name: string;
    address: string;
    email?: string;
    averageRating: number;
    userRating?: number;
  };
  onRate?: () => void;
  isAdmin?: boolean;
}

const StoreCard = ({ store, onRate, isAdmin }: StoreCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4 transition-colors",
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="group transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
          {store.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <span>{store.address}</span>
        </div>
        
        {isAdmin && store.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0 text-secondary" />
            <span>{store.email}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
            <div className="flex items-center gap-2">
              {renderStars(Math.round(store.averageRating))}
              <span className="text-sm font-medium">
                {store.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      {!isAdmin && (
        <CardFooter className="flex flex-col gap-2">
          {store.userRating !== undefined && store.userRating > 0 ? (
            <>
              <div className="w-full flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Rating:</span>
                <div className="flex items-center gap-2">
                  {renderStars(store.userRating)}
                  <span className="font-medium">{store.userRating}/5</span>
                </div>
              </div>
              <Button
                onClick={onRate}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Modify Rating
              </Button>
            </>
          ) : (
            <Button
              onClick={onRate}
              variant="gradient"
              className="w-full"
              size="sm"
            >
              Submit Rating
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default StoreCard;
