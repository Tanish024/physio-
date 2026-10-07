import { useEffect, useState } from "react";
import { Search, ShoppingCart, Menu, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard, Product } from "@/components/supplements/ProductCard";
import { SupplementsShoppingCart } from "@/components/supplements/SupplementsShoppingCart";
import { CategoryFilter } from "@/components/supplements/CategoryFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
// Images
import heroImage from "@/assets/supplements/hero-supplements.jpg";
import proteinImage from "@/assets/supplements/protein-powder.jpg";
import preWorkoutImage from "@/assets/supplements/pre-workout.jpg";
import vitaminsImage from "@/assets/supplements/vitamins.jpg";
import bcaaImage from "@/assets/supplements/bcaa.jpg";
import massGainerImage from "@/assets/supplements/mass-gainer.jpg";
import creatineImage from "@/assets/supplements/creatine.jpg";
const products: Product[] = [
  {
    id: "1",
    name: "Premium Whey Protein",
    price: 49.99,
    originalPrice: 69.99,
    image: proteinImage,
    category: "Protein",
    rating: 4.8,
    reviews: 324,
    badge: "Best Seller",
    description: "High quality whey protein isolate for muscle growth and recovery",
  },
  {
    id: "2",
    name: "Pre-Workout Energy Boost",
    price: 39.99,
    image: preWorkoutImage,
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
    image: vitaminsImage,
    category: "Vitamins",
    rating: 4.7,
    reviews: 189,
    description: "Complete vitamin and mineral support for overall health",
  },
  {
    id: "4",
    name: "BCAA Recovery Formula",
    price: 34.99,
    image: bcaaImage,
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
    image: massGainerImage,
    category: "Mass Gainer",
    rating: 4.9,
    reviews: 412,
    description: "High-calorie formula for serious muscle and weight gain",
  },
  {
    id: "6",
    name: "Creatine Monohydrate",
    price: 24.99,
    image: creatineImage,
    category: "Creatine",
    rating: 4.8,
    reviews: 378,
    badge: "Best Seller",
    description: "Pure creatine for strength and power enhancement",
  },
];

const Supplements = () => {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<(Product & { quantity: number })[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("supp_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
    } catch {}
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("supp_cart", JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                FitSupps Store
              </h1>
              <nav className="hidden md:flex gap-6">
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate("/pose-match")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Workouts
                </button>
                <button 
                  onClick={() => navigate("/progress")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Track Progress
                </button>
                <button 
                  onClick={() => navigate("/achievements")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Achievements
                </button>
                <button 
                  onClick={() => navigate("/supplements")}
                  className="text-sm font-medium text-primary"
                >
                  Supplements
                </button>
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
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs">
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
        style={{ backgroundImage: `url(${heroImage})` }}
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
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg transition-all duration-300 text-lg px-8"
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Shop Now
          </Button>
        </div>
      </section>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-green-600/20 to-cyan-600/20 py-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-foreground font-semibold">
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

            <div id="products" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
      <SupplementsShoppingCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default Supplements;