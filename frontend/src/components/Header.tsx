import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Donate", path: "/donate" },
    { name: "Requests", path: "/requests" },
    { name: "Volunteer", path: "/volunteer" },
    { name: "Shelters", path: "/shelters" },
  ];

  // Add role-specific navigation items
  const getRoleSpecificNavItems = () => {
    if (!isAuthenticated || !user) return [];
    
    switch (user.role) {
      case 'admin':
        return [
          { name: "Admin Panel", path: "/admin" },
          { name: "Dashboard", path: "/dashboard" },
        ];
      case 'donor':
        return [
          { name: "Donor Dashboard", path: "/donor-dashboard" },
          { name: "Dashboard", path: "/dashboard" },
        ];
      case 'volunteer':
        return [
          { name: "Volunteer Dashboard", path: "/volunteer-dashboard" },
          { name: "Dashboard", path: "/dashboard" },
        ];
      case 'shelter':
        return [
          { name: "Shelter Dashboard", path: "/shelter-dashboard" },
          { name: "Dashboard", path: "/dashboard" },
        ];
      case 'recipient':
        return [
          { name: "Recipient Dashboard", path: "/recipient-dashboard" },
          { name: "Dashboard", path: "/dashboard" },
        ];
      default:
        return [
          { name: "Dashboard", path: "/dashboard" },
        ];
    }
  };

  const allNavItems = [...navItems, ...getRoleSpecificNavItems()];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-foreground">ReLive</span>
              <span className="text-xs text-muted-foreground -mt-1">Share Food. Shelter Lives. Restore Hope.</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {allNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-3">
              {allNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
                      <User className="h-4 w-4" />
                      <span>{user?.name}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Login</Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
