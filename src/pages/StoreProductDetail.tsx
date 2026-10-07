import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Use same image URLs as the Store listing
const IMAGES = {
  protein: "https://images.unsplash.com/photo-1598966626063-5cddfdcdd8ac?q=80&w=1200&auto=format&fit=crop",
  preworkout: "https://images.unsplash.com/photo-1585238342028-4bbc6df4d0e1?q=80&w=1200&auto=format&fit=crop",
  vitamins: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  bcaa: "https://images.unsplash.com/photo-1585237663117-1b3724a0d1d4?q=80&w=1200&auto=format&fit=crop",
  massGainer: "https://images.unsplash.com/photo-1585237012855-9893a443f06a?q=80&w=1200&auto=format&fit=crop",
  creatine: "https://images.unsplash.com/photo-1604335398428-0f79d5e8d4c1?q=80&w=1200&auto=format&fit=crop",
} as const;

const productData = {
  "1": {
    id: "1",
    name: "Premium Whey Protein",
    price: 49.99,
    originalPrice: 69.99,
    images: [IMAGES.protein],
    category: "Protein",
    rating: 4.8,
    reviews: 324,
    badge: "Best Seller",
    description: "High-quality whey protein isolate for muscle growth and recovery",
    fullDescription:
      "Our Premium Whey Protein is formulated with the highest quality whey protein isolate to support muscle growth, recovery, and overall fitness goals. Each serving delivers 25g of pure protein with minimal carbs and fat.",
    benefits: [
      "25g of protein per serving",
      "Fast-absorbing whey isolate",
      "Supports muscle growth and recovery",
      "Low in carbs and fat",
      "Delicious flavors available",
    ],
    supplementFacts: {
      servingSize: "1 scoop (30g)",
      servingsPerContainer: "30",
      calories: "120",
      protein: "25g",
      carbs: "2g",
      fat: "1g",
    },
    ingredients:
      "Whey Protein Isolate, Natural Flavors, Cocoa Powder, Stevia Extract, Sunflower Lecithin",
    usage:
      "Mix 1 scoop with 8-10oz of water or milk. Consume post-workout or between meals for optimal results.",
  },
  "2": {
    id: "2",
    name: "Pre-Workout Energy Boost",
    price: 39.99,
    images: [IMAGES.preworkout],
    category: "Pre-Workout",
    rating: 4.6,
    reviews: 256,
    description: "Enhanced energy and focus for intense workout sessions",
    fullDescription:
      "A balanced pre-workout formula designed to increase energy, focus, and endurance without the crash.",
    benefits: ["Smooth energy", "Improved focus", "Great taste"],
    supplementFacts: { servingSize: "1 scoop (12g)", servingsPerContainer: "30" },
    ingredients: "Caffeine, Beta-Alanine, L-Citrulline, Natural Flavors",
    usage: "Mix 1 scoop with 10-12oz of water 20 minutes before training.",
  },
} as const;

const StoreProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const product = (productData as any)[id ?? "1"] ?? productData["1"];

  const handleAddToCart = () => {
    toast({
      title: "Added to cart!",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button onClick={() => navigate("/store")} variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to products
            </Button>
            <Link to="/store">
              <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">FitSupps</h1>
            </Link>
            <div />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {product.badge && (
                <Badge className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground">
                  {product.badge}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 z-10 gradient-primary text-primary-foreground">
                  -{discount}% OFF
                </Badge>
              )}
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-lg text-muted-foreground">{product.fullDescription ?? product.description}</p>
            </div>

            <Separator />

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 text-lg h-14"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart - ${(product.price * quantity).toFixed(2)}
              </Button>

              <div className="p-4 rounded-lg bg-accent/10 border border-accent">
                <p className="text-sm text-accent-foreground font-semibold">
                  ✓ Free shipping on orders over $50
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="benefits">
            <TabsList>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="facts">Supplement Facts</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="benefits" className="space-y-2">
              {(product.benefits ?? []).map((b: string, idx: number) => (
                <p key={idx} className="text-sm text-muted-foreground">• {b}</p>
              ))}
            </TabsContent>
            <TabsContent value="facts" className="space-y-2">
              {product.supplementFacts ? (
                Object.entries(product.supplementFacts).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No supplement facts available.</p>
              )}
            </TabsContent>
            <TabsContent value="usage">
              <p className="text-sm text-muted-foreground">{product.usage ?? "Use as directed."}</p>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default StoreProductDetail;
