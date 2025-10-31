import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Users, Package, Phone, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const Shelters = () => {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/shelters`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          setShelters([]);
          setError(null);
        } else {
          const data = await res.json();
          if (!res.ok) {
            setShelters([]);
            setError(null);
          } else {
            setShelters(data.shelters || []);
            setError(null);
          }
        }
      } catch {
        setShelters([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchShelters();
  }, []);

  const getFoodStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Low":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Adequate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Good":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getOccupancyPercentage = (current: number, capacity: number) => {
    if (!capacity) return 0;
    return Math.round((current / capacity) * 100);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Home className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
            Shelter Directory
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            View participating shelters, their current capacity, and food supply status. Connect directly to coordinate donations.
          </p>
        </div>

        {/* Summary Stats */}
        {loading ? null : error ? null : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <Home className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="font-heading font-bold text-3xl text-foreground mb-1">{shelters.length}</div>
              <div className="text-muted-foreground">Registered Shelters</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="h-10 w-10 text-secondary mx-auto mb-3" />
              <div className="font-heading font-bold text-3xl text-foreground mb-1">
                {shelters.reduce((sum, s) => sum + (s.current_occupancy || 0), 0)}
              </div>
              <div className="text-muted-foreground">People Housed</div>
            </Card>
            <Card className="p-6 text-center">
              <Package className="h-10 w-10 text-accent mx-auto mb-3" />
              <div className="font-heading font-bold text-3xl text-foreground mb-1">
                {shelters.filter(s => (s.food_stock_status === "Low" || s.food_stock_status === "Critical")).length}
              </div>
              <div className="text-muted-foreground">Shelters Needing Food</div>
            </Card>
          </div>
        )}

        {loading ? null : shelters.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelters.map((shelter) => {
              const occupancyPercentage = getOccupancyPercentage(shelter.current_occupancy || 0, shelter.capacity || 0);
              return (
                <Card key={shelter.shelter_id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-heading font-semibold text-xl text-foreground pr-2">
                      {shelter.shelter_name}
                    </h3>
                    <Badge className={getFoodStatusColor(shelter.food_stock_status)}>
                      {shelter.food_stock_status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{shelter.location || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{shelter.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{shelter.email}</span>
                    </div>
                  </div>

                  {/* Occupancy Status */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className={`font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
                        {shelter.current_occupancy || 0}/{shelter.capacity || 0} ({occupancyPercentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          occupancyPercentage >= 90
                            ? "bg-red-500"
                            : occupancyPercentage >= 75
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${occupancyPercentage}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default Shelters;
