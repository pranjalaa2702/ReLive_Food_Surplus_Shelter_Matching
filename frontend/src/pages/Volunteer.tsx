import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Users, Phone, Mail, Package, Calendar, Clock, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface Shelter {
  shelter_id: number;
  shelter_name: string;
  email: string;
  phone: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  food_stock_status: string;
  registered_at: string;
}

interface VolunteerOpportunity {
  opportunity_id: number;
  shelter_id: number;
  title: string;
  description: string;
  task_type: string;
  volunteers_needed: number;
  volunteers_assigned: number;
  date_needed: string;
  time_needed: string;
  duration_hours: number;
  location: string;
  urgency_level: string;
  status: string;
  created_at: string;
  shelter_name: string;
  shelter_location: string;
  shelter_phone: string;
  shelter_email: string;
}

const Volunteer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sheltersRes, opportunitiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/shelters`),
        fetch(`${API_BASE}/api/volunteer-opportunities`)
      ]);

      if (sheltersRes.ok) {
        const data = await sheltersRes.json();
        setShelters(data.shelters || []);
      }

      if (opportunitiesRes.ok) {
        const data = await opportunitiesRes.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = shelters.filter((shelter) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (shelter.shelter_name || '').toLowerCase().includes(q) ||
      (shelter.location || '').toLowerCase().includes(q) ||
      (shelter.food_stock_status || '').toLowerCase().includes(q)
    );
  });

  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (opp.title || '').toLowerCase().includes(q) ||
      (opp.shelter_name || '').toLowerCase().includes(q) ||
      (opp.task_type || '').toLowerCase().includes(q) ||
      (opp.location || '').toLowerCase().includes(q)
    );
  });

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Low':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Adequate':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOccupancyLevel = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return { label: 'High Need', color: 'text-red-600' };
    if (percentage >= 70) return { label: 'Moderate Need', color: 'text-orange-600' };
    return { label: 'Low Need', color: 'text-green-600' };
  };

  const getUrgencyColor = (urgency: string) => {
    const normalizedUrgency = urgency?.toLowerCase();
    if (normalizedUrgency === 'high' || normalizedUrgency === 'urgent') {
      return "bg-red-100 text-red-700 border-red-200";
    } else if (normalizedUrgency === 'medium') {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else if (normalizedUrgency === 'low') {
      return "bg-green-100 text-green-700 border-green-200";
    }
    return "bg-muted text-muted-foreground";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleApplyToVolunteer = (shelterName: string, contact: string) => {
    if (!user) {
      toast.error('Please log in to apply for volunteer opportunities');
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'volunteer') {
      toast.error('Only registered volunteers can apply. Please register as a volunteer.');
      navigate('/auth');
      return;
    }

    toast.success(`Contact ${shelterName} at ${contact} to volunteer!`);
  };

  const handleApplyToOpportunity = async (opportunityId: number, title: string) => {
    if (!user) {
      toast.error('Please log in to apply for volunteer opportunities');
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'volunteer') {
      toast.error('Only registered volunteers can apply. Please register as a volunteer.');
      navigate('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/api/volunteer-opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Successfully applied to "${title}"!`);
        // Refresh opportunities to show updated volunteer counts
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      toast.error('Failed to apply to opportunity');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Users className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
            Volunteer Opportunities
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find volunteer opportunities and shelters near you. Help with food distribution, logistics, and community service.
          </p>
          {(!user || user.role !== 'volunteer') && (
            <div className="mt-4 max-w-2xl mx-auto">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {!user ? 'Please log in and register as a volunteer to apply for opportunities.' : 'Please register as a volunteer to apply for opportunities.'}
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <Card className="p-6 mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search opportunities, shelters, or task types..."
              className="pl-12 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="opportunities">
                <Briefcase className="h-4 w-4 mr-2" />
                Opportunities ({filteredOpportunities.length})
              </TabsTrigger>
              <TabsTrigger value="shelters">
                <Users className="h-4 w-4 mr-2" />
                Shelters ({filtered.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities">
              {filteredOpportunities.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opp) => (
                    <Card key={opp.opportunity_id} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-heading font-semibold text-xl text-foreground pr-2">
                          {opp.title}
                        </h3>
                        <Badge className={getUrgencyColor(opp.urgency_level)}>
                          {opp.urgency_level}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{opp.task_type}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-foreground font-medium">{opp.shelter_name}</span>
                            <br />
                            <span className="text-muted-foreground">{opp.location || opp.shelter_location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatDate(opp.date_needed)}</span>
                          {opp.time_needed && (
                            <>
                              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                              <span className="text-muted-foreground">{formatTime(opp.time_needed)}</span>
                            </>
                          )}
                        </div>
                        {opp.duration_hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{opp.duration_hours} hours</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {opp.volunteers_needed - opp.volunteers_assigned} volunteer{opp.volunteers_needed - opp.volunteers_assigned !== 1 ? 's' : ''} needed
                          </span>
                        </div>
                        {opp.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {opp.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{opp.shelter_phone}</span>
                        </div>
                        {opp.status === 'Filled' ? (
                          <Badge className="w-full justify-center py-2 bg-gray-100 text-gray-700 border-gray-200">
                            Position Filled
                          </Badge>
                        ) : (
                          <Button 
                            className="w-full mt-2"
                            onClick={() => handleApplyToOpportunity(opp.opportunity_id, opp.title)}
                          >
                            Apply to Volunteer
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No volunteer opportunities found. Try adjusting your search.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shelters">
              {filtered.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((shelter) => {
                    const occupancy = getOccupancyLevel(shelter.current_occupancy, shelter.capacity);
                    return (
                      <Card key={shelter.shelter_id} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-heading font-semibold text-xl text-foreground pr-2">
                            {shelter.shelter_name}
                          </h3>
                          <Badge className={getStockStatusColor(shelter.food_stock_status)}>
                            {shelter.food_stock_status}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4 flex-1">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{shelter.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {shelter.current_occupancy}/{shelter.capacity} occupancy
                            </span>
                            <Badge variant="outline" className={occupancy.color}>
                              {occupancy.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Food Stock: {shelter.food_stock_status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{shelter.phone || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground break-all">{shelter.email}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full mt-auto"
                          onClick={() => handleApplyToVolunteer(shelter.shelter_name, shelter.phone || shelter.email)}
                        >
                          Volunteer Here
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No shelters found. Try adjusting your search.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Volunteer;
