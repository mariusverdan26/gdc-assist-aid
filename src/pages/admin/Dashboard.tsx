import { MetricCard } from "@/components/ui/metric-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { TicketCard } from "@/components/tickets/ticket-card";
import type { Ticket, TicketStatus } from "@/types";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Ticket as TicketIcon,
  Wifi,
  Cpu,
  Monitor,
  Database,
} from "lucide-react";
import { mockAnalytics } from "@/lib/mock-data";
import { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { saveAs } from "file-saver";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  collection,
  getDocs,
  Timestamp,
  query,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { db } from "@/lib/firebase";

// --- Shared Firestore Ticket mapping logic (from TicketsList) ---
function mapDocToTicket(doc: QueryDocumentSnapshot<DocumentData>): Ticket {
  const data = doc.data() as any;
  const issue: string = data.issue || "";
  const statusTitle: string = data.status || "Pending";
  const category = issue.startsWith("Hardware")
    ? "hardware"
    : issue.startsWith("Internet")
    ? "internet"
    : issue.startsWith("Software")
    ? "software"
    : "erp";
  const mappedStatus = statusTitle.toLowerCase();
  const createdAt: Date =
    data.timestamp && typeof data.timestamp.toDate === "function"
      ? data.timestamp.toDate()
      : new Date();
  const acknowledgedAt: Date | undefined =
    data.acknowledgeTime && typeof data.acknowledgeTime.toDate === "function"
      ? data.acknowledgeTime.toDate()
      : undefined;
  const assignedName: string | undefined =
    data.staffAssignedName || data.staffAssigned || "";

  return {
    id: doc.id,
    ticketNo: `GDC-${data.ticket || ""}`,
    createdBy: {
      uid: data.createdBy?.uid || "",
      name: data.userName || "",
      employeeNo: data.employeeID || undefined,
      location: data.location || undefined,
    },
    assignedTo: assignedName ? { uid: "", name: assignedName } : null,
    category,
    status: mappedStatus as TicketStatus,
    details: data.remarks || "",
    remarks: data.remarks ? [data.remarks] : [],
    createdAt,
    acknowledgedAt,
    resolvedAt: undefined,
  };
}

export default function Dashboard() {
  // State for selected month and year for filtering
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  // Filter state for daily ticket volume
  const [trendFilter, setTrendFilter] = useState<
    "day" | "week" | "month" | "year"
  >("day");
  const currentAnalytics = mockAnalytics[0];
  // Sorting state for Most Common Issues table
  const [issueSort, setIssueSort] = useState<"count" | "name">("count");
  // Recent tickets state
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  // CSV export for ticket volume (must be inside component to access state)
  function exportDashboardCSV() {
    let csv = "";
    // Dashboard Title
    csv += "Dashboard Report\n";
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Metrics
    csv += "Metrics\n";
    csv += `Total Tickets,${totalTickets}\n`;
    csv += `Today Tickets,${todayTickets}\n`;
    csv += `Tickets Per Staff,${ticketsPerStaff}\n`;
    csv += `SLA Success Rate,${successRate}%\n`;
    csv += `SLA Violations,${slaViolations}\n\n`;

    // Most Common Issues
    csv += "Most Common Issues\n";
    csv += "Issue,Tickets\n";
    ["Internet/Network", "Hardware", "Software", "ERP System"].forEach(
      (issue) => {
        csv += `${issue},${issueCounts[issue] || 0}\n`;
      }
    );
    csv += "\n";

    // Admin Performance
    csv += "Admin Performance\n";
    csv += "Name,Total,Ongoing,Resolved,% Resolved,Avg. Rating\n";
    adminStats.forEach((a) => {
      csv += `${a.name},${a.total},${a.ongoing},${a.resolved},${
        a.percentResolved
      }%,${a.avgRating !== null ? a.avgRating.toFixed(2) : "-"}\n`;
    });
    csv += "\n";

    // Ticket Volume
    csv +=
      "Ticket Volume (" +
      (trendFilter === "day"
        ? "Day"
        : trendFilter === "week"
        ? "Week"
        : trendFilter === "month"
        ? "Month"
        : "Year") +
      ")\n";
    if (trendFilter === "day") {
      csv += `Day,Ticket Count\n`;
    } else if (trendFilter === "week") {
      csv += `Week,Ticket Count\n`;
    } else if (trendFilter === "month") {
      csv += `Month,Ticket Count\n`;
    } else {
      csv += `Year,Ticket Count\n`;
    }
    trendData.forEach((row) => {
      csv += `${row.name},${row.value}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `dashboard_report_${trendFilter}.csv`);
  }

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
  const [staffBreakdown, setStaffBreakdown] = useState<
    { name: string; count: number }[]
  >([]);
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
      ticketsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const ts = data.timestamp;
        let createdAt;
        if (ts && typeof ts === "object" && ts.seconds) {
          createdAt = new Date(ts.seconds * 1000);
        } else if (typeof ts === "string" || typeof ts === "number") {
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
          const staff = Array.isArray(data.staffAssigned)
            ? data.staffAssigned
            : [data.staffAssigned];
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
      usersSnap.forEach((userDoc) => {
        const user = userDoc.data();
        // Try to match by employeeID or name
        if (user.employeeID) userMap[user.employeeID] = user.name;
        if (user.name) userMap[user.name] = user.name;
      });

      // Build breakdown
      const breakdown: { name: string; count: number }[] =
        staffAssignedList.map((staff) => ({
          name: userMap[staff] || staff,
          count: staffTicketMap[staff] || 0,
        }));
      setStaffBreakdown(breakdown);
      // Calculate average tickets per staff
      setTicketsPerStaff(
        breakdown.length > 0
          ? Math.round(
              breakdown.reduce((sum, s) => sum + s.count, 0) / breakdown.length
            )
          : 0
      );
    };
    fetchTotals();
  }, []);

  const todayPercent =
    totalTickets > 0 ? Math.round((todayTickets / totalTickets) * 100) : 0;
  const successRate = Math.round(
    (currentAnalytics.sla.success / (totalTickets || 1)) * 100
  );
  const slaViolations = currentAnalytics.sla.violations;

  // Prepare chart data from Firestore
  const [categoryData, setCategoryData] = useState<
    { name: string; value: number }[]
  >([]);
  const [statusData, setStatusData] = useState<
    { name: string; value: number }[]
  >([]);
  // Most common issues state
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({
    "Internet/Network": 0,
    Hardware: 0,
    Software: 0,
    "ERP System": 0,
  });
  useEffect(() => {
    const fetchChartData = async () => {
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const issueMap: Record<string, number> = {
        "Internet/Network": 0,
        Hardware: 0,
        Software: 0,
        "ERP System": 0,
      };
      const statusMap: Record<string, number> = {};
      ticketsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        // Issue distribution (normalize to four main issues)
        if (data.issue) {
          let key = null;
          if (/internet|network/i.test(data.issue)) key = "Internet/Network";
          else if (/hardware/i.test(data.issue)) key = "Hardware";
          else if (/software/i.test(data.issue)) key = "Software";
          else if (/erp/i.test(data.issue)) key = "ERP System";
          if (key) issueMap[key] = (issueMap[key] || 0) + 1;
        }
        // Status distribution
        if (data.status) {
          statusMap[data.status] = (statusMap[data.status] || 0) + 1;
        }
      });
      setCategoryData(
        Object.entries(issueMap).map(([name, value]) => ({ name, value }))
      );
      setStatusData(
        Object.entries(statusMap).map(([name, value]) => ({ name, value }))
      );
      setIssueCounts(issueMap);
    };
    fetchChartData();
  }, []);

  // Calculate daily ticket volume from Firestore
  const [trendData, setTrendData] = useState<{ name: string; value: number }[]>(
    []
  );
  useEffect(() => {
    const fetchTrend = async () => {
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const dateMap: Record<string, number> = {};
      ticketsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const ts = data.timestamp;
        let createdAt;
        if (ts && typeof ts === "object" && ts.seconds) {
          createdAt = new Date(ts.seconds * 1000);
        } else if (typeof ts === "string" || typeof ts === "number") {
          createdAt = new Date(ts);
        }
        if (createdAt) {
          let key = "";
          if (trendFilter === "day") {
            if (
              createdAt.getFullYear() === selectedYear &&
              createdAt.getMonth() === selectedMonth
            ) {
              key = createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              dateMap[key] = (dateMap[key] || 0) + 1;
            }
          } else if (trendFilter === "week") {
            if (
              createdAt.getFullYear() === selectedYear &&
              createdAt.getMonth() === selectedMonth
            ) {
              const year = createdAt.getFullYear();
              const firstDay = new Date(year, 0, 1);
              const days = Math.floor(
                (createdAt.getTime() - firstDay.getTime()) / 86400000
              );
              const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
              key = `${year}-W${week}`;
              dateMap[key] = (dateMap[key] || 0) + 1;
            }
          } else if (trendFilter === "month") {
            if (createdAt.getFullYear() === selectedYear) {
              key = createdAt.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              dateMap[key] = (dateMap[key] || 0) + 1;
            }
          } else if (trendFilter === "year") {
            key = createdAt.getFullYear().toString();
            dateMap[key] = (dateMap[key] || 0) + 1;
          }
        }
      });
      let result: { name: string; value: number }[] = [];
      if (trendFilter === "day") {
        // Fill all days of selected month
        const daysInMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(selectedYear, selectedMonth, d);
          const key = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          result.push({ name: key, value: dateMap[key] || 0 });
        }
      } else if (trendFilter === "week") {
        // Fill all weeks of selected month
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        let weekStart = new Date(firstDay);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // start from Sunday
        let weekNum = 1;
        while (weekStart <= lastDay) {
          const year = weekStart.getFullYear();
          const week = Math.ceil(
            ((weekStart.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
              new Date(year, 0, 1).getDay() +
              1) /
              7
          );
          const key = `${year}-W${week}`;
          result.push({ name: key, value: dateMap[key] || 0 });
          weekStart.setDate(weekStart.getDate() + 7);
          weekNum++;
        }
      } else if (trendFilter === "month") {
        // Fill all months of selected year
        for (let m = 0; m < 12; m++) {
          const date = new Date(selectedYear, m, 1);
          const key = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          result.push({ name: key, value: dateMap[key] || 0 });
        }
      } else if (trendFilter === "year") {
        // Just use the years present in the data
        result = Object.entries(dateMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, value]) => ({ name, value }));
      }
      setTrendData(result);
    };
    fetchTrend();
  }, [trendFilter, selectedYear, selectedMonth]);

  // Admin performance table state
  const [adminStats, setAdminStats] = useState<
    Array<{
      id: string;
      name: string;
      email?: string;
      total: number;
      ongoing: number;
      resolved: number;
      percentResolved: number;
      avgRating: number | null;
    }>
  >([]);

  useEffect(() => {
    async function fetchAdminStats() {
      // Fetch all admin users
      const usersSnap = await getDocs(query(collection(db, "users")));
      const admins = usersSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((u: any) => u.role === "admin");

      // Fetch all tickets
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const tickets = ticketsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // For each admin, compute stats
      const stats = admins.map((admin: any) => {
        const assignedTickets = tickets.filter(
          (t: any) => t.staffAssignedName === admin.id
        );
        const total = assignedTickets.length;
        const ongoing = assignedTickets.filter(
          (t: any) => t.status === "Ongoing"
        ).length;
        const resolved = assignedTickets.filter(
          (t: any) => t.status === "Resolved"
        ).length;
        const percentResolved =
          total > 0 ? Math.round((resolved / total) * 100) : 0;
        const ratings = assignedTickets
          .map((t: any) => (typeof t.rating === "number" ? t.rating : null))
          .filter((r: any) => r !== null) as number[];
        const avgRating =
          ratings.length > 0
            ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : null;
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          total,
          ongoing,
          resolved,
          percentResolved,
          avgRating,
        };
      });
      setAdminStats(stats);
    }
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div className="">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of ticket management and SLA performance
            </p>
          </div>
          <button
            onClick={exportDashboardCSV}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded shadow transition-colors border border-green-700"
            title="Export CSV Report"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="bg-white rounded-lg shadow border-[1.5px] overflow-hidden flex flex-col justify-between">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              <span className="text-base font-semibold">Admin Performance</span>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-100 to-green-200 text-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Total Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Ongoing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    % Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Avg. Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No admin data
                    </td>
                  </tr>
                ) : (
                  adminStats.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={`transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-green-50`}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800 font-medium">
                        {a.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-sm text-gray-700">
                        {a.total}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800">
                        {a.ongoing}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800">
                        {a.resolved}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800">
                        {a.percentResolved}%
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800">
                        {a.avgRating !== null ? a.avgRating.toFixed(2) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
          variant={
            successRate >= 90
              ? "success"
              : successRate >= 75
              ? "warning"
              : "destructive"
          }
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="SLA Violations"
          value={slaViolations}
          description="Exceeded target time"
          icon={AlertTriangle}
          variant={
            slaViolations > 3
              ? "destructive"
              : slaViolations > 1
              ? "warning"
              : "success"
          }
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
              ? staffBreakdown.map((s) => (
                  <div key={s.name}>
                    {s.name}: {s.count}
                  </div>
                ))
              : "No staff data"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Most Common Issues Table - above charts grid */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow border-[1.5px] overflow-hidden flex flex-col justify-between">
          <div className="p-4 pb-0">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              <span className="text-base font-semibold">
                Most Common Issues
              </span>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-100 to-green-200 text-gray-700">
                  <th
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none align-middle"
                    onClick={() =>
                      setIssueSort(issueSort === "name" ? "count" : "name")
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      Issue
                      {issueSort === "name" && (
                        <span className="text-xs">▲</span>
                      )}
                    </span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none align-middle"
                    onClick={() =>
                      setIssueSort(issueSort === "count" ? "name" : "count")
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      Tickets
                      {issueSort === "count" && (
                        <span className="text-xs">▼</span>
                      )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const issues = [
                    "Internet/Network",
                    "Hardware",
                    "Software",
                    "ERP System",
                  ];
                  const sorted = [...issues].sort((a, b) => {
                    if (issueSort === "count") {
                      return (issueCounts[b] || 0) - (issueCounts[a] || 0);
                    } else {
                      return a.localeCompare(b);
                    }
                  });
                  return sorted.map((issue) => {
                    let Icon = null;
                    if (issue === "Internet/Network") Icon = Wifi;
                    else if (issue === "Hardware") Icon = Cpu;
                    else if (issue === "Software") Icon = Monitor;
                    else if (issue === "ERP System") Icon = Database;
                    return (
                      <tr
                        key={issue}
                        className="transition-colors hover:bg-green-50"
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 flex items-center gap-2">
                          {Icon && <Icon className="w-5 h-5 text-green-700" />}{" "}
                          {issue}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-mono text-sm text-gray-700">
                          {issueCounts[issue] || 0}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
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
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
            <h3 className="text-base font-semibold">Ticket Volume</h3>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value as any)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              {(trendFilter === "day" ||
                trendFilter === "week" ||
                trendFilter === "month") && (
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = now.getFullYear() - i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              )}
              {(trendFilter === "day" || trendFilter === "week") && (
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString("en-US", {
                        month: "short",
                      })}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <AnalyticsChart
            data={trendData}
            type="bar"
            title={
              trendFilter === "day"
                ? "Daily Ticket Volume"
                : trendFilter === "week"
                ? "Weekly Ticket Volume"
                : trendFilter === "month"
                ? "Monthly Ticket Volume"
                : "Yearly Ticket Volume"
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Tickets
          </h2>
          <a
            href="/app/tickets/all"
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <div className="col-span-full text-muted-foreground text-center py-8">
              No recent tickets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
