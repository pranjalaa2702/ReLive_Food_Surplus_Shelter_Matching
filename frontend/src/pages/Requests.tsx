import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Requests = () => {
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const requests = [
    {
      id: 1,
      shelter: "Hope Community Shelter",
      type: "Fresh Produce",
      quantity: "100 kg",
      urgency: "urgent",
      location: "Brigade Road",
      date: "Needed by: Today",
      description: "Running low on fresh vegetables for evening meal service",
    },
    {
      id: 2,
      shelter: "Family Support Center",
      type: "Canned Goods",
      quantity: "200 items",
      urgency: "high",
      location: "Bannerghatta Road",
      date: "Needed by: Tomorrow",
      description: "Restocking pantry for weekly family distributions",
    },
    {
      id: 3,
      shelter: "Senior Care Home",
      type: "Dairy Products",
      quantity: "50 liters",
      urgency: "medium",
      location: "Bellary Road (NH 44)",
      date: "Needed by: This Week",
      description: "Milk, yogurt, and cheese for senior residents",
    },
    {
      id: 4,
      shelter: "Youth Transition House",
      type: "Prepared Meals",
      quantity: "75 meals",
      urgency: "urgent",
      location: "Sarjapur Road",
      date: "Needed by: Today",
      description: "Ready-to-eat meals for transitioning youth",
    },
    {
      id: 5,
      shelter: "Community Kitchen",
      type: "Bakery Items",
      quantity: "150 items",
      urgency: "low",
      location: "Koramangala 80 Feet Road",
      date: "Needed by: Next Week",
      description: "Bread, rolls, and pastries for meal programs",
    },
    {
      id: 6,
      shelter: "Emergency Relief Station",
      type: "Meat & Protein",
      quantity: "80 kg",
      urgency: "high",
      location: "Indiranagar 100 Feet Road",
      date: "Needed by: Tomorrow",
      description: "Protein sources for emergency meal preparation",
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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
            View active requests from shelters and recipients. Help fulfill urgent needs in your community.
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

        {/* Requests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-heading font-semibold text-xl text-foreground">
                  {request.shelter}
                </h3>
                <Badge className={getUrgencyColor(request.urgency)}>
                  {request.urgency.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{request.type}</span>
                  <span className="text-muted-foreground">• {request.quantity}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {request.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {request.date}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {request.description}
              </p>

              <Button className="w-full">Fulfill Request</Button>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Requests;
