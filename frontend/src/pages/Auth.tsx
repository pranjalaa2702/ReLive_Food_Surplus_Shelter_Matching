import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    // shelter-only
    shelter_name: "",
    phone: "",
    location: "",
    capacity: "",
    current_occupancy: "",
    food_stock_status: "Adequate",
    // donor-only
    address: "",
    donor_type: "",
    // volunteer-only
    area_of_service: "",
    availability_status: "Available",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get role-specific dashboard path
  const getRoleDashboard = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'donor':
        return '/donor-dashboard';
      case 'volunteer':
        return '/volunteer-dashboard';
      case 'shelter':
        return '/shelter-dashboard';
      default:
        return '/';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        // Get user role from auth context to determine redirect
        const userRole = user?.role || localStorage.getItem('userRole') || 'user';
        const roleDashboard = getRoleDashboard(userRole);
        toast.success("Login successful! Redirecting to your dashboard...");
        navigate(roleDashboard, { replace: true });
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== REGISTER =====
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (!registerData.role) {
      toast.error("Please select your role");
      return;
    }

    if (registerData.role === 'shelter' && !registerData.shelter_name) {
      toast.error("Please enter shelter name");
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      };
      if (registerData.role === 'shelter') {
        payload.shelter_name = registerData.shelter_name;
        payload.phone = registerData.phone;
        payload.location = registerData.location;
        payload.capacity = registerData.capacity;
        payload.current_occupancy = registerData.current_occupancy;
        payload.food_stock_status = registerData.food_stock_status;
      }

      console.log('Register data before sending:', registerData);
      console.log('Payload constructed:', payload);

      const success = await register(
        payload.name,
        payload.email,
        payload.password,
        payload.role,
        registerData.role === 'shelter'
          ? { 
              shelter_name: payload.shelter_name, 
              phone: payload.phone, 
              location: payload.location, 
              capacity: payload.capacity,
              current_occupancy: payload.current_occupancy,
              food_stock_status: payload.food_stock_status
            }
          : registerData.role === 'donor'
          ? { phone: registerData.phone, address: (registerData as any).address, donor_type: (registerData as any).donor_type }
          : registerData.role === 'volunteer'
          ? { phone: registerData.phone, area_of_service: (registerData as any).area_of_service, availability_status: (registerData as any).availability_status }
          : undefined
      );
      
      if (success) {
        // Redirect to role-specific dashboard
        const roleDashboard = getRoleDashboard(registerData.role);
        toast.success("Registration successful! Welcome to FoodShare Connect!");
        navigate(roleDashboard, { replace: true });
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <Heart className="h-10 w-10 text-primary fill-primary" />
        <div className="flex flex-col">
          <span className="font-heading font-bold text-2xl text-foreground">FoodShare Connect</span>
          <span className="text-xs text-muted-foreground">Redistribute Food. Restore Hope.</span>
        </div>
      </Link>

      <Card className="w-full max-w-md p-8 shadow-lg">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <a href="#" className="text-primary hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-role">I am a...</Label>
                <Select
                  value={registerData.role}
                  onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                  required
                >
                  <SelectTrigger id="register-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donor">Donor</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="shelter">Shelter/Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {registerData.role === 'shelter' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-name">Shelter Name</Label>
                    <Input
                      id="register-shelter-name"
                      type="text"
                      placeholder="Hope Community Shelter"
                      value={registerData.shelter_name}
                      onChange={(e) => setRegisterData({ ...registerData, shelter_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-phone">Phone</Label>
                    <Input
                      id="register-shelter-phone"
                      type="text"
                      placeholder="(xxx) xxx-xxxx"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-location">Location</Label>
                    <Input
                      id="register-shelter-location"
                      type="text"
                      placeholder="Address / Area"
                      value={registerData.location}
                      onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-capacity">Capacity</Label>
                    <Input
                      id="register-shelter-capacity"
                      type="number"
                      placeholder="e.g., 60"
                      value={registerData.capacity}
                      onChange={(e) => setRegisterData({ ...registerData, capacity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-current-occupancy">Current Occupancy</Label>
                    <Input
                      id="register-shelter-current-occupancy"
                      type="number"
                      placeholder="e.g., 45"
                      value={registerData.current_occupancy}
                      onChange={(e) => setRegisterData({ ...registerData, current_occupancy: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-shelter-food-stock">Food Stock Status</Label>
                    <Select
                      value={registerData.food_stock_status}
                      onValueChange={(value) => setRegisterData({ ...registerData, food_stock_status: value })}
                    >
                      <SelectTrigger id="register-shelter-food-stock">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Adequate">Adequate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {registerData.role === 'donor' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="register-donor-phone">Phone</Label>
                    <Input
                      id="register-donor-phone"
                      type="text"
                      placeholder="(xxx) xxx-xxxx"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-donor-address">Address</Label>
                    <Input
                      id="register-donor-address"
                      type="text"
                      placeholder="Street, City"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-donor-type">Donor Type</Label>
                    <Select
                      value={registerData.donor_type}
                      onValueChange={(value) => setRegisterData({ ...registerData, donor_type: value })}
                    >
                      <SelectTrigger id="register-donor-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {registerData.role === 'volunteer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="register-vol-phone">Phone</Label>
                    <Input
                      id="register-vol-phone"
                      type="text"
                      placeholder="(xxx) xxx-xxxx"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-vol-area">Area of Service</Label>
                    <Input
                      id="register-vol-area"
                      type="text"
                      placeholder="e.g., Logistics, Distribution"
                      value={registerData.area_of_service}
                      onChange={(e) => setRegisterData({ ...registerData, area_of_service: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>

      <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Back to Home
      </Link>
    </div>
  );
};

export default Auth;
