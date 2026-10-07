import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';

// Checkout page that creates orders in Supabase and sends confirmation emails.
// After successful payment, redirects to home page with order confirmation state.

const Checkout = () => {
  const navigate = useNavigate();

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('gPm5t7kDWppr2mISo');
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [processing, setProcessing] = useState(false);

  // Only email is strictly required to proceed; other fields are optional but collected
  const isValid = useMemo(() => /.+@.+\..+/.test(email), [email]);

  const handlePay = async () => {
    if (!isValid) return;
    try {
      setProcessing(true);

      // 1) Read cart from localStorage
      const raw = localStorage.getItem("supp_cart");
      const items: Array<{ id?: string; name: string; price: number; quantity: number }> = raw ? JSON.parse(raw) : [];
      if (!items || !items.length) {
        toast.error("Your cart is empty.");
        setProcessing(false);
        return;
      }

      // 2) Compute totals
      const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
      const shipping = subtotal > 50 ? 0 : 5.99;
      const total = subtotal + shipping;

      // 3) Generate a simple order ID
      const orderId = `ORD-${Date.now()}`;

      // 4) Send confirmation email using EmailJS
      try {
        // Format items for email
        const itemsList = items.map((it) =>
          `${it.name} x ${it.quantity} - $${(it.price * it.quantity).toFixed(2)}`
        ).join('\n');

        // Send email with explicit recipient
        const templateParams = {
          to_email: email,
          user_email: email,
          to_name: name || 'Customer',
          from_name: 'AI Fitness Coach',
          order_id: orderId,
          items_list: itemsList,
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
          customer_address: `${address}, ${city}, ${postal}`,
          reply_to: email,
        };

        const result = await emailjs.send(
          'service_pgz9zzd',
          'template_nd1r4nk',
          templateParams
        );
        console.log('✅ Email sent successfully!', result);
      } catch (emailError: any) {
        console.error("❌ Email sending failed:", emailError);
        console.error("Error text:", emailError?.text || emailError?.message);
        // Continue anyway - email is optional
      }

      // 5) Clear cart
      localStorage.removeItem("supp_cart");

      // 6) Navigate to home page with success message
      navigate("/", {
        replace: true,
        state: {
          orderConfirmed: true,
          orderId: orderId,
          customerName: name
        }
      });

    } catch (e) {
      console.error(e);
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Checkout
          </h1>
          <Button variant="outline" onClick={() => navigate("/supplements")}>Back to Store</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Contact Info</h2>
            <p className="text-sm text-muted-foreground">We’ll email your receipt and order updates.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold">Shipping</h2>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Fitness St" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postal">Postal Code</Label>
                <Input id="postal" value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="400001" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button disabled={!isValid || processing} onClick={handlePay} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              {processing ? "Processing…" : "Pay Now"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Checkout;
