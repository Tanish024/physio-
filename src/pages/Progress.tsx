import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DailyPoint {
  date: string;
  sessions: number;
}

interface DistPoint {
  name: string;
  value: number;
}

const COLORS = ["#6366F1", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#14B8A6"]; // Tailwind palette

const ProgressPage = () => {
  const navigate = useNavigate();
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [dist, setDist] = useState<DistPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 27); // last 28 days
    return {
      startISO: format(start, "yyyy-MM-dd"),
      endISO: format(end, "yyyy-MM-dd"),
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Get workout sessions from Supabase
        const { data: history, error: historyError } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false })
          .limit(500);

        if (historyError) {
          throw historyError;
        }

        const byDate: Record<string, number> = {};
        const byExercise: Record<string, number> = {};
        
        history?.forEach((s: any) => {
          const ts = s.completed_at || s.created_at;
          if (ts) {
            const key = String(ts).slice(0, 10); // yyyy-mm-dd
            byDate[key] = (byDate[key] || 0) + 1;
          }
          const name = s.exercise_name || "Other";
          byExercise[name] = (byExercise[name] || 0) + 1;
        });
        
        // Normalize to full range (fill missing with 0)
        const days: DailyPoint[] = [];
        const end = new Date(range.endISO);
        const start = new Date(range.startISO);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = format(d, "yyyy-MM-dd");
          days.push({ date: format(d, "MMM d"), sessions: byDate[key] || 0 });
        }
        
        // Distribution for pie chart from history aggregation
        const distPoints: DistPoint[] = Object.keys(byExercise).map((k) => ({ name: k, value: byExercise[k] }));

        if (!mounted) return;
        setDaily(days);
        setDist(distPoints);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || "Failed to load progress data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [range]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Track Your Progress
          </h1>
          <div />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-20">Loading…</div>
        ) : error ? (
          <Card className="p-8 text-center max-w-md mx-auto">
            <div className="text-destructive mb-4">{error}</div>
            {error === "Not authenticated" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Please sign in to view your workout progress and statistics.</p>
                <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-secondary">
                  Sign In
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border-border lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Sessions over time (last 28 days)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sessions" stroke="#6366F1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold mb-4">Exercise type distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {dist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ProgressPage;
