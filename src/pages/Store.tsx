import { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, Menu, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard, Product } from "@/components/ProductCard";
import { ShoppingCart as CartComponent } from "@/components/ShoppingCart";
import { CategoryFilter } from "@/components/CategoryFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

// Using placeholder images so this works without copying binary assets
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1579722820308-85824b6a3bd3?q=80&w=1600&auto=format&fit=crop",
  protein: "https://images.unsplash.com/photo-1598966626063-5cddfdcdd8ac?q=80&w=1200&auto=format&fit=crop",
  preworkout: "https://images.unsplash.com/photo-1585238342028-4bbc6df4d0e1?q=80&w=1200&auto=format&fit=crop",
  vitamins: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  bcaa: "https://images.unsplash.com/photo-1585237663117-1b3724a0d1d4?q=80&w=1200&auto=format&fit=crop",
  massGainer: "https://images.unsplash.com/photo-1585237012855-9893a443f06a?q=80&w=1200&auto=format&fit=crop",
  creatine: "https://images.unsplash.com/photo-1604335398428-0f79d5e8d4c1?q=80&w=1200&auto=format&fit=crop",
} as const;

const products: Product[] = [
  {
    id: "1",
    name: "Premium Whey Protein",
    price: 49.99,
    originalPrice: 69.99,
    image: IMAGES.protein,
    category: "Protein",
    rating: 4.8,
    reviews: 324,
    badge: "Best Seller",
    description: "High-quality whey protein isolate for muscle growth and recovery",
  },
  {
    id: "2",
    name: "Pre-Workout Energy Boost",
    price: 39.99,
    image: IMAGES.preworkout,
    category: "Pre-Workout",
    rating: 4.6,
    reviews: 256,
    description: "Enhanced energy and focus for intense workout sessions",
  },
  {
    id: "3",
    name: "Daily Multivitamin",
    price: 29.99,
    originalPrice: 39.99,
    image: IMAGES.vitamins,
    category: "Vitamins",
    rating: 4.7,
    reviews: 189,
    description: "Complete vitamin and mineral support for overall health",
  },
  {
    id: "4",
    name: "BCAA Recovery Formula",
    price: 34.99,
    image: IMAGES.bcaa,
    category: "BCAA",
    rating: 4.5,
    reviews: 142,
    badge: "New",
    description: "Branched-chain amino acids for faster muscle recovery",
  },
  {
    id: "5",
    name: "Mass Gainer Pro",
    price: 59.99,
    originalPrice: 79.99,
    image: IMAGES.massGainer,
    category: "Mass Gainer",
    rating: 4.9,
    reviews: 412,
    description: "High-calorie formula for serious muscle and weight gain",
  },
  {
    id: "6",
    name: "Creatine Monohydrate",
    price: 24.99,
    image: IMAGES.creatine,
    category: "Creatine",
    rating: 4.8,
    reviews: 378,
    badge: "Best Seller",
    description: "Pure creatine for strength and power enhancement",
  },
];

const Store = () => {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<(Product & { quantity: number })[]>([]);

  // If an external Supplements Store URL is configured, redirect there
  const targetUrl = useMemo(() => {
    const envUrl = (import.meta as any).env?.VITE_SUPPLEMENT_STORE_URL as string | undefined;
    return envUrl && envUrl.trim() ? envUrl.trim() : undefined;
  }, []);

  useEffect(() => {
    if (targetUrl) {
      window.location.replace(targetUrl);
    }
  }, [targetUrl]);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredProducts = products
    .filter((p) => selectedCategory === "All" || p.category === selectedCategory)
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return b.reviews - a.reviews;
    }
  });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
              <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                FitSupps
              </h1>
              <nav className="hidden md:flex gap-6">
                <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                  Shop
                </a>
                <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                  Workouts
                </a>
                <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                  Nutrition
                </a>
              </nav>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 gradient-primary text-primary-foreground text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative h-[400px] flex items-center justify-center text-center bg-cover bg-center"
        style={{ backgroundImage: `url(${IMAGES.hero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-white">
          <h2 className="text-5xl font-bold mb-4 animate-slide-up">
            Fuel Your Fitness Journey
          </h2>
          <p className="text-xl mb-8 text-white/90 animate-slide-up">
            Premium supplements for serious athletes
          </p>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 animate-scale-in text-lg px-8"
          >
            Shop Now
          </Button>
        </div>
      </section>

      {/* Promotional Banner */}
      <div className="gradient-success py-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-accent-foreground font-semibold">
            🎉 Free shipping on orders over $50! Limited time offer
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search supplements..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <CategoryFilter
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory === "All" ? "All Products" : selectedCategory}
                <span className="text-muted-foreground ml-2">
                  ({sortedProducts.length})
                </span>
              </h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Filter */}
            {mobileFilterOpen && (
              <div className="lg:hidden mb-6 p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CategoryFilter
                  selected={selectedCategory}
                  onSelect={(cat) => {
                    setSelectedCategory(cat);
                    setMobileFilterOpen(false);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Shopping Cart */}
      <CartComponent
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default Store;
