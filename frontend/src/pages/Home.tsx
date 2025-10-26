import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, Package, TrendingUp, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroBanner from "@/assets/hero-banner.jpg";

const Home = () => {
  const stats = [
    { icon: Package, label: "Meals Redistributed", value: "50,000+" },
    { icon: Users, label: "Active Volunteers", value: "1,200+" },
    { icon: Heart, label: "Shelters Supported", value: "85" },
    { icon: TrendingUp, label: "Lives Impacted", value: "25,000+" },
  ];

  const features = [
    {
      title: "Donate Surplus Food",
      description: "Share your excess food with those in need. Post available donations and connect with local shelters.",
      icon: Package,
      link: "/donate",
    },
    {
      title: "Volunteer Your Time",
      description: "Join our community of volunteers. Help with food distribution, shelter support, and more.",
      icon: Users,
      link: "/volunteer",
    },
    {
      title: "Request Assistance",
      description: "Shelters and recipients can request food and supplies based on urgent needs.",
      link: "/requests",
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-6">
            Redistribute Food.<br />Restore Hope.
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-medium">
            Connecting donors, shelters, and volunteers to end food waste and support communities in need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/donate">
              <Button size="lg" className="text-lg px-8 h-14 shadow-lg hover:shadow-xl transition-shadow">
                <Package className="mr-2 h-5 w-5" />
                Donate Now
              </Button>
            </Link>
            <Link to="/volunteer">
              <Button size="lg" variant="secondary" className="text-lg px-8 h-14 shadow-lg hover:shadow-xl transition-shadow">
                <Users className="mr-2 h-5 w-5" />
                Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="font-heading font-bold text-4xl text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
              How You Can Help
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you have food to share, time to volunteer, or needs to fulfill, 
              we're here to connect you with your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                <feature.icon className="h-14 w-14 text-primary mb-6" />
                <h3 className="font-heading font-bold text-2xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <Link to={feature.link}>
                  <Button variant="ghost" className="group">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of donors, volunteers, and shelters working together to create a more compassionate community.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-10 h-14 bg-white text-primary hover:bg-white/90">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
