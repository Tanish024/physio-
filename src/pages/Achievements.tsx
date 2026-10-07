import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Flame, Clock, Trophy, Youtube } from "lucide-react";
import { AchievementAPI, TutorialAPI, WorkoutAPI } from "@/lib/api";
import { format, isSameDay, subDays } from "date-fns";

// Using a flexible type because API row shape may differ by project schema
type UserAchievement = any;

interface TutorialItem {
  id?: string;
  title: string;
  url: string;
  category: "Gym" | "Yoga" | "Fitness" | string;
}

const curatedTutorials: TutorialItem[] = [
  { title: "Proper Squat Form", url: "https://www.youtube.com/watch?v=aclHkVaku9U", category: "Gym" },
  { title: "Push-up Basics", url: "https://www.youtube.com/watch?v=IODxDxX7oi4", category: "Gym" },
  { title: "Beginner Yoga Flow", url: "https://www.youtube.com/watch?v=v7AYKMP6rOE", category: "Yoga" },
  { title: "Sun Salutation A", url: "https://www.youtube.com/watch?v=mZg4P5LhXzM", category: "Yoga" },
  { title: "Full-Body Warm Up", url: "https://www.youtube.com/watch?v=R0mMyV5OtcM", category: "Fitness" },
  { title: "HIIT for Beginners", url: "https://www.youtube.com/watch?v=ml6cT4AZdqI", category: "Fitness" },
];

const AchievementsPage = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived stats
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalTime, setTotalTime] = useState(0); // seconds

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user achievements (gracefully handle missing table)
        let userAch: UserAchievement[] = [];
        try {
          userAch = await AchievementAPI.getUserAchievements();
        } catch (e) {
          // If the project doesn't have user_achievements yet, show empty badges
          userAch = [];
        }

        // Load tutorials from backend if available; else curated
        let tuts: TutorialItem[] = [];
        try {
          const rows = await TutorialAPI.getAll();
          if (rows && rows.length) {
            tuts = rows.map((r: any) => ({ id: r.id, title: r.title || r.name, url: r.url, category: r.category || "Fitness" }));
          } else {
            tuts = curatedTutorials;
          }
        } catch {
          tuts = curatedTutorials;
        }

        // Compute streak, totals from recent history
        const history = await WorkoutAPI.getHistory(365);
        const dates = (history || []).map((s: any) => new Date(s.started_at || s.created_at || s.date)).filter(Boolean);
        dates.sort((a, b) => b.getTime() - a.getTime());

        // Total workouts and time
        const total = history?.length || 0;
        const time = (history || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);

        // Streak calculation (count consecutive days including today if active)
        let currentStreak = 0;
        let cursor = new Date();
        // normalize to date
        cursor.setHours(0,0,0,0);
        const dateSet = new Set(dates.map(d => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime(); }));
        while (dateSet.has(cursor.getTime())) {
          currentStreak++;
          cursor = subDays(cursor, 1);
        }

        if (!mounted) return;
        setAchievements(userAch || []);
        setTutorials(tuts);
        setTotalWorkouts(total);
        setTotalTime(time);
        setStreak(currentStreak);
      } catch (e: any) {
        console.error(e);
        // Soft-fail: don't block page; show empty state instead of red error
        if (mounted) {
          setAchievements([]);
          setTutorials(curatedTutorials);
          setError(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const timeDisplay = useMemo(() => {
    const mins = Math.floor(totalTime / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  }, [totalTime]);

  const groupedTuts = useMemo(() => {
    const m: Record<string, TutorialItem[]> = {};
    tutorials.forEach((t) => {
      const key = t.category || "Fitness";
      m[key] = m[key] ? [...m[key], t] : [t];
    });
    return m;
  }, [tutorials]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Achievements & Tutorials
          </h1>
          <div />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-20">Loading…</div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Activity Streak</h3>
                </div>
                <p className="text-4xl font-bold">{streak} days</p>
                <p className="text-sm text-muted-foreground">Consecutive active days</p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Total Time Active</h3>
                </div>
                <p className="text-4xl font-bold">{timeDisplay}</p>
                <p className="text-sm text-muted-foreground">Across all recorded workouts</p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Total Workouts</h3>
                </div>
                <p className="text-4xl font-bold">{totalWorkouts}</p>
                <p className="text-sm text-muted-foreground">Completed sessions</p>
              </Card>
            </div>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-violet-500" />
                <h3 className="text-lg font-semibold">Badges</h3>
              </div>
              {achievements && achievements.length ? (
                <div className="flex flex-wrap gap-3">
                  {achievements.map((ua: any, idx: number) => (
                    <Badge key={ua.id || idx} className="px-3 py-1" variant="secondary">
                      {ua?.achievement?.name || ua?.name || "Achievement"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No badges yet—start training to unlock achievements!</p>
              )}
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-4">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold">Expert Tutorials</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.keys(groupedTuts).map((cat) => (
                  <div key={cat}>
                    <h4 className="font-semibold mb-2">{cat}</h4>
                    <ul className="space-y-2">
                      {groupedTuts[cat].map((t, i) => (
                        <li key={t.id || `${cat}-${i}`}> 
                          <a href={t.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {t.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AchievementsPage;
