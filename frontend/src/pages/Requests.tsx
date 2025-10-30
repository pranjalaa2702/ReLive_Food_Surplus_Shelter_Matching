import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const Requests = () => {
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/requests`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          // Likely hitting index.html due to bad base URL; fail silently with empty list
          setRequests([]);
          setError(null);
        } else {
          const data = await res.json();
          if (!res.ok) {
            // treat as empty rather than surfacing error
            setRequests([]);
            setError(null);
          } else {
            setRequests(data.requests || []);
            setError(null);
          }
        }
      } catch {
        // network/parse error: stay silent and show nothing
        setRequests([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch ((urgency || '').toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filtered = requests.filter((r) => {
    // Hide fulfilled requests unless explicitly searching for them
    if (r.status === 'Fulfilled') return false;
    
    const matchesUrgency = urgencyFilter === "all" || (r.urgency_level || '').toLowerCase() === urgencyFilter;
    const matchesType = typeFilter === "all" || (r.request_type || '').toLowerCase().includes(typeFilter);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (r.shelter_name || '').toLowerCase().includes(q) || (r.request_type || '').toLowerCase().includes(q);
    return matchesUrgency && matchesType && matchesSearch;
  });

  const onFulfill = (r: any) => {
    if (!isAuthenticated) {
      navigate('/auth?tab=register');
      return;
    }
    // Filter out fulfilled requests from being clickable
    if (r.status === 'Fulfilled') {
      return;
    }
    const params = new URLSearchParams({ 
      shelter: r.shelter_name || '', 
      type: r.request_type || '', 
      quantity: r.quantity || '',
      unit: r.unit || ''
    });
    navigate(`/requests/${r.request_id}/fulfill?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Package className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
            Current Requests
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Shelters in need are requesting food donations. Browse requests and make a donation to help your community.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by shelter or type..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="produce">Fresh Produce</SelectItem>
                <SelectItem value="canned">Canned Goods</SelectItem>
                <SelectItem value="dairy">Dairy Products</SelectItem>
                <SelectItem value="meat">Meat & Protein</SelectItem>
                <SelectItem value="bakery">Bakery Items</SelectItem>
                <SelectItem value="meals">Prepared Meals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? null : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((request) => (
              <Card key={request.request_id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-heading font-semibold text-xl text-foreground">
                    {request.shelter_name}
                  </h3>
                  <Badge className={getUrgencyColor(request.urgency_level)}>
                    {(request.urgency_level || '').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{request.request_type}</span>
                    <span className="text-muted-foreground">• {request.quantity} {request.unit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(request.requested_at).toLocaleString()}
                  </div>
                  {request.status && request.status !== 'Open' && (
                    <Badge variant="outline">
                      {request.status}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {request.description}
                </p>

                <Button 
                  className="w-full" 
                  onClick={() => onFulfill(request)}
                  disabled={request.status === 'Fulfilled'}
                >
                  {request.status === 'Fulfilled' ? 'Fulfilled' : 'Donate to Fulfill'}
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default Requests;
