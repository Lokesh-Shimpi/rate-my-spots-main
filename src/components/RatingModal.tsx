import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  storeName: string;
  currentRating?: number;
  isEditing?: boolean;
}

const RatingModal = ({ isOpen, onClose, onSubmit, storeName, currentRating, isEditing }: RatingModalProps) => {
  const [selectedRating, setSelectedRating] = useState(currentRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
      onClose();
      setSelectedRating(currentRating || 0);
      setHoverRating(0);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedRating(currentRating || 0);
    setHoverRating(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Update Rating" : "Rate Store"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Update your rating for ${storeName}` : `Rate your experience at ${storeName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-12 w-12 transition-all duration-200",
                    (hoverRating >= star || (hoverRating === 0 && selectedRating >= star))
                      ? "fill-primary text-primary scale-110"
                      : "text-muted"
                  )}
                />
              </button>
            ))}
          </div>
          
          {selectedRating > 0 && (
            <p className="text-sm text-muted-foreground animate-fade-in">
              {selectedRating} {selectedRating === 1 ? 'star' : 'stars'} selected
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={selectedRating === 0}
            variant="gradient"
          >
            {isEditing ? "Update Rating" : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
