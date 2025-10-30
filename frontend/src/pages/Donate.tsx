import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, Heart } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Donate = () => {
  const { user, isAuthenticated } = useAuth();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    foodType: "",
    quantity: "",
    unit: "",
    location: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Donation posted successfully! A shelter will contact you soon.");
    setFormData({ foodType: "", quantity: "", unit: "", location: "", description: "" });
    setDate(undefined);
  };

  const isDonor = user?.role === "donor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Package className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
              Donate Food
            </h1>
            <p className="text-muted-foreground text-lg">
              Share your surplus food with shelters and communities in need. Every donation makes a difference.
            </p>
          </div>

          {/* Non-donor CTA */}
          {!isDonor && (
            <Card className="p-8 mb-8 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <Heart className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-heading font-semibold text-2xl text-foreground mb-2">
                    Your surplus can feed families today
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Become a Donor to post donations, schedule pickups, and track your impact. It only takes a minute to get started.
                  </p>
                  {isAuthenticated && user?.role !== "donor" ? (
                    <p className="text-sm text-muted-foreground mb-4">
                      You're logged in as <span className="font-medium text-foreground">{user?.role}</span>. To donate, please sign up as a Donor.
                    </p>
                  ) : null}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/auth?tab=register&role=donor">
                      <Button size="lg">Become a Donor</Button>
                    </Link>
                    <Link to="/requests">
                      <Button variant="outline" size="lg">See Current Needs</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Donor Form */}
          {isDonor && (
            <Card className="p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Food Type */}
                <div className="space-y-2">
                  <Label htmlFor="foodType">Food Type *</Label>
                  <Select
                    value={formData.foodType}
                    onValueChange={(value) => setFormData({ ...formData, foodType: value })}
                    required
                  >
                    <SelectTrigger id="foodType">
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh-produce">Fresh Produce</SelectItem>
                      <SelectItem value="canned-goods">Canned Goods</SelectItem>
                      <SelectItem value="bakery">Bakery Items</SelectItem>
                      <SelectItem value="dairy">Dairy Products</SelectItem>
                      <SelectItem value="meat">Meat & Protein</SelectItem>
                      <SelectItem value="prepared-meals">Prepared Meals</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                      required
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Pickup Location *</Label>
                  <Input
                    id="location"
                    placeholder="Address or neighborhood"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Any special storage requirements, pickup instructions, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Submit */}
                <Button type="submit" size="lg" className="w-full">
                  Post Donation
                </Button>
              </form>
            </Card>
          )}

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Your donation will be visible to registered shelters</li>
              <li>• You'll receive notifications when someone requests your donation</li>
              <li>• Coordinate pickup times directly with the requester</li>
              <li>• Track your impact through your dashboard</li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;
