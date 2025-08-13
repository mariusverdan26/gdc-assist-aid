import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  ArrowRight,
  Wifi,
  Monitor,
  Code,
  Database
} from "lucide-react";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface TicketCardProps {
  ticket: Ticket;
  className?: string;
}

const categoryIcons = {
  internet: Wifi,
  hardware: Monitor,
  software: Code,
  erp: Database,
};

const categoryColors = {
  internet: "bg-blue-100 text-blue-800 border-blue-200",
  hardware: "bg-green-100 text-green-800 border-green-200",
  software: "bg-purple-100 text-purple-800 border-purple-200",
  erp: "bg-orange-100 text-orange-800 border-orange-200",
};

export function TicketCard({ ticket, className }: TicketCardProps) {
  const CategoryIcon = categoryIcons[ticket.category];
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className={cn("gdc-card hover:shadow-gdc-md transition-all duration-200 group", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-card-foreground">
                {ticket.ticketNo}
              </h3>
              <StatusBadge status={ticket.status} size="sm" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", categoryColors[ticket.category])}
              >
                <CategoryIcon className="w-3 h-3 mr-1" />
                {ticket.category.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Link to={`/app/tickets/${ticket.id}`}>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.details}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{ticket.createdBy.name}</span>
            </div>
            {ticket.createdBy.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{ticket.createdBy.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatTimeAgo(ticket.createdAt)}</span>
          </div>
        </div>

        {ticket.assignedTo && (
          <div className="flex items-center space-x-2 pt-2 border-t border-border">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-avatar.jpg" alt={ticket.assignedTo.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(ticket.assignedTo.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Assigned to {ticket.assignedTo.name}
            </span>
          </div>
        )}

        {ticket.status === 'ongoing' && (
          <div className="flex items-center space-x-1 text-xs text-primary">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}