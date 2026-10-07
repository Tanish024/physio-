import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Protein",
  "Pre-Workout",
  "Vitamins",
  "BCAA",
  "Mass Gainer",
  "Creatine",
  "Post-Workout",
  "Weight Loss",
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg mb-4">Categories</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className={cn(
                "w-full justify-between hover:bg-primary/10 transition-colors",
                selected === category && "bg-primary/10 text-primary font-semibold"
              )}
              onClick={() => onSelect(category)}
            >
              <span>{category}</span>
              {selected === category && <Check className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};