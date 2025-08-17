import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Checkbox } from "@/components/ui/checkbox";
import { getFirestore, collection, onSnapshot, Timestamp, QueryDocumentSnapshot, DocumentData, deleteDoc, doc as firestoreDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Eye } from "lucide-react";
import { Ticket, TicketStatus } from "@/types";

import app from "@/lib/firebase";

// Export filtered tickets to CSV
function exportTicketsToCSV(filteredTickets: Ticket[]) {
  if (filteredTickets.length === 0) return;
  const headers = [
    'Ticket No', 'Status', 'Category', 'Created By', 'Location', 'Assigned To', 'Created At', 'Details'
  ];
  const rows = filteredTickets.map(ticket => [
    ticket.ticketNo,
    ticket.status,
    ticket.category,
    ticket.createdBy.name,
    ticket.createdBy.location || '',
    ticket.assignedTo?.name || '',
    ticket.createdAt.toLocaleString(),
    ticket.details.replace(/\n/g, ' ')
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tickets.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function TicketsList() {
  const { status } = useParams<{ status?: TicketStatus | 'all' }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const mapDocToTicket = (doc: QueryDocumentSnapshot<DocumentData>): Ticket => {
    const data = doc.data() as any;
    const issue: string = data.issue || '';
    const statusTitle: string = data.status || 'Pending';
    const category = issue.startsWith('Hardware') ? 'hardware'
      : issue.startsWith('Internet') ? 'internet'
      : issue.startsWith('Software') ? 'software'
      : 'erp';
    const mappedStatus: TicketStatus = statusTitle.toLowerCase() as TicketStatus;
    const createdAt: Date = (data.timestamp && typeof data.timestamp.toDate === 'function')
      ? (data.timestamp as Timestamp).toDate()
      : new Date();
    const acknowledgedAt: Date | undefined = (data.acknowledgeTime && typeof data.acknowledgeTime.toDate === 'function')
      ? (data.acknowledgeTime as Timestamp).toDate()
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
      status: mappedStatus,
      details: data.remarks || '',
      remarks: data.remarks ? [data.remarks] : [],
      createdAt,
      acknowledgedAt,
      resolvedAt: undefined,
    };
  };

  useEffect(() => {
    const db = getFirestore(app);
    const ref = collection(db, 'tickets');
    const unsub = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToTicket(d))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTickets(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // Filter tickets based on status from URL params
  const filteredTickets = tickets.filter(ticket => {
    // Only filter by status if status is 'pending', 'ongoing', or 'resolved'
    const validStatuses = ['pending', 'ongoing', 'resolved'];
    const matchesStatus = status && validStatuses.includes(status)
      ? ticket.status === status
      : true;
    const matchesSearch = searchTerm === "" || 
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesStatus && matchesSearch && matchesCategory;
  });

  // Batch select logic (must be after filteredTickets is defined)
  const allPendingSelected = filteredTickets.length > 0 && filteredTickets.every(t => t.status === 'pending' && selectedTickets.includes(t.id));
  const isPendingView = status === 'pending';
  const handleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedTickets(selectedTickets.filter(id => !filteredTickets.some(t => t.id === id && t.status === 'pending')));
    } else {
      setSelectedTickets([
        ...selectedTickets,
        ...filteredTickets.filter(t => t.status === 'pending' && !selectedTickets.includes(t.id)).map(t => t.id)
      ]);
    }
  };
  const handleSelectTicket = (id: string) => {
    setSelectedTickets(selectedTickets =>
      selectedTickets.includes(id)
        ? selectedTickets.filter(tid => tid !== id)
        : [...selectedTickets, id]
    );
  };
  const handleBatchDelete = async () => {
    const db = getFirestore(app);
    await Promise.all(selectedTickets.map(id => deleteDoc(firestoreDoc(db, 'tickets', id))));
    setSelectedTickets([]);
  };

  const getPageTitle = () => {
    switch (status) {
      case 'pending':
        return 'Pending Tickets';
      case 'ongoing':
        return 'Ongoing Tickets';
      case 'resolved':
        return 'Resolved Tickets';
      default:
        return 'All Tickets';
    }
  };

  const getStatusColor = (status: TicketStatus | 'all') => {
    switch (status) {
      case 'pending':
        return 'bg-warning-light text-warning border-warning/20';
      case 'ongoing':
        return 'bg-primary-light text-primary border-primary/20';
      case 'resolved':
        return 'bg-success-light text-success border-success/20';
      case 'all':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            Manage and track ticket resolution progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportTicketsToCSV(filteredTickets)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        <Link to="/app/tickets/all">
          <Badge
            variant={(typeof status === 'string' && status === 'all') || !status ? 'default' : 'outline'}
            className={(typeof status === 'string' && status === 'all') || !status ? getStatusColor('all') : ''}
          >
            All ({tickets.length})
          </Badge>
        </Link>
        <Link to="/app/tickets/pending">
          <Badge 
            variant={status === 'pending' ? 'default' : 'outline'}
            className={status === 'pending' ? getStatusColor('pending') : ''}
          >
            Pending ({tickets.filter(t => t.status === 'pending').length})
          </Badge>
        </Link>
        <Link to="/app/tickets/ongoing">
          <Badge 
            variant={status === 'ongoing' ? 'default' : 'outline'}
            className={status === 'ongoing' ? getStatusColor('ongoing') : ''}
          >
            Ongoing ({tickets.filter(t => t.status === 'ongoing').length})
          </Badge>
        </Link>
        <Link to="/app/tickets/resolved">
          <Badge 
            variant={status === 'resolved' ? 'default' : 'outline'}
            className={status === 'resolved' ? getStatusColor('resolved') : ''}
          >
            Resolved ({tickets.filter(t => t.status === 'resolved').length})
          </Badge>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by number, description, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="internet">Internet</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="software">Software</SelectItem>
            <SelectItem value="erp">ERP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Batch actions and Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <>
          {isPendingView && (
            <div className="flex items-center mb-2 gap-4">
              <Checkbox checked={allPendingSelected} onCheckedChange={handleSelectAll} id="select-all-tickets" />
              <label htmlFor="select-all-tickets" className="text-sm select-none cursor-pointer">Select All</label>
              <Button variant="destructive" size="sm" disabled={selectedTickets.length === 0} onClick={handleBatchDelete}>
                Delete Selected ({selectedTickets.length})
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="relative">
                {isPendingView && (
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={() => handleSelectTicket(ticket.id)}
                    className="absolute top-2 left-2 z-10 bg-white border border-gray-300 shadow"
                  />
                )}
                <TicketCard ticket={ticket} className={isPendingView ? 'pl-8' : ''} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "No tickets match the current status filter."
            }
          </p>
          <Link to="/app/new-ticket">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Ticket
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}