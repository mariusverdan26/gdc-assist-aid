import { useState } from "react";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { mockTickets, getCurrentUser } from "@/lib/mock-data";
import { TicketStatus } from "@/types";

export default function MyTickets() {
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const currentUser = getCurrentUser();

  // Filter tickets created by current user
  const userTickets = mockTickets.filter(ticket => ticket.createdBy.uid === currentUser.uid);

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