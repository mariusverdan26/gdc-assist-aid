import { useEffect, useState } from "react";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Ticket, TicketStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import app from "@/lib/firebase";
import { getFirestore, collection, query, where, onSnapshot, Timestamp, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export default function MyTickets() {
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const { user, loading } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);

  // Map Firestore ticket doc to UI Ticket type
  const mapDocToTicket = (doc: QueryDocumentSnapshot<DocumentData>): Ticket => {
    const data = doc.data() as any;
    const issue: string = data.issue || '';
    const statusTitle: string = data.status || 'Pending';
    const category = issue.startsWith('Hardware') ? 'hardware'
      : issue.startsWith('Internet') ? 'internet'
      : issue.startsWith('Software') ? 'software'
      : 'erp';
    const status: TicketStatus = statusTitle.toLowerCase() as TicketStatus;
    const createdAt: Date = (data.timestamp && typeof data.timestamp.toDate === 'function')
      ? (data.timestamp as Timestamp).toDate()
      : new Date();
    const assignedName: string | undefined = data.staffAssignedName || data.staffAssigned || '';

    return {
      id: doc.id,
      ticketNo: `GDC-${data.ticket || ''}`,
      createdBy: {
        uid: user?.uid || '',
        name: data.userName || '',
        employeeNo: data.employeeID || undefined,
        location: data.location || undefined,
      },
      assignedTo: assignedName ? { uid: '', name: assignedName } : null,
      category,
      status,
      details: data.remarks || '',
      remarks: data.remarks ? [data.remarks] : [],
      createdAt,
      acknowledgedAt: data.acknowledgeTime && typeof data.acknowledgeTime.toDate === 'function' ? (data.acknowledgeTime as Timestamp).toDate() : undefined,
      resolvedAt: undefined,
    };
  };

  // Fetch tickets for logged-in user from Firestore
  useEffect(() => {
    if (!user || !user.employeeNo) return;
    setTicketsLoading(true);
    const db = getFirestore(app);
    const ticketsRef = collection(db, 'tickets');
    const qEmp = query(ticketsRef, where('employeeID', '==', user.employeeNo));

    const unsub = onSnapshot(qEmp, (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToTicket(d))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTickets(items);
      setTicketsLoading(false);
    }, (err) => {
      console.error('Failed to fetch tickets by employeeID:', err);
      setTicketsLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employeeNo]);

  // Tickets already filtered by current user via Firestore query
  const userTickets = tickets;

  const filteredTickets = userTickets.filter(ticket => {
    const matchesStatus = activeTab === 'all' || ticket.status === activeTab;
    const matchesSearch = searchTerm === "" || 
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusCounts = () => {
    return {
      all: userTickets.length,
      pending: userTickets.filter(t => t.status === 'pending').length,
      ongoing: userTickets.filter(t => t.status === 'ongoing').length,
      resolved: userTickets.filter(t => t.status === 'resolved').length,
    };
  };

  const statusCounts = getStatusCounts();

  const tabs = [
    { key: 'all' as const, label: 'All Tickets', count: statusCounts.all },
    { key: 'pending' as const, label: 'Pending', count: statusCounts.pending },
    { key: 'ongoing' as const, label: 'In Progress', count: statusCounts.ongoing },
    { key: 'resolved' as const, label: 'Resolved', count: statusCounts.resolved },
  ];

  const getTabColor = (status: TicketStatus | 'all') => {
    switch (status) {
      case 'pending':
        return 'bg-warning-light text-warning border-warning/20';
      case 'ongoing':
        return 'bg-primary-light text-primary border-primary/20';
      case 'resolved':
        return 'bg-success-light text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading || !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="gdc-card">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Preparing your tickets...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground">
            Track the status of your submitted tickets
          </p>
        </div>
        <Link to="/app/new-ticket">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="inline-block"
          >
            <Badge
              variant={activeTab === tab.key ? 'default' : 'outline'}
              className={activeTab === tab.key ? getTabColor(tab.key) : 'cursor-pointer hover:bg-muted'}
            >
              {tab.label} ({tab.count})
            </Badge>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {userTickets.length === 0 ? "No tickets yet" : "No tickets found"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {userTickets.length === 0 
              ? "You haven't created any tickets yet. Click the button below to get started."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          <Link to="/app/new-ticket">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}