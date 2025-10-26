import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Users, Heart, TrendingUp, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Dashboard = () => {
  const userStats = [
    { icon: Package, label: "Total Donations", value: "24", color: "text-primary" },
    { icon: Users, label: "Volunteer Hours", value: "48", color: "text-secondary" },
    { icon: Heart, label: "Meals Provided", value: "360", color: "text-accent" },
    { icon: TrendingUp, label: "Impact Score", value: "952", color: "text-green-600" },
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

  const upcomingVolunteerTasks = [
    {
      id: 1,
      title: "Food Distribution Helper",
      location: "Downtown Community Center",
      date: "Tomorrow, 9:00 AM",
      duration: "3 hours",
    },
    {
      id: 2,
      title: "Meal Preparation Assistant",
      location: "Hope Kitchen",
      date: "Friday, 5:00 PM",
      duration: "3 hours",
    },
  ];

  const matches = [
    {
      id: 1,
      donor: "Green Grocery Store",
      recipient: "Hope Community Shelter",
      items: "Fresh vegetables, 75 kg",
      status: "Pending Confirmation",
    },
    {
      id: 2,
      donor: "City Bakery",
      recipient: "Senior Care Home",
      items: "Bread and pastries, 50 items",
      status: "Confirmed",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Matched":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In Transit":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Pending Confirmation":
        return "bg-orange-100 text-orange-700 border-orange-200";
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
          <h1 className="font-heading font-bold text-4xl text-foreground mb-2">
            Welcome Back, John!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your impact summary and recent activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {userStats.map((stat, index) => (
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

          {/* Upcoming Volunteer Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Upcoming Tasks
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {upcomingVolunteerTasks.map((task) => (
                <div key={task.id} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-foreground mb-2">{task.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p>📍 {task.location}</p>
                    <p>📅 {task.date}</p>
                    <p>⏱️ {task.duration}</p>
                  </div>
                  <Button size="sm" className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Matches Section */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-2xl text-foreground">
              Current Matches
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-foreground">{match.donor}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-foreground">{match.recipient}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{match.items}</p>
                </div>
                <Badge className={getStatusColor(match.status)}>
                  {match.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
