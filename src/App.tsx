import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FitnessChatbot } from "@/components/FitnessChatbot";
import { FeedbackButton } from "@/components/FeedbackButton";
import "@/utils/feedbackUtils"; // Import feedback utilities for development

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workout = lazy(() => import("./pages/Workout"));
const PoseMatch = lazy(() => import("./pages/PoseMatch"));
const ExerciseFormAccuracy = lazy(() => import("./pages/ExerciseFormAccuracy"));
const Progress = lazy(() => import("./pages/Progress"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Store = lazy(() => import("./pages/Store"));
const StoreProductDetail = lazy(() => import("./pages/StoreProductDetail"));
const Supplements = lazy(() => import("./pages/Supplements"));
const SupplementsProductDetail = lazy(() => import("./pages/SupplementsProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BMI = lazy(() => import("./pages/BMI"));
const Membership = lazy(() => import("./pages/Membership"));
const MembershipDetails = lazy(() => import("./pages/MembershipDetails"));
const GymLocator = lazy(() => import("./pages/GymLocator"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FitnessChatbot />
      <FeedbackButton />
      <BrowserRouter>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workout/:exerciseId" element={<Workout />} />
            <Route path="/workout/exercises" element={<ExerciseFormAccuracy />} />
            <Route path="/workout/exercises/:exercise" element={<ExerciseFormAccuracy />} />
            <Route path="/pose-match" element={<PoseMatch />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/product/:id" element={<StoreProductDetail />} />
            <Route path="/supplements" element={<Supplements />} />
            <Route path="/supplements/product/:id" element={<SupplementsProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/bmi" element={<BMI />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/membership-details" element={<MembershipDetails />} />
            <Route path="/gym-locator" element={<GymLocator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
