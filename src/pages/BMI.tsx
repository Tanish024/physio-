import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BMICalculatorCard from "@/components/BMICalculatorCard";
import { Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BMIPage = () => {
  const navigate = useNavigate();

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
              <p className="text-sm text-muted-foreground">BMI Calculator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/progress")}>Track Your Progress</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/achievements")}>Achievements</Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-6 mb-6 bg-card/50 border-border text-center">
            <h2 className="text-4xl font-bold mb-2">Body Mass Index (BMI)</h2>
            <p className="text-muted-foreground">Calculate your BMI, view your category, and get quick tips.</p>
          </Card>

          <BMICalculatorCard />
        </motion.div>
      </section>
    </div>
  );
};

export default BMIPage;
