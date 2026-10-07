import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, ChevronLeft, Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Import images
import proteinImage from "@/assets/supplements/protein-powder.jpg";
import preWorkoutImage from "@/assets/supplements/pre-workout.jpg";
import vitaminsImage from "@/assets/supplements/vitamins.jpg";
import bcaaImage from "@/assets/supplements/bcaa.jpg";
import massGainerImage from "@/assets/supplements/mass-gainer.jpg";
import creatineImage from "@/assets/supplements/creatine.jpg";

const productData = {
  "1": {
    id: "1",
    name: "Premium Whey Protein",
    price: 49.99,
    originalPrice: 69.99,
    images: [proteinImage],
    category: "Protein",
    rating: 4.8,
    reviews: 324,
    badge: "Best Seller",
    description: "High-quality whey protein isolate for muscle growth and recovery",
    fullDescription: "Our Premium Whey Protein is formulated with the highest quality whey protein isolate to support muscle growth, recovery, and overall fitness goals. Each serving delivers 25g of pure protein with minimal carbs and fat.",
    benefits: [
      "25g of protein per serving",
      "Fast-absorbing whey isolate",
      "Supports muscle growth and recovery",
      "Low in carbs and fat",
      "Delicious flavors available"
    ],
    supplementFacts: {
      servingSize: "1 scoop (30g)",
      servingsPerContainer: "30",
      calories: "120",
      protein: "25g",
      carbs: "2g",
      fat: "1g",
    },
    ingredients: "Whey Protein Isolate, Natural Flavors, Cocoa Powder, Stevia Extract, Sunflower Lecithin",
    usage: "Mix 1 scoop with 8-10oz of water or milk. Consume post-workout or between meals for optimal results.",
  },
  "2": {
    id: "2",
    name: "Pre-Workout Energy Boost",
    price: 39.99,
    images: [preWorkoutImage],
    category: "Pre-Workout",
    rating: 4.6,
    reviews: 256,
    description: "Enhanced energy and focus for intense workout sessions",
    fullDescription: "Our Pre-Workout Energy Boost is designed to maximize your training intensity with a powerful blend of caffeine, beta-alanine, and other performance-enhancing ingredients.",
    benefits: [
      "Increased energy and focus",
      "Enhanced workout performance",
      "Improved endurance",
      "Better muscle pumps",
      "Great tasting formula"
    ],
    supplementFacts: {
      servingSize: "1 scoop (15g)",
      servingsPerContainer: "30",
      calories: "10",
      caffeine: "200mg",
      betaAlanine: "3g",
      citrulline: "2g",
    },
    ingredients: "Caffeine Anhydrous, Beta-Alanine, L-Citrulline, Natural Flavors, Citric Acid, Stevia Extract",
    usage: "Mix 1 scoop with 8oz of water and consume 15-30 minutes before workout. Do not exceed 1 serving per day.",
  },
  "3": {
    id: "3",
    name: "Daily Multivitamin",
    price: 29.99,
    originalPrice: 39.99,
    images: [vitaminsImage],
    category: "Vitamins",
    rating: 4.7,
    reviews: 189,
    description: "Complete vitamin and mineral support for overall health",
    fullDescription: "Our Daily Multivitamin provides comprehensive nutritional support with essential vitamins and minerals to fill gaps in your diet and support optimal health.",
    benefits: [
      "Complete vitamin and mineral profile",
      "Supports immune system",
      "Boosts energy levels",
      "Promotes overall wellness",
      "Easy-to-swallow capsules"
    ],
    supplementFacts: {
      servingSize: "2 capsules",
      servingsPerContainer: "30",
      vitaminC: "90mg",
      vitaminD: "1000IU",
      vitaminB12: "6mcg",
      iron: "18mg",
    },
    ingredients: "Vitamin C, Vitamin D3, Vitamin B12, Iron, Calcium, Magnesium, Zinc, and other essential vitamins and minerals",
    usage: "Take 2 capsules daily with food or as directed by your healthcare professional.",
  },
};

const SupplementsProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  const product = productData[id as keyof typeof productData] || productData["1"];

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
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => navigate("/supplements")} className="hover:text-primary transition-colors">
            Supplements
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12">
        <button 
          onClick={() => navigate("/supplements")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to supplements
        </button>

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
                <Badge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  -{discount}% OFF
                </Badge>
              )}
              <img
                src={product.images[0]}
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
              <p className="text-lg text-muted-foreground">{product.fullDescription}</p>
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
                className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg transition-all duration-300 text-lg h-14"
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

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition Facts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Product Description</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {product.fullDescription}
              </p>
              <h4 className="font-semibold mb-2">Ingredients:</h4>
              <p className="text-muted-foreground">{product.ingredients}</p>
              <h4 className="font-semibold mt-4 mb-2">How to Use:</h4>
              <p className="text-muted-foreground">{product.usage}</p>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Key Benefits</h3>
              <ul className="space-y-3">
                {product.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Supplement Facts</h3>
              <div className="space-y-2">
                {Object.entries(product.supplementFacts).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-border">
                    <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className="w-4 h-4 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <span className="font-semibold">John D.</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Verified Purchase</span>
                  </div>
                  <span className="text-sm text-muted-foreground">2 weeks ago</span>
                </div>
                <p className="text-muted-foreground">
                  Excellent product! Noticed significant improvements in my recovery time and muscle growth. 
                  The taste is great and it mixes well. Highly recommend!
                </p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplementsProductDetail;