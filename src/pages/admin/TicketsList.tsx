import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Eye } from "lucide-react";
import { mockTickets } from "@/lib/mock-data";
import { TicketStatus } from "@/types";

export default function TicketsList() {
  const { status } = useParams<{ status: TicketStatus }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter tickets based on status from URL params
  const filteredTickets = mockTickets.filter(ticket => {
    const matchesStatus = status ? ticket.status === status : true;
    const matchesSearch = searchTerm === "" || 
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    
    return matchesStatus && matchesSearch && matchesCategory;
  });

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

  const getStatusColor = (status: TicketStatus) => {
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
          <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            Manage and track ticket resolution progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link to="/app/new-ticket">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        <Link to="/app/tickets/pending">
          <Badge 
            variant={status === 'pending' ? 'default' : 'outline'}
            className={status === 'pending' ? getStatusColor('pending') : ''}
          >
            Pending ({mockTickets.filter(t => t.status === 'pending').length})
          </Badge>
        </Link>
        <Link to="/app/tickets/ongoing">
          <Badge 
            variant={status === 'ongoing' ? 'default' : 'outline'}
            className={status === 'ongoing' ? getStatusColor('ongoing') : ''}
          >
            Ongoing ({mockTickets.filter(t => t.status === 'ongoing').length})
          </Badge>
        </Link>
        <Link to="/app/tickets/resolved">
          <Badge 
            variant={status === 'resolved' ? 'default' : 'outline'}
            className={status === 'resolved' ? getStatusColor('resolved') : ''}
          >
            Resolved ({mockTickets.filter(t => t.status === 'resolved').length})
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

      {/* Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
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