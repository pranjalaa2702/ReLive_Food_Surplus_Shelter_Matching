import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Users, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Volunteer = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const opportunities = [
    {
      id: 1,
      title: "Food Distribution Helper",
      location: "Downtown Community Center",
      date: "Every Saturday, 9AM - 12PM",
      volunteersNeeded: 5,
      currentVolunteers: 3,
      type: "Regular",
      description: "Help distribute food packages to families in need. Light physical work required.",
      timeCommitment: "3 hours/week",
    },
    {
      id: 2,
      title: "Meal Preparation Assistant",
      location: "Hope Kitchen",
      date: "Weekdays, 5PM - 8PM",
      volunteersNeeded: 8,
      currentVolunteers: 5,
      type: "Regular",
      description: "Assist with meal preparation for shelter residents. No cooking experience needed.",
      timeCommitment: "3 hours/day",
    },
    {
      id: 3,
      title: "Donation Coordinator",
      location: "Multiple Locations",
      date: "Flexible Schedule",
      volunteersNeeded: 3,
      currentVolunteers: 1,
      type: "Flexible",
      description: "Help coordinate pickups between donors and shelters. Own vehicle preferred.",
      timeCommitment: "Flexible",
    },
    {
      id: 4,
      title: "Shelter Support Staff",
      location: "Family Support Center",
      date: "Weekends, 10AM - 4PM",
      volunteersNeeded: 6,
      currentVolunteers: 4,
      type: "Weekend",
      description: "Provide general support at family shelter. Check-in guests, organize supplies.",
      timeCommitment: "6 hours/weekend",
    },
    {
      id: 5,
      title: "Community Garden Helper",
      location: "Northside Community Garden",
      date: "Sundays, 8AM - 11AM",
      volunteersNeeded: 10,
      currentVolunteers: 7,
      type: "Weekend",
      description: "Help maintain community garden that provides fresh produce to local shelters.",
      timeCommitment: "3 hours/week",
    },
    {
      id: 6,
      title: "Delivery Driver",
      location: "Various Routes",
      date: "Mon-Fri, Morning Shifts",
      volunteersNeeded: 4,
      currentVolunteers: 2,
      type: "Regular",
      description: "Transport food donations from restaurants and stores to shelters. Valid license required.",
      timeCommitment: "4 hours/day",
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Regular":
        return "bg-primary/10 text-primary border-primary/20";
      case "Weekend":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "Flexible":
        return "bg-accent/10 text-accent border-accent/20";
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
          <Users className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
            Volunteer Opportunities
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Make a difference in your community. Browse available volunteer positions and join our mission.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-6 mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by keyword, location, or activity type..."
              className="pl-12 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center bg-primary/5 border-primary/20">
            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">1,200+</div>
            <div className="text-muted-foreground">Active Volunteers</div>
          </Card>
          <Card className="p-6 text-center bg-secondary/5 border-secondary/20">
            <Clock className="h-10 w-10 text-secondary mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">45,000+</div>
            <div className="text-muted-foreground">Hours Contributed</div>
          </Card>
          <Card className="p-6 text-center bg-accent/5 border-accent/20">
            <Calendar className="h-10 w-10 text-accent mx-auto mb-3" />
            <div className="font-heading font-bold text-3xl text-foreground mb-1">150+</div>
            <div className="text-muted-foreground">Events This Month</div>
          </Card>
        </div>

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading font-semibold text-xl text-foreground pr-2">
                  {opportunity.title}
                </h3>
                <Badge className={getTypeColor(opportunity.type)}>
                  {opportunity.type}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{opportunity.location}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{opportunity.date}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{opportunity.timeCommitment}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">
                    {opportunity.currentVolunteers}/{opportunity.volunteersNeeded} volunteers
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {opportunity.description}
              </p>

              <Button className="w-full mt-auto">Join Now</Button>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <h3 className="font-heading font-bold text-2xl text-foreground mb-3">
            Don't See What You're Looking For?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always looking for volunteers with unique skills. Contact us to discuss custom volunteer opportunities.
          </p>
          <Button size="lg" variant="outline">
            Contact Volunteer Coordinator
          </Button>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Volunteer;
