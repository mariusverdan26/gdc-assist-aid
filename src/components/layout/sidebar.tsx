import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Ticket, 
  Plus, 
  FileText, 
  Users,
  Menu,
  X,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pending Tickets",
    href: "/app/tickets/pending",
    icon: Ticket,
  },
  {
    title: "Ongoing Tickets", 
    href: "/app/tickets/ongoing",
    icon: Ticket,
  },
  {
    title: "Resolved Tickets",
    href: "/app/tickets/resolved", 
    icon: Ticket,
  },
  {
    title: "Reports",
    href: "/app/reports",
    icon: BarChart3,
  },
];

const employeeNavItems = [
  {
    title: "My Tickets",
    href: "/app/my-tickets",
    icon: FileText,
  },
  {
    title: "New Ticket",
    href: "/app/new-ticket",
    icon: Plus,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  console.log(`sidebarUser: ${JSON.stringify(user,null,2)}`)
  const location = useLocation();
  const userRole = user?.role || 'employee';
  const navItems = userRole === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <div className={cn(
      "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-100"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center overflow-hidden">
              <img
                src="/images/gdc-logo.jpeg"
                alt="GDC Logo"
                className="object-cover w-8 h-8 rounded-full"
              />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Greenfield Development Corporation</h2>
              <p className="text-xs text-sidebar-foreground/70">Ticketing System</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">
            {userRole === 'admin' ? 'Administrator' : 'Employee'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon className={cn("h-4 w-4", isCollapsed ? "h-5 w-5" : "")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/70">
            <p>Version 1.0.0</p>
            <p className="mt-1">© 2024 GDC</p>
          </div>
        )}
      </div>
    </div>
  );
}