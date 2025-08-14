import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Clock,
  ArrowRight,
  CheckCircle2,
  Ticket
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const { user } = useUser();
  
  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">GDC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Greenfield Development Corporation</h1>
                <p className="text-sm text-muted-foreground">Secure Ticketing System</p>
              </div>
            </div>
            {user ? (
              <Link to="/app">
                <Button className="gdc-gradient">
                  Access System
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="gdc-gradient">
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Enterprise-Grade
              <span className="text-primary block">Ticketing System</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Streamline IT support with our secure, role-based ticketing platform. 
              Built for enterprise teams with SLA tracking and comprehensive analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/app/new-ticket">
                    <Button size="lg" className="gdc-gradient">
                      <Ticket className="h-5 w-5 mr-2" />
                      Create Ticket
                    </Button>
                  </Link>
                  <Link to="/app/dashboard">
                    <Button size="lg" variant="outline">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      View Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="gdc-gradient">
                      <Ticket className="h-5 w-5 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Built for Security & Performance
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our ticketing system follows enterprise security standards with comprehensive 
              audit trails and role-based access control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced security with CSP, secure headers, MFA enforcement, and comprehensive audit logging.
                </p>
              </CardContent>
            </Card>

            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instant notifications and real-time status updates ensure rapid response to critical issues.
                </p>
              </CardContent>
            </Card>

            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Role-Based Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Granular permissions system with admin and employee roles, ensuring proper access control.
                </p>
              </CardContent>
            </Card>

            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comprehensive reporting with SLA tracking, performance metrics, and trend analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>SLA Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automated SLA tracking with configurable targets and violation alerts for optimal performance.
                </p>
              </CardContent>
            </Card>

            <Card className="gdc-card hover:shadow-gdc-md transition-all">
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>PWA Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Progressive Web App with offline capabilities and native-like experience across all devices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 Greenfield Development Corporation. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Version 1.0.0 | Secure Ticketing System
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
