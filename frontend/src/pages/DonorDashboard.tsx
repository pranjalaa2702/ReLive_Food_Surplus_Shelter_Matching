import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Heart, TrendingUp, Clock, LogOut, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface DonorInfo {
  donor_id: number;
  donor_name: string;
  email: string;
  phone: string;
  address: string;
  donor_type: string;
}

interface Donation {
  donation_id: number;
  food_type: string;
  quantity: string;
  status: string;
  shelter_name: string;
  donated_at: string;
  location: string;
  expiry_date: string;
}

const DonorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch donor info
      const infoRes = await fetch(`${API_BASE}/api/donor/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setDonorInfo(infoData.donor);
      }

      // Fetch donations
      const donationsRes = await fetch(`${API_BASE}/api/donor/donations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (donationsRes.ok) {
        const donationsData = await donationsRes.json();
        setDonations(donationsData.donations || []);
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      toast.error('Failed to load donor data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const totalDonations = donations.length;
  const activeDonations = donations.filter(d => d.status === 'Pending' || d.status === 'In Progress').length;

  const donorStats = [
    { icon: Package, label: "Total Donations", value: totalDonations, color: "text-primary" },
    { icon: Heart, label: "Shelters Helped", value: new Set(donations.map(d => d.shelter_name).filter(Boolean)).size, color: "text-red-600" },
    { icon: TrendingUp, label: "This Month", value: donations.filter(d => {
      const donationDate = new Date(d.donated_at);
      const now = new Date();
      return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
    }).length, color: "text-green-600" },
    { icon: Clock, label: "Pending", value: activeDonations, color: "text-blue-600" },
  ];

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
      return "bg-green-100 text-green-700 border-green-200";
    } else if (normalizedStatus === 'matched' || normalizedStatus === 'in progress') {
      return "bg-blue-100 text-blue-700 border-blue-200";
    } else if (normalizedStatus === 'pending' || normalizedStatus === 'in transit') {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
    return "bg-muted text-muted-foreground";
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
                {donorInfo?.donor_name || 'Donor Dashboard'}
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your donations and track your impact
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                className="flex items-center gap-2"
                onClick={() => navigate('/requests')}
              >
                <Plus className="h-4 w-4" />
                Browse Requests
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
            <span>{donorInfo?.email || user?.email}</span>
            {donorInfo?.donor_type && (
              <>
                <span>•</span>
                <span>{donorInfo.donor_type}</span>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading donor data...</p>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && (
          <>
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
                    Your Donations
                  </h2>
                  <Badge variant="secondary">{donations.length} total</Badge>
                </div>
                <div className="space-y-4">
                  {donations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No donations yet. Browse requests to make your first donation!
                    </p>
                  ) : (
                    donations.slice(0, 5).map((donation) => (
                      <div key={donation.donation_id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{donation.food_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {donation.quantity} • {donation.shelter_name || 'Unassigned'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(donation.donated_at)}
                          </div>
                        </div>
                        <Badge className={getStatusColor(donation.status)}>
                          {donation.status}
                        </Badge>
                      </div>
                    ))
                  )}
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
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate('/requests')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Browse Requests
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate('/shelters')}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    View Shelters
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={fetchDonorData}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
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

export default DonorDashboard;
