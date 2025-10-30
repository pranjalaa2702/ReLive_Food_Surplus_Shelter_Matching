import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const FulfillRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const qp = new URLSearchParams(location.search);
  const shelterName = qp.get('shelter') || '';
  const requestType = qp.get('type') || '';
  const requestedQuantity = qp.get('quantity') || '';

  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    foodType: "",
    quantity: requestedQuantity || "",
    unit: "",
    pickupLocation: "",
    notes: "",
  });

  // Check if user is a donor
  const isDonor = user?.role === "donor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDonor) {
      toast.error("Only donors can fulfill requests. Please register as a donor.");
      navigate('/auth?tab=register');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in first');
        navigate('/auth', { replace: true });
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/requests/${id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          shelterName, 
          requestType, 
          requestedQuantity,
          foodType: formData.foodType,
          quantity: formData.quantity,
          unit: formData.unit,
          expiryDate: date ? format(date, 'yyyy-MM-dd') : null,
          pickupLocation: formData.pickupLocation,
          notes: formData.notes
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record donation');
      }

      toast.success('Thank you! Your donation has been recorded and the shelter will be notified.');
      navigate('/requests');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto">
            <Card className="p-8 text-center">
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="font-heading font-bold text-2xl text-foreground mb-4">Login Required</h1>
              <p className="text-muted-foreground mb-6">
                Please log in or register as a donor to fulfill requests.
              </p>
              <Button onClick={() => navigate('/auth?tab=register')}>
                Get Started
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isDonor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto">
            <Card className="p-8 text-center">
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="font-heading font-bold text-2xl text-foreground mb-4">Donor Access Required</h1>
              <p className="text-muted-foreground mb-2">
                You're currently logged in as <span className="font-medium text-foreground">{user?.role}</span>.
              </p>
              <p className="text-muted-foreground mb-6">
                Only donors can fulfill requests by making donations. Please register a donor account to continue.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/auth?tab=register')}>
                  Register as Donor
                </Button>
                <Button variant="outline" onClick={() => navigate('/requests')}>
                  Back to Requests
                </Button>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <Package className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Make a Donation</h1>
              <p className="text-sm text-muted-foreground">
                You're fulfilling a request from <span className="font-medium text-foreground">{shelterName || 'a shelter'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Requested: <span className="font-medium text-foreground">{requestType || 'items'}</span> - {requestedQuantity || 'quantity not specified'}
              </p>
            </div>

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
                    <SelectItem value="Fresh Produce">Fresh Produce</SelectItem>
                    <SelectItem value="Canned Goods">Canned Goods</SelectItem>
                    <SelectItem value="Bakery Items">Bakery Items</SelectItem>
                    <SelectItem value="Dairy Products">Dairy Products</SelectItem>
                    <SelectItem value="Meat & Protein">Meat & Protein</SelectItem>
                    <SelectItem value="Prepared Meals">Prepared Meals</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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

              {/* Pickup Location */}
              <div className="space-y-2">
                <Label htmlFor="pickupLocation">Pickup Location *</Label>
                <Input
                  id="pickupLocation"
                  placeholder="Address or neighborhood"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Pickup instructions, storage requirements, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Submit Donation
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link to="/requests" className="text-sm text-muted-foreground hover:text-primary">
                ← Back to Requests
              </Link>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• The shelter will be notified of your donation</li>
              <li>• They will contact you to arrange pickup</li>
              <li>• Track your donation impact through your dashboard</li>
              <li>• You'll receive updates when the donation is collected</li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FulfillRequest;

