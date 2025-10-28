import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, BarChart3, Settings, LogOut } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleBasedAPI } from "@/hooks/useRoleBasedAPI";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const { getAdminStats, getAdminUsers } = useRoleBasedAPI();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolunteers: 0,
    totalShelters: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, usersData] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
        ]);
        setStats(statsData);
        setUsers(usersData.users);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const adminStats = [
    { icon: Users, label: "Total Users", value: stats.totalUsers.toString(), color: "text-blue-600" },
    { icon: Shield, label: "Active Shelters", value: stats.totalShelters.toString(), color: "text-green-600" },
    { icon: BarChart3, label: "Total Donors", value: stats.totalDonors.toString(), color: "text-purple-600" },
    { icon: Settings, label: "Total Volunteers", value: stats.totalVolunteers.toString(), color: "text-orange-600" },
  ];

  const recentActivities = [
    { action: "New shelter registered", user: "Hope Community Center", time: "2 minutes ago" },
    { action: "Donation processed", user: "Green Grocery Store", time: "15 minutes ago" },
    { action: "Volunteer approved", user: "Sarah Johnson", time: "1 hour ago" },
    { action: "System backup completed", user: "System", time: "2 hours ago" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-4xl text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                System overview and management
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="destructive">ADMIN</Badge>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {adminStats.map((stat, index) => (
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
          {/* System Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                System Management
              </h2>
            </div>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Approve Shelters
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </Card>

          {/* Recent Activities */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-2xl text-foreground">
                Recent Activities
              </h2>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
