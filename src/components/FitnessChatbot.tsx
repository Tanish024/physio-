import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const FitnessChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! 👋 I'm your AI Fitness Coach! I can help you with exercises, workouts, yoga, nutrition, supplements, and more. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Exercise technique questions
    if (lowerMessage.includes('deadlift') || lowerMessage.includes('how to') && lowerMessage.includes('lift')) {
      return "**Proper Deadlift Form:**\n\n1. **Setup**: Stand with feet hip-width apart, bar over mid-foot\n2. **Grip**: Bend down and grip the bar just outside your legs\n3. **Position**: Keep back straight, chest up, shoulders over the bar\n4. **Lift**: Drive through heels, keep bar close to body\n5. **Lockout**: Stand tall, squeeze glutes at top\n6. **Lower**: Hinge at hips, control the descent\n\n⚠️ **Key Tips:**\n- Keep your core tight throughout\n- Don't round your back\n- Start with light weight to master form\n- Breathe: Inhale before lift, exhale at top\n\nWould you like a video tutorial or tips for common mistakes?";
    }

    if (lowerMessage.includes('squat')) {
      return "**Perfect Squat Form:**\n\n1. **Stance**: Feet shoulder-width apart, toes slightly out\n2. **Descent**: Push hips back, bend knees, keep chest up\n3. **Depth**: Go until thighs are parallel (or lower if mobile)\n4. **Knees**: Track over toes, don't cave inward\n5. **Rise**: Drive through heels, squeeze glutes\n\n💡 **Pro Tips:**\n- Keep weight in heels\n- Maintain neutral spine\n- Engage your core\n- Breathe in going down, out coming up\n\n**Common Issues:**\n- Knee pain? Check your form and don't go too deep initially\n- Can't go deep? Work on ankle and hip mobility\n\nNeed a beginner routine or modifications?";
    }

    if (lowerMessage.includes('pushup') || lowerMessage.includes('push up') || lowerMessage.includes('push-up')) {
      return "**Proper Push-up Technique:**\n\n1. **Starting Position**: Hands slightly wider than shoulders\n2. **Body Alignment**: Straight line from head to heels\n3. **Descent**: Lower chest to ground, elbows at 45°\n4. **Push**: Drive through palms, maintain plank\n\n**Beginner Modifications:**\n- Wall push-ups\n- Incline push-ups (hands on bench)\n- Knee push-ups\n\n**Progressions:**\n- Diamond push-ups (triceps)\n- Wide push-ups (chest)\n- Decline push-ups (upper chest)\n\n💪 **Beginners**: Start with 3 sets of 5-10 reps\n\nWant a full upper body routine?";
    }

    // Home workout questions
    if (lowerMessage.includes('home workout') || lowerMessage.includes('bodyweight') || lowerMessage.includes('no equipment')) {
      return "**30-Minute Home Workout (No Equipment):**\n\n**Warm-up (5 min):**\n- Jumping jacks: 1 min\n- Arm circles: 30 sec\n- Leg swings: 30 sec\n- High knees: 1 min\n\n**Main Workout (20 min) - 3 rounds:**\n1. Push-ups: 10-15 reps\n2. Squats: 20 reps\n3. Plank: 30-60 sec\n4. Lunges: 10 each leg\n5. Mountain climbers: 30 sec\n6. Burpees: 10 reps\n\n**Cool-down (5 min):**\n- Stretching all major muscle groups\n\n💡 **Tips:**\n- Rest 30-60 sec between exercises\n- Focus on form over speed\n- Modify as needed\n\nWant a specific focus (abs, legs, full body)?";
    }

    // Yoga questions
    if (lowerMessage.includes('yoga') && (lowerMessage.includes('stress') || lowerMessage.includes('relax'))) {
      return "**Yoga Poses for Stress Relief:**\n\n1. **Child's Pose (Balasana)** - 2 min\n   - Calms the mind, releases tension\n\n2. **Cat-Cow Stretch** - 1 min\n   - Releases spine tension\n\n3. **Downward Dog** - 1 min\n   - Full body stretch, energizing\n\n4. **Legs Up the Wall** - 5 min\n   - Deeply relaxing, improves circulation\n\n5. **Corpse Pose (Savasana)** - 5 min\n   - Complete relaxation\n\n🧘 **Breathing:**\n- Practice deep belly breathing\n- Inhale for 4, hold for 4, exhale for 6\n\n**Best Time:** Evening or before bed\n\nWant a full 20-minute stress-relief routine?";
    }

    if (lowerMessage.includes('yoga') && lowerMessage.includes('flexibility')) {
      return "**Yoga for Flexibility:**\n\n**Best Poses:**\n1. **Forward Fold** - Hamstrings\n2. **Pigeon Pose** - Hips\n3. **Cobra/Upward Dog** - Spine, chest\n4. **Seated Twist** - Spine mobility\n5. **Butterfly Pose** - Inner thighs\n6. **Triangle Pose** - Full body stretch\n\n⏰ **Routine:**\n- Hold each pose 30-60 seconds\n- Breathe deeply\n- Never force or bounce\n- Practice 3-4x per week\n\n💡 **Tips:**\n- Warm up first (light cardio)\n- Consistency > intensity\n- Progress takes time (weeks/months)\n\nNeed a beginner or advanced routine?";
    }

    // Nutrition questions
    if (lowerMessage.includes('protein') || lowerMessage.includes('nutrition') || lowerMessage.includes('diet')) {
      return "**Fitness Nutrition Basics:**\n\n**Protein:**\n- **Goal**: 0.8-1g per lb of body weight\n- **Sources**: Chicken, fish, eggs, beans, tofu\n- **Timing**: Spread throughout day, especially post-workout\n\n**Carbs:**\n- **Pre-workout**: Complex carbs (oats, rice)\n- **Post-workout**: Simple carbs (fruit, rice)\n\n**Fats:**\n- Healthy fats: Avocado, nuts, olive oil\n- 20-30% of daily calories\n\n**Hydration:**\n- 8-10 glasses water daily\n- More during workouts\n\n🎯 **For Your Goal:**\n- **Muscle building**: Calorie surplus + high protein\n- **Fat loss**: Calorie deficit + high protein\n- **Maintenance**: Balanced macros\n\nWant specific meal ideas or supplement advice?";
    }

    // Supplement questions
    if (lowerMessage.includes('supplement') || lowerMessage.includes('protein powder') || lowerMessage.includes('creatine')) {
      return "**Supplement Guide for Beginners:**\n\n**Essential Supplements:**\n\n1. **Protein Powder** 💪\n   - When: Post-workout or as meal replacement\n   - Dose: 20-30g per serving\n   - Best for: Muscle recovery & growth\n\n2. **Creatine Monohydrate**\n   - When: Daily (timing doesn't matter)\n   - Dose: 5g per day\n   - Best for: Strength & power\n\n3. **Multivitamin**\n   - When: With breakfast\n   - Best for: Filling nutritional gaps\n\n4. **Omega-3 (Fish Oil)**\n   - When: With meals\n   - Best for: Heart health, recovery\n\n⚠️ **Important:**\n- Supplements support, don't replace good nutrition\n- Start with basics (protein + creatine)\n- Check with doctor if on medications\n\n🛒 **Check our store** for quality supplements!\n\nWant specific recommendations for your goal?";
    }

    // Injury/pain questions
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('injury')) {
      return "**⚠️ Injury & Pain Guidance:**\n\n**Immediate Steps:**\n1. **Stop** the activity causing pain\n2. **Rest** the affected area\n3. **Ice** for 15-20 min (first 48 hours)\n4. **Compress** with bandage if swelling\n5. **Elevate** if possible\n\n**When to See a Doctor:**\n- Sharp, severe pain\n- Swelling that doesn't reduce\n- Can't bear weight\n- Pain persists beyond a few days\n\n**Prevention:**\n- Always warm up (5-10 min)\n- Use proper form\n- Progress gradually\n- Listen to your body\n- Get adequate rest\n\n💡 **Common Issues:**\n- **Knee pain**: Check squat form, strengthen quads\n- **Shoulder pain**: Check push-up form, strengthen rotator cuff\n- **Lower back**: Strengthen core, check deadlift form\n\n⚠️ **Note**: I'm an AI assistant. For persistent pain, please consult a healthcare professional.\n\nNeed specific exercise modifications?";
    }

    // Progress tracking
    if (lowerMessage.includes('progress') || lowerMessage.includes('track') || lowerMessage.includes('stats')) {
      return "**Track Your Fitness Progress:**\n\n**What to Track:**\n1. **Workouts**: Exercises, sets, reps, weight\n2. **Body Metrics**: Weight, measurements, photos\n3. **Performance**: Strength gains, endurance\n4. **Consistency**: Workout frequency, streaks\n\n**How to Track:**\n- Use our **Progress page** to see your stats\n- Log workouts after each session\n- Take weekly progress photos\n- Measure monthly (not daily!)\n\n📊 **Key Metrics:**\n- Strength: Can you lift more?\n- Endurance: Can you do more reps?\n- Body comp: How do you look/feel?\n- Consistency: Are you showing up?\n\n💡 **Tips:**\n- Progress isn't always linear\n- Focus on long-term trends\n- Celebrate small wins\n- Adjust plan if plateauing\n\nWant to see your current stats?";
    }

    // Motivation
    if (lowerMessage.includes('motivat') || lowerMessage.includes('give up') || lowerMessage.includes('hard')) {
      return "**💪 You've Got This!**\n\n**Remember:**\n- Every workout counts, even short ones\n- Progress takes time - trust the process\n- Bad days happen - just show up\n- You're stronger than you think\n\n**Quick Motivation Boost:**\n1. **Set small goals**: Focus on today's workout\n2. **Track wins**: Celebrate every achievement\n3. **Find your why**: Remember your goals\n4. **Community**: You're not alone in this journey\n\n🎯 **Action Steps:**\n- Start with just 10 minutes today\n- Pick ONE exercise and do it well\n- Reward yourself after workouts\n- Join our community for support\n\n**Quote of the day:**\n*\"The only bad workout is the one that didn't happen.\"*\n\nWhat's one small thing you can do today?";
    }

    // Warmup questions
    if (lowerMessage.includes('warm') || lowerMessage.includes('stretch before')) {
      return "**⚠️ Yes, Warming Up is Essential!**\n\n**Why Warm Up:**\n- Prevents injuries\n- Improves performance\n- Increases blood flow\n- Prepares muscles & joints\n\n**5-Minute Quick Warm-up:**\n1. **Light cardio** (1-2 min)\n   - Jogging in place, jumping jacks\n\n2. **Dynamic stretches** (3 min)\n   - Arm circles\n   - Leg swings\n   - Hip circles\n   - Torso twists\n\n3. **Movement prep** (1 min)\n   - Bodyweight squats\n   - Push-up position holds\n\n**Before Specific Workouts:**\n- **Legs**: Extra leg swings, lunges\n- **Upper body**: Arm circles, band pull-aparts\n- **Cardio**: Start slow, gradually increase\n\n💡 **Never skip it!** Even 3-5 minutes makes a huge difference.\n\nNeed a specific warm-up routine?";
    }

    // Default helpful response
    return "I'd be happy to help with that! I can assist you with:\n\n**Exercise & Training:**\n- Proper form & technique\n- Workout routines (home or gym)\n- Exercise modifications\n\n**Yoga & Flexibility:**\n- Yoga poses & routines\n- Stretching guides\n- Meditation tips\n\n**Nutrition & Supplements:**\n- Meal planning\n- Supplement recommendations\n- Hydration tips\n\n**Progress & Goals:**\n- Tracking your progress\n- Setting realistic goals\n- Staying motivated\n\nCould you tell me more specifically what you'd like help with? For example:\n- \"How do I do a proper squat?\"\n- \"Give me a 20-minute home workout\"\n- \"What supplements should beginners take?\"\n- \"Show me yoga for stress relief\"";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(async () => {
      const response = await generateResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-bold">AI Fitness Coach</h3>
                <p className="text-white/80 text-xs">Always here to help! 💪</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about fitness..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 dark:text-gray-300"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
     </Card>
      )}
    </>
  );
};