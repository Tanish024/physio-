import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const plans = [
  {
    id: "basic",
    title: "Basic Membership",
    price: "₹0 / month",
    highlight: false,
    description: "Access the app and community basics for free.",
    features: [
      "Access to tutorials",
      "Form guidance (limited)",
      "Community support",
      "Basic gym locator"
    ],
  },
  {
    id: "premium",
    title: "Premium Membership",
    price: "₹499 / month",
    highlight: true,
    description: "Unlock personal trainer access and premium analytics.",
    features: [
      "1:1 trainer check-ins",
      "Advanced progress tracking",
      "Priority support",
      "Advanced gym finder with reviews",
      "Gym recommendations based on location"
    ],
  },
];

const Membership = () => {
  const navigate = useNavigate();

  const buy = (planId: string) => {
    // In a real flow, start checkout here, then redirect on success
    navigate("/membership-details", { state: { planId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/") }>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI Fitness Coach
              </h1>
              <p className="text-sm text-muted-foreground">Membership Plans</p>
            </div>
          </div>
        </div>
      </header>

      {/* Plans */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-10">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`p-6 bg-card/50 border-border ${plan.highlight ? "ring-1 ring-primary/40" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center`}>
                      {plan.highlight ? (
                        <Crown className="w-6 h-6 text-primary-foreground" />
                      ) : (
                        <Dumbbell className="w-6 h-6 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{plan.title}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{plan.price}</div>
                </div>
                <ul className="text-sm text-muted-foreground list-disc pl-6 mb-6">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <Button onClick={() => buy(plan.id)} className="gap-2">{plan.highlight ? "Buy Premium" : "Activate Free"}</Button>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Membership;
