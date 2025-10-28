import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle, MapPin, LogOut, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VolunteerDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const volunteerStats = [
    { icon: Clock, label: "Hours Volunteered", value: "48", color: "text-blue-600" },
    { icon: CheckCircle, label: "Tasks Completed", value: "23", color: "text-green-600" },
    { icon: Users, label: "People Helped", value: "156", color: "text-purple-600" },
    { icon: MapPin, label: "Active Locations", value: "5", color: "text-orange-600" },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Food Distribution Helper",
      location: "Downtown Community Center",
      date: "Tomorrow, 9:00 AM",
      duration: "3 hours",
      status: "Scheduled",
    },
    {
      id: 2,
      title: "Meal Preparation Assistant",
      location: "Hope Kitchen",
      date: "Friday, 5:00 PM",
      duration: "3 hours",
      status: "Scheduled",
    },
    {
      id: 3,
      title: "Delivery Driver",
      location: "Various Locations",
      date: "Sunday, 10:00 AM",
      duration: "4 hours",
      status: "Pending",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
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
                Volunteer Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your volunteer activities and track your impact
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Find Opportunities
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
            <Badge variant="secondary">VOLUNTEER</Badge>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {volunteerStats.map((stat, index) => (
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
          {/* Upcoming Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Upcoming Tasks
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-foreground mb-2">{task.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p>📍 {task.location}</p>
                    <p>📅 {task.date}</p>
                    <p>⏱️ {task.duration}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Button size="sm">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  </div>
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
                <Calendar className="h-4 w-4 mr-2" />
                Browse Opportunities
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Update Availability
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Log Hours
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Connect with Shelters
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VolunteerDashboard;
