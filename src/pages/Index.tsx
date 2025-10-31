import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Store, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="text-center space-y-6 max-w-3xl animate-fade-in">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-hero shadow-glow mb-4">
            <Star className="h-12 w-12 text-primary-foreground" fill="currentColor" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            StoreRater
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover, rate, and share your experiences with stores. Join our community of reviewers today.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={() => navigate("/signup")} variant="gradient" size="lg">
              Get Started
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg">
              Login
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 rounded-lg bg-card shadow-elegant">
              <Users className="h-8 w-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Community Driven</h3>
              <p className="text-sm text-muted-foreground">Join thousands of users sharing their store experiences</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-elegant">
              <Store className="h-8 w-8 text-secondary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Browse Stores</h3>
              <p className="text-sm text-muted-foreground">Explore stores and read authentic reviews</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-elegant">
              <Star className="h-8 w-8 text-accent mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Rate & Review</h3>
              <p className="text-sm text-muted-foreground">Share your honest ratings and help others decide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
