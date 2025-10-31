import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const FilterBar = ({ searchTerm, onSearchChange, placeholder = "Search..." }: FilterBarProps) => {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 transition-shadow focus:shadow-md"
      />
    </div>
  );
};

export default FilterBar;
