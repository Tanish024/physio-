import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Instagram, Linkedin, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Simple static trainer dataset; replace with Supabase/Backend fetch if needed
const trainers = [
  {
    name: "Aditi Sharma",
    bio: "Certified strength & conditioning coach; 5+ years helping clients transform safely.",
    instagram: "https://instagram.com/fitwithaditi",
    linkedin: "https://www.linkedin.com/in/aditi-sharma-trainer/",
  },
  {
    name: "Rohan Verma",
    bio: "Personal trainer focused on functional movement and sustainable nutrition.",
    instagram: "https://instagram.com/coachrohan",
    linkedin: "https://www.linkedin.com/in/rohan-verma-trainer/",
  },
  {
    name: "Rohit Sharma",
    bio: "Experienced personal trainer specializing in strength, hypertrophy, and fat loss with a focus on sustainable results.",
    instagram: "https://instagram.com/rohit.in.gym",
    linkedin: "https://www.linkedin.com/in/sharma-rohit-coding/",
  },
];

// Load Google Maps script if key provided via env
function useGoogleMaps(apiKey?: string) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return; // don't attempt without key

    // If already present
    if ((window as any).google?.maps?.places) {
      setLoaded(true);
      return;
    }

    const existing = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onerror = () => setLoadError("Failed to load Google Maps script. Check your API key and network.");
    (window as any).gm_authFailure = () => {
      setLoadError("Google Maps authentication failed. Verify API key, restrictions, billing, and enabled APIs.");
    };
    script.onload = () => {
      if ((window as any).google?.maps) {
        setLoaded(true);
      } else {
        setLoadError("Google Maps loaded but window.google.maps is unavailable.");
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [apiKey]);

  return { loaded, loadError };
}

const MembershipDetails = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const planId = location?.state?.planId as string | undefined;

  const mapRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY) as string | undefined;
  const { loaded: mapsLoaded, loadError } = useGoogleMaps(apiKey);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser. Showing gyms near New Delhi.");
      // Fallback to New Delhi
      setPosition({ lat: 28.6139, lng: 77.2090 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setError("Location permission denied. Showing gyms near New Delhi.");
        setPosition({ lat: 28.6139, lng: 77.2090 });
      }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || !position || !mapsLoaded) return;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: position,
      zoom: 14,
    });

    // Marker at user location
    new (window as any).google.maps.Marker({
      position,
      map,
      title: "You are here",
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "white",
      },
    });

    const service = new (window as any).google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location: position,
        radius: 5000,
        type: ["gym"],
      },
      (results: any, status: any) => {
        console.log("Maps status:", { status, resultsCount: results?.length, position, mapsLoaded });
        if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !results) return;
        results.forEach((place: any) => {
          const marker = new (window as any).google.maps.Marker({
            map,
            position: place.geometry?.location,
            title: place.name,
          });
          const content = `
            <div style="min-width: 220px">
              <h3 style="margin:0 0 4px 0;font-weight:600">${place.name}</h3>
              <div style="font-size:12px;opacity:.8">${place.vicinity || ""}</div>
              <div style="font-size:12px;margin-top:4px">Rating: ${place.rating || "N/A"}</div>
              <a href="https://www.google.com/maps/place/?q=place_id:${place.place_id}" target="_blank" rel="noreferrer" style="font-size:12px;display:inline-block;margin-top:6px;color:#3b82f6">See reviews</a>
            </div>`;
          const info = new (window as any).google.maps.InfoWindow({ content });
          marker.addListener("click", () => info.open({ anchor: marker, map }));
        });
      }
    );
  }, [position, mapsLoaded, apiKey]);

  const selectedPlanTitle = useMemo(() => {
    if (!planId) return undefined;
    if (planId === "basic") return "Basic Membership";
    if (planId === "premium") return "Premium Membership";
    return planId;
  }, [planId]);

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
              <p className="text-sm text-muted-foreground">Membership Details {selectedPlanTitle ? ` - ${selectedPlanTitle}` : ""}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trainer Info */}
          <Card className="p-6 bg-card/50 border-border">
            <h2 className="text-2xl font-bold mb-4">Trainer Contact Info</h2>
            <div className="space-y-5">
              {trainers.map((t) => (
                <div key={t.name} className="p-4 rounded-lg border border-border/60">
                  <div className="text-lg font-semibold">{t.name}</div>
                  <p className="text-sm text-muted-foreground mb-3">{t.bio}</p>
                  <div className="flex items-center gap-3">
                    <a href={t.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                    <a href={t.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                    <a href={t.instagram} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">Contact Trainer</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Advanced Gym Locator */}
          <Card className="p-6 bg-card/50 border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Find Local Gyms</h2>
              <Button 
                onClick={() => navigate("/gym-locator")} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Full Map View
              </Button>
            </div>
            <div className="h-96 w-full rounded-md border border-border overflow-hidden" ref={mapRef}>
              {!apiKey && (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-6">
                  <MapPin className="w-8 h-8 mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Discover nearby fitness facilities with ratings and reviews.
                  </p>
                  <Button 
                    onClick={() => navigate("/gym-locator")} 
                    className="gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Open Gym Locator
                  </Button>
                </div>
              )}
            </div>
            {apiKey && (
              <div className="mt-4 text-sm text-muted-foreground">
                Click markers for gym details, ratings, and reviews. Use the "Full Map View" for advanced search and filtering.
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MembershipDetails;
