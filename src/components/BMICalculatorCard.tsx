import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

type HeightUnit = "cm" | "in" | "ftin";
type WeightUnit = "kg" | "lb";

function toMeters(heightValue: number, unit: HeightUnit, feet?: number, inches?: number) {
  if (unit === "cm") return heightValue / 100;
  if (unit === "in") return heightValue * 0.0254;
  // ft + in
  const totalInches = (feet || 0) * 12 + (inches || 0);
  return totalInches * 0.0254;
}

function toKg(weightValue: number, unit: WeightUnit) {
  return unit === "kg" ? weightValue : weightValue * 0.45359237;
}

function getBMICategory(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return "";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getTip(category: string) {
  switch (category) {
    case "Underweight":
      return "Consider increasing calorie-dense, nutritious foods and strength training.";
    case "Normal":
      return "Great job! Maintain balance with regular activity and a varied diet.";
    case "Overweight":
      return "Focus on consistent movement and portion control. Add cardio 3–4x/week.";
    case "Obese":
      return "Start with low-impact activity and consult a professional for a tailored plan.";
    default:
      return "";
  }
}

// Map BMI value (0–40) to percent for indicator position, clamp 0–100
function bmiToPercent(bmi: number) {
  const pct = (Math.max(0, Math.min(40, bmi)) / 40) * 100;
  return pct;
}

type BMICalculatorCardProps = {
  showOpenLink?: boolean;
  preventCardClick?: boolean;
};

const BMICalculatorCard: React.FC<BMICalculatorCardProps> = ({ showOpenLink, preventCardClick = false }) => {
  const navigate = useNavigate();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");

  // height inputs
  const [height, setHeight] = useState<string>(""); // cm or inches
  const [feet, setFeet] = useState<string>("");
  const [inches, setInches] = useState<string>("");

  // weight
  const [weight, setWeight] = useState<string>("");

  const [bmi, setBmi] = useState<number | null>(null);

  const category = useMemo(() => (bmi ? getBMICategory(bmi) : ""), [bmi]);
  const tip = useMemo(() => getTip(category), [category]);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      setBmi(null);
      return;
    }

    let meters = 0;
    if (heightUnit === "cm" || heightUnit === "in") {
      const h = parseFloat(height);
      if (!h || h <= 0) {
        setBmi(null);
        return;
      }
      meters = toMeters(h, heightUnit);
    } else {
      const f = parseFloat(feet || "0");
      const i = parseFloat(inches || "0");
      if ((f <= 0 && i <= 0) || f < 0 || i < 0) {
        setBmi(null);
        return;
      }
      meters = toMeters(0, "ftin", f, i);
    }

    const kg = toKg(w, weightUnit);
    if (meters <= 0) {
      setBmi(null);
      return;
    }
    const value = kg / (meters * meters);
    setBmi(parseFloat(value.toFixed(1)));
  };

  const indicatorPercent = useMemo(() => bmiToPercent(bmi || 0), [bmi]);

  const rangeColor = useMemo(() => {
    if (category === "Underweight") return "bg-blue-500";
    if (category === "Normal") return "bg-green-500";
    if (category === "Overweight") return "bg-yellow-500";
    if (category === "Obese") return "bg-red-500";
    return "bg-muted";
  }, [category]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (preventCardClick) {
      e.stopPropagation();
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border h-full flex flex-col w-full" onClick={handleContainerClick}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Body Mass Calculator</h3>
            <p className="text-sm text-muted-foreground">Check your BMI and get a quick tip</p>
          </div>
        </div>
        {showOpenLink && (
          <Button variant="outline" size="sm" onClick={() => navigate("/bmi")}>Open full page</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Height</label>
          <div className="grid grid-cols-3 gap-2">
            <Select value={heightUnit} onValueChange={(v) => setHeightUnit(v as HeightUnit)}>
              <SelectTrigger className="col-span-1">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="in">in</SelectItem>
                <SelectItem value="ftin">ft+in</SelectItem>
              </SelectContent>
            </Select>
            {heightUnit === "ftin" ? (
              <>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="ft"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                  className="col-span-1"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="in"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                  className="col-span-1"
                />
              </>
            ) : (
              <Input
                type="number"
                inputMode="decimal"
                placeholder={heightUnit === "cm" ? "cm" : "in"}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="col-span-2"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Weight</label>
          <div className="grid grid-cols-3 gap-2">
            <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as WeightUnit)}>
              <SelectTrigger className="col-span-1">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lb">lb</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={weightUnit === "kg" ? "kg" : "lb"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="col-span-2"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={handleCalculate} className="gap-2">
          Calculate
        </Button>
        <span className="text-sm text-muted-foreground">or adjust values to recalc</span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold leading-none">{bmi ? bmi.toFixed(1) : "--"}</div>
            <div className="text-sm text-muted-foreground">BMI</div>
          </div>
          <div className={`text-sm font-medium ${
            category ? "" : "text-muted-foreground"
          }`}>{category || "--"}</div>
        </div>

        {/* Gauge */}
        <div className="relative h-3 w-full rounded-full overflow-hidden bg-muted">
          {/* Background segmented colors via gradient approximate */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500" style={{ backgroundSize: "200% 100%" }} />
          {/* Add red segment overlay on right end */}
          <div className="absolute right-0 top-0 h-full" style={{ width: "25%" }}>
            <div className="h-full w-full bg-red-500" />
          </div>
          {/* Indicator */}
          {bmi && (
            <div
              className="absolute -top-1 h-5 w-0.5 bg-foreground rounded"
              style={{ left: `calc(${indicatorPercent}% - 1px)` }}
            />
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Ranges:</span> Underweight &lt; 18.5 | Normal 18.5–24.9 | Overweight 25–29.9 | Obese 30+
        </div>
      </div>

      {tip && (
        <div className={`mt-4 text-sm p-3 rounded-md border ${rangeColor.replace("bg-", "border-")} bg-background/40`}>
          <span className="font-medium">Tip:</span> {tip}
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        BMI = weight(kg) / height(m)
        <sup>2</sup>. <a className="underline hover:no-underline" href="https://www.cdc.gov/healthyweight/assessing/bmi/index.html" target="_blank" rel="noreferrer">Learn more</a>
      </div>
    </Card>
  );
};

export default BMICalculatorCard;
