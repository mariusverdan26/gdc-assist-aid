import { MetricCard } from "@/components/ui/metric-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { TicketCard } from "@/components/tickets/ticket-card";
import { 
  Ticket, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Clock,
  CheckCircle2
} from "lucide-react";
import { mockTickets, mockAnalytics } from "@/lib/mock-data";

export default function Dashboard() {
  const currentAnalytics = mockAnalytics[0];
  const recentTickets = mockTickets.slice(0, 3);

  // Calculate metrics
  const totalTickets = currentAnalytics.counts.total;
  const successRate = Math.round((currentAnalytics.sla.success / totalTickets) * 100);
  const slaViolations = currentAnalytics.sla.violations;
  const ticketsPerStaff = Math.round(totalTickets / 3); // Assuming 3 staff members

  // Prepare chart data
  const categoryData = [
    { name: 'Internet', value: currentAnalytics.categories.internet },
    { name: 'Hardware', value: currentAnalytics.categories.hardware },
    { name: 'Software', value: currentAnalytics.categories.software },
    { name: 'ERP', value: currentAnalytics.categories.erp },
  ];

  const statusData = [
    { name: 'Pending', value: currentAnalytics.counts.pending },
    { name: 'Ongoing', value: currentAnalytics.counts.ongoing },
    { name: 'Resolved', value: currentAnalytics.counts.resolved },
  ];

  const trendData = mockAnalytics.reverse().map(analytics => ({
    name: new Date(analytics.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: analytics.counts.total,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of ticket management and SLA performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tickets"
          value={totalTickets}
          description="Today"
          icon={Ticket}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="SLA Success Rate"
          value={`${successRate}%`}
          description="Within target time"
          icon={CheckCircle2}
          variant={successRate >= 90 ? 'success' : successRate >= 75 ? 'warning' : 'destructive'}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="SLA Violations"
          value={slaViolations}
          description="Exceeded target time"
          icon={AlertTriangle}
          variant={slaViolations > 3 ? 'destructive' : slaViolations > 1 ? 'warning' : 'success'}
          trend={{ value: -20, isPositive: true }}
        />
        <MetricCard
          title="Tickets per Staff"
          value={ticketsPerStaff}
          description="Average workload"
          icon={Users}
          trend={{ value: 8, isPositive: false }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={categoryData}
          type="pie"
          title="Issue Distribution by Category"
        />
        <AnalyticsChart
          data={statusData}
          type="pie"
          title="Tickets by Status"
        />
        <AnalyticsChart
          data={trendData}
          type="bar"
          title="Daily Ticket Volume"
          className="lg:col-span-2"
        />
      </div>

      {/* Recent Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Tickets</h2>
          <a href="/app/tickets/pending" className="text-primary hover:text-primary-dark text-sm font-medium">
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    </div>
  );
}