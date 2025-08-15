import { MetricCard } from "@/components/ui/metric-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { TicketCard } from "@/components/tickets/ticket-card";
import type { Ticket, TicketStatus } from "@/types";
import { TrendingUp, AlertTriangle, Users, Clock, CheckCircle2, Ticket as TicketIcon } from "lucide-react";
import { mockAnalytics } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp, query, orderBy, limit, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { db } from "@/lib/firebase";

// --- Shared Firestore Ticket mapping logic (from TicketsList) ---
function mapDocToTicket(doc: QueryDocumentSnapshot<DocumentData>): Ticket {
  const data = doc.data() as any;
  const issue: string = data.issue || '';
  const statusTitle: string = data.status || 'Pending';
  const category = issue.startsWith('Hardware') ? 'hardware'
    : issue.startsWith('Internet') ? 'internet'
    : issue.startsWith('Software') ? 'software'
    : 'erp';
  const mappedStatus = statusTitle.toLowerCase();
  const createdAt: Date = (data.timestamp && typeof data.timestamp.toDate === 'function')
    ? data.timestamp.toDate()
    : new Date();
  const acknowledgedAt: Date | undefined = (data.acknowledgeTime && typeof data.acknowledgeTime.toDate === 'function')
    ? data.acknowledgeTime.toDate()
    : undefined;
  const assignedName: string | undefined = data.staffAssignedName || data.staffAssigned || '';

  return {
    id: doc.id,
    ticketNo: `GDC-${data.ticket || ''}`,
    createdBy: {
      uid: data.createdBy?.uid || '',
      name: data.userName || '',
      employeeNo: data.employeeID || undefined,
      location: data.location || undefined,
    },
    assignedTo: assignedName ? { uid: '', name: assignedName } : null,
    category,
    status: mappedStatus as TicketStatus,
    details: data.remarks || '',
    remarks: data.remarks ? [data.remarks] : [],
    createdAt,
    acknowledgedAt,
    resolvedAt: undefined,
  };
}

export default function Dashboard() {
  const currentAnalytics = mockAnalytics[0];
  // Recent tickets state
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  // Fetch recent tickets from Firestore
  useEffect(() => {
    const fetchRecentTickets = async () => {
      const ticketsRef = collection(db, "tickets");
      const q = query(ticketsRef, orderBy("timestamp", "desc"), limit(3));
      const ticketsSnap = await getDocs(q);
      const tickets: Ticket[] = ticketsSnap.docs.map(mapDocToTicket);
      setRecentTickets(tickets);
    };
    fetchRecentTickets();
  }, []);

  // Fetch total users and today's tickets from Firestore
  const [totalTickets, setTotalTickets] = useState(0);
  const [todayTickets, setTodayTickets] = useState(0);
  const [ticketsPerStaff, setTicketsPerStaff] = useState(0);
  const [staffBreakdown, setStaffBreakdown] = useState<{ name: string; count: number }[]>([]);
  useEffect(() => {
    const fetchTotals = async () => {
      // Fetch tickets
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      setTotalTickets(ticketsSnap.size);
      // Calculate today's tickets
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let todayCount = 0;
      const staffTicketMap: Record<string, number> = {};
      const staffAssignedList: string[] = [];
      ticketsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const ts = data.timestamp;
        let createdAt;
        if (ts && typeof ts === 'object' && ts.seconds) {
          createdAt = new Date(ts.seconds * 1000);
        } else if (typeof ts === 'string' || typeof ts === 'number') {
          createdAt = new Date(ts);
        }
        if (createdAt) {
          const createdDate = new Date(createdAt);
          createdDate.setHours(0, 0, 0, 0);
          if (createdDate.getTime() === today.getTime()) {
            todayCount++;
          }
        }
        // Collect staffAssigned
        if (data.staffAssigned) {
          const staff = Array.isArray(data.staffAssigned) ? data.staffAssigned : [data.staffAssigned];
          staff.forEach((s: string) => {
            staffTicketMap[s] = (staffTicketMap[s] || 0) + 1;
            if (!staffAssignedList.includes(s)) staffAssignedList.push(s);
          });
        }
      });
      setTodayTickets(todayCount);

      // Fetch users to map staffAssigned to names
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap: Record<string, string> = {};
      usersSnap.forEach(userDoc => {
        const user = userDoc.data();
        // Try to match by employeeID or name
        if (user.employeeID) userMap[user.employeeID] = user.name;
        if (user.name) userMap[user.name] = user.name;
      });

      // Build breakdown
      const breakdown: { name: string; count: number }[] = staffAssignedList.map(staff => ({
        name: userMap[staff] || staff,
        count: staffTicketMap[staff] || 0
      }));
      setStaffBreakdown(breakdown);
      // Calculate average tickets per staff
      setTicketsPerStaff(
        breakdown.length > 0 ? Math.round(breakdown.reduce((sum, s) => sum + s.count, 0) / breakdown.length) : 0
      );
    };
    fetchTotals();
  }, []);

  const todayPercent = totalTickets > 0 ? Math.round((todayTickets / totalTickets) * 100) : 0;
  const successRate = Math.round((currentAnalytics.sla.success / (totalTickets || 1)) * 100);
  const slaViolations = currentAnalytics.sla.violations;


  // Prepare chart data from Firestore
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    const fetchChartData = async () => {
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const issueMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};
      ticketsSnap.forEach(docSnap => {
        const data = docSnap.data();
        // Issue distribution
        if (data.issue) {
          issueMap[data.issue] = (issueMap[data.issue] || 0) + 1;
        }
        // Status distribution
        if (data.status) {
          statusMap[data.status] = (statusMap[data.status] || 0) + 1;
        }
      });
      setCategoryData(Object.entries(issueMap).map(([name, value]) => ({ name, value })));
      setStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
    };
    fetchChartData();
  }, []);

  // Calculate daily ticket volume from Firestore
  const [trendData, setTrendData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    const fetchTrend = async () => {
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const dateMap: Record<string, number> = {};
      ticketsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const ts = data.timestamp;
        let createdAt;
        if (ts && typeof ts === 'object' && ts.seconds) {
          createdAt = new Date(ts.seconds * 1000);
        } else if (typeof ts === 'string' || typeof ts === 'number') {
          createdAt = new Date(ts);
        }
        if (createdAt) {
          const dateStr = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        }
      });
      // Sort by date ascending
      const sorted = Object.entries(dateMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([name, value]) => ({ name, value }));
      setTrendData(sorted);
    };
    fetchTrend();
  }, []);

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
          description={`Today: ${todayTickets} (${todayPercent}%)`}
          icon={TicketIcon}
          trend={{ value: todayTickets, isPositive: true }}
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
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <MetricCard
                title="Tickets per Staff"
                value={ticketsPerStaff}
                description="Average workload"
                icon={Users}
                trend={{ value: ticketsPerStaff, isPositive: false }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {staffBreakdown.length > 0
              ? staffBreakdown.map(s => (
                  <div key={s.name}>{s.name}: {s.count}</div>
                ))
              : 'No staff data'}
          </TooltipContent>
        </Tooltip>
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
          <a href="/app/tickets/all" className="text-primary hover:text-primary-dark text-sm font-medium">
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <div className="col-span-full text-muted-foreground text-center py-8">No recent tickets found.</div>
          )}
        </div>
      </div>
    </div>
  );
}