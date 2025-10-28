import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, Users, LogOut, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const RecipientDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const recipientStats = [
    { icon: Heart, label: "Meals Received", value: "156", color: "text-red-600" },
    { icon: MapPin, label: "Nearby Shelters", value: "8", color: "text-blue-600" },
    { icon: Clock, label: "Last Meal", value: "2 hours ago", color: "text-green-600" },
    { icon: Users, label: "Support Network", value: "12", color: "text-purple-600" },
  ];

  const nearbyShelters = [
    {
      id: 1,
      name: "Hope Community Shelter",
      distance: "0.5 miles",
      availability: "Open",
      nextMeal: "6:00 PM",
    },
    {
      id: 2,
      name: "Family Support Center",
      distance: "1.2 miles",
      availability: "Open",
      nextMeal: "7:30 PM",
    },
    {
      id: 3,
      name: "Downtown Food Bank",
      distance: "2.1 miles",
      availability: "Closed",
      nextMeal: "Tomorrow 8:00 AM",
    },
  ];

  const recentMeals = [
    {
      id: 1,
      shelter: "Hope Community Shelter",
      meal: "Dinner",
      time: "2 hours ago",
      status: "Received",
    },
    {
      id: 2,
      shelter: "Family Support Center",
      meal: "Lunch",
      time: "Yesterday",
      status: "Received",
    },
    {
      id: 3,
      shelter: "Downtown Food Bank",
      meal: "Breakfast",
      time: "2 days ago",
      status: "Received",
    },
  ];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Open":
        return "bg-green-100 text-green-700 border-green-200";
      case "Closed":
        return "bg-red-100 text-red-700 border-red-200";
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
                Recipient Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Find nearby shelters and track your meals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Shelters
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
            <Badge variant="secondary">RECIPIENT</Badge>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {recipientStats.map((stat, index) => (
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
          {/* Nearby Shelters */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Nearby Shelters
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {nearbyShelters.map((shelter) => (
                <div key={shelter.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground">{shelter.name}</h3>
                    <Badge className={getAvailabilityColor(shelter.availability)}>
                      {shelter.availability}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>📍 {shelter.distance}</p>
                    <p>🍽️ Next meal: {shelter.nextMeal}</p>
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    Get Directions
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Meals */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Recent Meals
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{meal.meal}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {meal.shelter}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {meal.time}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {meal.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-2xl text-foreground">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
              <MapPin className="h-6 w-6" />
              <span>Find Shelters</span>
            </Button>
            <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
              <Clock className="h-6 w-6" />
              <span>Meal Times</span>
            </Button>
            <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
              <Users className="h-6 w-6" />
              <span>Support Groups</span>
            </Button>
            <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
              <Heart className="h-6 w-6" />
              <span>Emergency Help</span>
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default RecipientDashboard;
