import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, LogOut } from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    role: string;
  } | null;
}

const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero shadow-elegant">
            <Star className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="bg-gradient-hero bg-clip-text text-xl font-bold text-transparent">
            StoreRater
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => navigate("/login")} variant="ghost" size="sm">
              Login
            </Button>
            <Button onClick={() => navigate("/signup")} variant="gradient" size="sm">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
