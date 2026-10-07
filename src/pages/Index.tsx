import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dumbbell,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  Camera,
  ShoppingBag,
  TrendingUp,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface OrderConfirmationState {
  orderConfirmed?: boolean;
  orderId?: string;
  customerName?: string;
  emailWarning?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check for order confirmation state and display toast
  useEffect(() => {
    const state = location.state as OrderConfirmationState | null;
    if (state?.orderConfirmed && state?.orderId) {
      if (state.emailWarning) {
        toast.success("Order Confirmed!", {
          description: `Order #${state.orderId} has been placed successfully. Your confirmation email may be delayed.`,
        });
      } else {
        toast.success("Order Confirmed!", {
          description: `Order #${state.orderId} has been placed successfully. Check your email for confirmation.`,
        });
      }

      // Clear the state to prevent re-showing on refresh
      navigate("/", { replace: true, state: {} });
    }
  }, [location, navigate]);

  const features = [
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "Monitor improvements and celebrate your achievements"
    },
    {
      icon: CheckCircle2,
      title: "Expert Tutorials",
      description: "Access YouTube guides when you need help"
    },
    {
      icon: Activity,
      title: "BMI Calculator",
      description: "Calculate your BMI and get quick tips"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center animate-pulse-glow">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Fitness Coach
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/membership")}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              Membership
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Personal Trainer</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Perfect Your{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Workout Form
            </span>
            <br />
            With AI Guidance
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get real-time feedback on your exercise form using advanced AI pose detection.
            Train smarter, prevent injuries, and achieve your fitness goals faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/pose-match")}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 text-lg px-8 py-6 gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/supplements")}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 bg-gradient-to-r from-green-600/10 to-cyan-600/10 border-green-500/50 hover:bg-green-600/20"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Supplements Store
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto justify-items-center"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const handleClick = () => {
              if (feature.title === "Track Your Progress") navigate("/progress");
              if (feature.title === "Expert Tutorials") navigate("/achievements");
              if (feature.title === "BMI Calculator") navigate("/bmi");
            };
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="w-full"
              >
                <Card
                  className="p-6 bg-card/50 backdrop-blur-sm border-border hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer h-full flex flex-col"
                  onClick={handleClick}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative container mx-auto px-4 py-20 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps and transform your workouts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              title: "Choose Exercise",
              description: "Select from our library of exercises tailored to your goals"
            },
            {
              step: "02",
              title: "Position Camera",
              description: "Allow camera access and position yourself in frame"
            },
            {
              step: "03",
              title: "Start Training",
              description: "Follow AI feedback for perfect form every rep"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-12 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Fitness Journey?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users perfecting their form and reaching their goals with AI-powered coaching
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 text-lg px-12 py-6"
            >
              Get Started For Free
            </Button>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
