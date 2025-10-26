import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Users, Package, Phone, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Shelters = () => {
  const shelters = [
    {
      id: 1,
      name: "Ashraya Seva Trust",
      location: "135, Dr Rajkumar Rd, 1st K Block, 2nd Stage, Rajajinagar",
      phone: "(555) 123-4567",
      email: "info@hopeshelter.org",
      currentOccupancy: 45,
      capacity: 60,
      foodStatus: "Low",
      services: ["Meals", "Housing", "Job Support"],
    },
    {
      id: 2,
      name: "Surabhi Foundation Night Shelter Home",
      location: "Royal Lake Front Phase 1 & 2, Kalena Agrahara",
      phone: "(555) 234-5678",
      email: "contact@familysupport.org",
      currentOccupancy: 32,
      capacity: 40,
      foodStatus: "Good",
      services: ["Family Housing", "Childcare", "Meals"],
    },
    {
      id: 3,
      name: "7BBMP Night Shelter Home",
      location: "58, 4 E Block, Manjunath Nagar, Rajajinagar",
      phone: "(555) 345-6789",
      email: "hello@seniorcare.org",
      currentOccupancy: 28,
      capacity: 30,
      foodStatus: "Adequate",
      services: ["Senior Housing", "Medical Care", "Meals"],
    },
    {
      id: 4,
      name: "BBMP Night Shelter",
      location: "32, 1B Cross Rd, Rotary Nagar, Bommanahalli",
      phone: "(555) 456-7890",
      email: "support@youthtransition.org",
      currentOccupancy: 18,
      capacity: 25,
      foodStatus: "Low",
      services: ["Youth Housing", "Education", "Life Skills"],
    },
    {
      id: 5,
      name: "Emergency Relief Station",
      location: "232, Ashwath Nagar, Sampangi Rama Nagar",
      phone: "(555) 567-8901",
      email: "emergency@reliefstation.org",
      currentOccupancy: 55,
      capacity: 70,
      foodStatus: "Critical",
      services: ["Emergency Housing", "Meals", "Crisis Support"],
    },
    {
      id: 6,
      name: "Veterans Support Shelter",
      location: "987 Central Avenue, Jayanagar",
      phone: "(555) 678-9012",
      email: "vets@veteransupport.org",
      currentOccupancy: 40,
      capacity: 50,
      foodStatus: "Good",
      services: ["Veteran Housing", "Healthcare", "Job Training"],
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <Home className="h-10 w-10 text-primary mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">{shelters.length}</div>
            <div className="text-muted-foreground">Registered Shelters</div>
          </Card>
          <Card className="p-6 text-center">
            <Users className="h-10 w-10 text-secondary mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">
              {shelters.reduce((sum, s) => sum + s.currentOccupancy, 0)}
            </div>
            <div className="text-muted-foreground">People Housed</div>
          </Card>
          <Card className="p-6 text-center">
            <Package className="h-10 w-10 text-accent mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">
              {shelters.filter(s => s.foodStatus === "Low" || s.foodStatus === "Critical").length}
            </div>
            <div className="text-muted-foreground">Shelters Needing Food</div>
          </Card>
        </div>

        {/* Shelters Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shelters.map((shelter) => {
            const occupancyPercentage = getOccupancyPercentage(shelter.currentOccupancy, shelter.capacity);
            return (
              <Card key={shelter.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-heading font-semibold text-xl text-foreground pr-2">
                    {shelter.name}
                  </h3>
                  <Badge className={getFoodStatusColor(shelter.foodStatus)}>
                    {shelter.foodStatus}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{shelter.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{shelter.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{shelter.email}</span>
                  </div>
                </div>

                {/* Occupancy Status */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className={`font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
                      {shelter.currentOccupancy}/{shelter.capacity} ({occupancyPercentage}%)
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

                {/* Services */}
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Services:</div>
                  <div className="flex flex-wrap gap-2">
                    {shelter.services.map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full">Contact Shelter</Button>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shelters;
