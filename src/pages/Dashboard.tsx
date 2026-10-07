import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dumbbell, 
  Zap, 
  Target, 
  TrendingUp,
  Activity,
  LogOut,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const exercises = [
  {
    id: "plank",
    name: "Plank",
    category: "Core Strength",
    difficulty: "Beginner",
    duration: "30-60s",
    icon: Activity,
    color: "from-primary to-warning",
    description: "Build core stability and strength"
  },
  {
    id: "squat",
    name: "Squats",
    category: "Lower Body",
    difficulty: "Beginner",
    duration: "10-15 reps",
    icon: Dumbbell,
    color: "from-secondary to-accent",
    description: "Strengthen legs and glutes"
  },
  {
    id: "pushup",
    name: "Push-ups",
    category: "Upper Body",
    difficulty: "Intermediate",
    duration: "8-12 reps",
    icon: Zap,
    color: "from-accent to-success",
    description: "Build chest and arm strength"
  },
  {
    id: "lunge",
    name: "Lunges",
    category: "Lower Body",
    difficulty: "Beginner",
    duration: "10 reps each",
    icon: Target,
    color: "from-success to-primary",
    description: "Improve balance and leg power"
  },
  {
    id: "jumping-jack",
    name: "Jumping Jacks",
    category: "Full Body",
    difficulty: "Beginner",
    duration: "30-45s",
    icon: TrendingUp,
    color: "from-warning to-secondary",
    description: "Cardio and full body warmup"
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Check auth and redirect if not logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Fetch user profile
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const startWorkout = (exerciseId: string) => {
    navigate(`/workout/${exerciseId}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                AI Fitness Coach
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.full_name || "Champion"}!
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/progress")}>Track Your Progress</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/achievements")}>Achievements</Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Choose Your Exercise
          </h2>
          <p className="text-xl text-muted-foreground">
            Perfect your form with AI-powered real-time feedback
          </p>
        </motion.div>

        {/* Exercise Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
        >
          {exercises.map((exercise) => {
            const Icon = exercise.icon;
            return (
              <motion.div key={exercise.id} variants={item}>
                <Card className="group hover:scale-105 transition-all duration-300 bg-card border-border overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-primary/20">
                  <div className={`h-2 bg-gradient-to-r ${exercise.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${exercise.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                        {exercise.difficulty}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-2">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {exercise.category}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {exercise.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {exercise.duration}
                      </span>
                      <Button
                        onClick={() => startWorkout(exercise.id)}
                        size="sm"
                        className={`bg-gradient-to-r ${exercise.color} text-white border-0 hover:opacity-90 gap-2`}
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
