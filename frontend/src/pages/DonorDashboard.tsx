import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Heart, TrendingUp, Clock, LogOut, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DonorDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const donorStats = [
    { icon: Package, label: "Total Donations", value: "24", color: "text-primary" },
    { icon: Heart, label: "Meals Provided", value: "360", color: "text-red-600" },
    { icon: TrendingUp, label: "Impact Score", value: "952", color: "text-green-600" },
    { icon: Clock, label: "Active Requests", value: "8", color: "text-blue-600" },
  ];

  const recentDonations = [
    {
      id: 1,
      type: "Fresh Produce",
      quantity: "50 kg",
      status: "Matched",
      shelter: "Hope Community Shelter",
      date: "2 hours ago",
    },
    {
      id: 2,
      type: "Canned Goods",
      quantity: "100 items",
      status: "Delivered",
      shelter: "Family Support Center",
      date: "1 day ago",
    },
    {
      id: 3,
      type: "Prepared Meals",
      quantity: "30 meals",
      status: "In Transit",
      shelter: "Youth Transition House",
      date: "3 days ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "Matched":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In Transit":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-4xl text-foreground mb-2">
                Donor Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your donations and track your impact
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Donation
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">DONOR</Badge>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {donorStats.map((stat, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <stat.icon className={`h-10 w-10 ${stat.color} mx-auto mb-3`} />
              <div className="font-heading font-bold text-3xl text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Recent Donations
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{donation.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {donation.quantity} • {donation.shelter}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {donation.date}
                    </div>
                  </div>
                  <Badge className={getStatusColor(donation.status)}>
                    {donation.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Donate Food Items
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                Schedule Pickup
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Impact Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Track Deliveries
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DonorDashboard;
