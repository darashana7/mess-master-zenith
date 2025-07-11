import { Button } from "@/components/ui/button";
import { ChefHat, Calendar, Package, DollarSign, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: "Weekly Menu Management",
      description: "Plan and manage 7-day meal schedules with breakfast, lunch, and dinner"
    },
    {
      icon: Package,
      title: "Inventory & Stock",
      description: "Track stock levels, manage inventory, and get low-stock alerts"
    },
    {
      icon: DollarSign,
      title: "Financial Management",
      description: "Monitor expenses, track payments, and generate detailed reports"
    },
    {
      icon: Users,
      title: "Member Management",
      description: "Manage user profiles, attendance tracking, and billing"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Real-time dashboard with insights and performance metrics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">ITD Mess</h1>
              <p className="text-sm text-muted-foreground">Complete Mess Management Solution</p>
            </div>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Streamline Your Mess Operations
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          From menu planning to financial tracking, manage every aspect of your mess with our comprehensive solution.
        </p>
        <Link to="/auth">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Managing Today
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Everything You Need</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
                <Icon className="h-12 w-12 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-card rounded-lg p-12 border">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of mess managers who trust ITD Mess for their operations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
