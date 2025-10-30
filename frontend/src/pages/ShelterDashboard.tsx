import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Users, Package, AlertCircle, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface ShelterInfo {
  shelter_id: number;
  shelter_name: string;
  email: string;
  phone: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  food_stock_status: string;
}

interface Request {
  request_id: number;
  request_type: string;
  quantity: number;
  unit: string;
  urgency_level: string;
  status: string;
  description: string;
  requested_at: string;
}

interface VolunteerAssignment {
  assignment_id: number;
  assigned_at: string;
  assignment_status: string;
  opportunity_id: number;
  title: string;
  task_type: string;
  date_needed: string;
  time_needed: string;
  volunteer_id: number;
  volunteer_name: string;
  email: string;
  phone: string;
  area_of_service: string;
}

const ShelterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [shelterInfo, setShelterInfo] = useState<ShelterInfo | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOccupancyDialogOpen, setIsOccupancyDialogOpen] = useState(false);
  const [isFoodStockDialogOpen, setIsFoodStockDialogOpen] = useState(false);
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    requestType: "",
    quantity: "",
    unit: "",
    urgencyLevel: "Medium",
    description: "",
  });
  const [occupancyValue, setOccupancyValue] = useState("");
  const [foodStockValue, setFoodStockValue] = useState("");
  const [volunteerFormData, setVolunteerFormData] = useState({
    title: "",
    description: "",
    taskType: "",
    volunteersNeeded: "1",
    dateNeeded: "",
    timeNeeded: "",
    durationHours: "",
    location: "",
    urgencyLevel: "Medium",
  });

  useEffect(() => {
    fetchShelterData();
  }, []);

  const fetchShelterData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch shelter info
      const infoRes = await fetch(`${API_BASE}/api/shelter/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setShelterInfo(infoData.shelter);
      }

      // Fetch requests
      const requestsRes = await fetch(`${API_BASE}/api/shelter/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.requests || []);
      }

      // Fetch volunteer assignments
      const assignmentsRes = await fetch(`${API_BASE}/api/shelter/volunteer-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setVolunteerAssignments(assignmentsData.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching shelter data:', error);
      toast.error('Failed to load shelter data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_type: formData.requestType,
          quantity: formData.quantity,
          unit: formData.unit,
          urgency_level: formData.urgencyLevel,
          description: formData.description,
        }),
      });

      if (res.ok) {
        toast.success('Request created successfully!');
        setIsDialogOpen(false);
        setFormData({
          requestType: "",
          quantity: "",
          unit: "",
          urgencyLevel: "Medium",
          description: "",
        });
        setTimeout(() => {
          fetchShelterData();
        }, 100);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
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

  const handleUpdateOccupancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const occupancy = parseInt(occupancyValue);

      if (isNaN(occupancy) || occupancy < 0) {
        toast.error('Please enter a valid occupancy number');
        return;
      }

      if (shelterInfo && occupancy > shelterInfo.capacity) {
        toast.error(`Occupancy cannot exceed capacity (${shelterInfo.capacity})`);
        return;
      }

      const res = await fetch(`${API_BASE}/api/shelter/occupancy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ current_occupancy: occupancy }),
      });

      if (res.ok) {
        toast.success('Occupancy updated successfully!');
        setIsOccupancyDialogOpen(false);
        setOccupancyValue("");
        fetchShelterData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update occupancy');
      }
    } catch (error) {
      console.error('Error updating occupancy:', error);
      toast.error('Failed to update occupancy');
    }
  };

  const handleUpdateFoodStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');

      if (!foodStockValue) {
        toast.error('Please select a food stock status');
        return;
      }

      const res = await fetch(`${API_BASE}/api/shelter/food-stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ food_stock_status: foodStockValue }),
      });

      if (res.ok) {
        toast.success('Food stock status updated successfully!');
        setIsFoodStockDialogOpen(false);
        setFoodStockValue("");
        fetchShelterData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update food stock status');
      }
    } catch (error) {
      console.error('Error updating food stock:', error);
      toast.error('Failed to update food stock status');
    }
  };

  const handleCreateVolunteerOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/api/shelter/volunteer-opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: volunteerFormData.title,
          description: volunteerFormData.description,
          task_type: volunteerFormData.taskType,
          volunteers_needed: parseInt(volunteerFormData.volunteersNeeded),
          date_needed: volunteerFormData.dateNeeded || null,
          time_needed: volunteerFormData.timeNeeded || null,
          duration_hours: volunteerFormData.durationHours ? parseFloat(volunteerFormData.durationHours) : null,
          location: volunteerFormData.location || shelterInfo?.location,
          urgency_level: volunteerFormData.urgencyLevel,
        }),
      });

      if (res.ok) {
        toast.success('Volunteer opportunity created successfully!');
        setIsVolunteerDialogOpen(false);
        setVolunteerFormData({
          title: "",
          description: "",
          taskType: "",
          volunteersNeeded: "1",
          dateNeeded: "",
          timeNeeded: "",
          durationHours: "",
          location: "",
          urgencyLevel: "Medium",
        });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create volunteer opportunity');
      }
    } catch (error) {
      console.error('Error creating volunteer opportunity:', error);
      toast.error('Failed to create volunteer opportunity');
    }
  };

  const urgentRequestsCount = requests.filter(r => r.urgency_level === 'Urgent' || r.urgency_level === 'High').length;

  const shelterStats = [
    { 
      icon: Users, 
      label: "Current Occupancy", 
      value: shelterInfo?.current_occupancy || 0, 
      color: "text-blue-600" 
    },
    { 
      icon: Home, 
      label: "Capacity", 
      value: shelterInfo?.capacity || 0, 
      color: "text-green-600" 
    },
    { 
      icon: Package, 
      label: "Food Stock", 
      value: shelterInfo?.food_stock_status || "Unknown", 
      color: "text-purple-600" 
    },
    { 
      icon: AlertCircle, 
      label: "Urgent Needs", 
      value: urgentRequestsCount, 
      color: "text-red-600" 
    },
  ];

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

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'fulfilled' || normalizedStatus === 'completed') {
      return "bg-green-100 text-green-700 border-green-200";
    } else if (normalizedStatus === 'in progress' || normalizedStatus === 'matched') {
      return "bg-blue-100 text-blue-700 border-blue-200";
    } else if (normalizedStatus === 'pending' || normalizedStatus === 'open') {
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
                {shelterInfo?.shelter_name || 'Shelter Dashboard'}
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your shelter operations and requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Food Request</DialogTitle>
                    <DialogDescription>
                      Submit a new food request for your shelter.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRequest} className="space-y-4">
                    <div>
                      <Label htmlFor="requestType">Request Type</Label>
                      <Input
                        id="requestType"
                        value={formData.requestType}
                        onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                        placeholder="e.g., Fresh Vegetables, Canned Goods"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          placeholder="e.g., 50"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) => setFormData({ ...formData, unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                            <SelectItem value="items">Items</SelectItem>
                            <SelectItem value="meals">Meals</SelectItem>
                            <SelectItem value="servings">Servings</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="gallons">Gallons</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="urgencyLevel">Urgency Level</Label>
                      <Select
                        value={formData.urgencyLevel}
                        onValueChange={(value) => setFormData({ ...formData, urgencyLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Additional details about your request..."
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Request</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
            <Badge variant="secondary">SHELTER</Badge>
            <span>•</span>
            <span>{shelterInfo?.email || user?.email}</span>
            {shelterInfo?.location && (
              <>
                <span>•</span>
                <span>{shelterInfo.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading shelter data...</p>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {shelterStats.map((stat, index) => (
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
              {/* Recent Requests */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-2xl text-foreground">
                    Your Requests
                  </h2>
                  <Badge variant="secondary">{requests.length} total</Badge>
                </div>
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No requests yet. Create your first request to get started!
                    </p>
                  ) : (
                    requests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{request.request_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.quantity} {request.unit} • {formatDate(request.requested_at)}
                          </p>
                          {request.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {request.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={getUrgencyColor(request.urgency_level)}>
                              {request.urgency_level}
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
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
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Food Request
                  </Button>

                  {/* Update Occupancy Dialog */}
                  <Dialog open={isOccupancyDialogOpen} onOpenChange={setIsOccupancyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setOccupancyValue(shelterInfo?.current_occupancy?.toString() || "")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Update Occupancy
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Current Occupancy</DialogTitle>
                        <DialogDescription>
                          Update the number of people currently at your shelter.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateOccupancy} className="space-y-4">
                        <div>
                          <Label htmlFor="occupancy">Current Occupancy</Label>
                          <Input
                            id="occupancy"
                            type="number"
                            min="0"
                            max={shelterInfo?.capacity || 999}
                            value={occupancyValue}
                            onChange={(e) => setOccupancyValue(e.target.value)}
                            placeholder={`Max capacity: ${shelterInfo?.capacity || 0}`}
                            required
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Capacity: {shelterInfo?.capacity || 0} people
                          </p>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsOccupancyDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Update</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Update Food Stock Dialog */}
                  <Dialog open={isFoodStockDialogOpen} onOpenChange={setIsFoodStockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setFoodStockValue(shelterInfo?.food_stock_status || "")}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Update Food Stock Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Food Stock Status</DialogTitle>
                        <DialogDescription>
                          Update the current status of your food inventory.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateFoodStock} className="space-y-4">
                        <div>
                          <Label htmlFor="foodStock">Food Stock Status</Label>
                          <Select
                            value={foodStockValue}
                            onValueChange={(value) => setFoodStockValue(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Critical">Critical - Urgent assistance needed</SelectItem>
                              <SelectItem value="Low">Low - Running low on supplies</SelectItem>
                              <SelectItem value="Adequate">Adequate - Sufficient for now</SelectItem>
                              <SelectItem value="Good">Good - Well stocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsFoodStockDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Update</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Request Volunteers Dialog */}
                  <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Request Volunteers
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Request Volunteers</DialogTitle>
                        <DialogDescription>
                          Create a volunteer opportunity for your shelter.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateVolunteerOpportunity} className="space-y-4">
                        <div>
                          <Label htmlFor="volunteerTitle">Title *</Label>
                          <Input
                            id="volunteerTitle"
                            value={volunteerFormData.title}
                            onChange={(e) => setVolunteerFormData({ ...volunteerFormData, title: e.target.value })}
                            placeholder="e.g., Food Distribution Helper"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="taskType">Task Type *</Label>
                          <Select
                            value={volunteerFormData.taskType}
                            onValueChange={(value) => setVolunteerFormData({ ...volunteerFormData, taskType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Food Distribution">Food Distribution</SelectItem>
                              <SelectItem value="Meal Preparation">Meal Preparation</SelectItem>
                              <SelectItem value="Delivery Driver">Delivery Driver</SelectItem>
                              <SelectItem value="General Support">General Support</SelectItem>
                              <SelectItem value="Cleaning">Cleaning</SelectItem>
                              <SelectItem value="Administrative">Administrative</SelectItem>
                              <SelectItem value="Event Support">Event Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
                            <Input
                              id="volunteersNeeded"
                              type="number"
                              min="1"
                              value={volunteerFormData.volunteersNeeded}
                              onChange={(e) => setVolunteerFormData({ ...volunteerFormData, volunteersNeeded: e.target.value })}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="durationHours">Duration (hours)</Label>
                            <Input
                              id="durationHours"
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={volunteerFormData.durationHours}
                              onChange={(e) => setVolunteerFormData({ ...volunteerFormData, durationHours: e.target.value })}
                              placeholder="e.g., 3"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="dateNeeded">Date Needed</Label>
                            <Input
                              id="dateNeeded"
                              type="date"
                              value={volunteerFormData.dateNeeded}
                              onChange={(e) => setVolunteerFormData({ ...volunteerFormData, dateNeeded: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="timeNeeded">Time</Label>
                            <Input
                              id="timeNeeded"
                              type="time"
                              value={volunteerFormData.timeNeeded}
                              onChange={(e) => setVolunteerFormData({ ...volunteerFormData, timeNeeded: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="volunteerLocation">Location</Label>
                          <Input
                            id="volunteerLocation"
                            value={volunteerFormData.location}
                            onChange={(e) => setVolunteerFormData({ ...volunteerFormData, location: e.target.value })}
                            placeholder={shelterInfo?.location || "Shelter location"}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Leave blank to use shelter location
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="volunteerUrgency">Urgency Level</Label>
                          <Select
                            value={volunteerFormData.urgencyLevel}
                            onValueChange={(value) => setVolunteerFormData({ ...volunteerFormData, urgencyLevel: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="volunteerDescription">Description</Label>
                          <Textarea
                            id="volunteerDescription"
                            value={volunteerFormData.description}
                            onChange={(e) => setVolunteerFormData({ ...volunteerFormData, description: e.target.value })}
                            placeholder="Describe the volunteer tasks and any special requirements..."
                            rows={3}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsVolunteerDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Opportunity</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate('/requests')}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    View All Requests ({requests.length})
                  </Button>
                </div>
              </Card>
            </div>

            {/* Volunteer Assignments Section */}
            {volunteerAssignments.length > 0 && (
              <Card className="p-6 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-2xl text-foreground">
                    Assigned Volunteers
                  </h2>
                  <Badge variant="secondary">{volunteerAssignments.length} volunteers</Badge>
                </div>
                <div className="space-y-4">
                  {volunteerAssignments.map((assignment) => (
                    <div key={assignment.assignment_id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg text-foreground">{assignment.volunteer_name}</h3>
                            <Badge variant="outline" className="ml-2">
                              {assignment.assignment_status}
                            </Badge>
                          </div>
                          
                          {/* Volunteer Contact Info */}
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">Email:</span>
                              <a href={`mailto:${assignment.email}`} className="text-primary hover:underline">
                                {assignment.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">Phone:</span>
                              <a href={`tel:${assignment.phone}`} className="text-primary hover:underline">
                                {assignment.phone}
                              </a>
                            </div>
                            {assignment.area_of_service && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">Area:</span>
                                <span>{assignment.area_of_service}</span>
                              </div>
                            )}
                          </div>

                          {/* Task Details */}
                          <div className="p-3 bg-background rounded border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{assignment.title}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Type:</span>
                                <Badge variant="secondary" className="text-xs">{assignment.task_type}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Date:</span>
                                <span>{formatDate(assignment.date_needed)}</span>
                              </div>
                              {assignment.time_needed && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Time:</span>
                                  <span>{assignment.time_needed}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Assigned on: {formatDate(assignment.assigned_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShelterDashboard;
