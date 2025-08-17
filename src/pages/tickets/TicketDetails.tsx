import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import app from "@/lib/firebase";
import {
  getFirestore,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronLeft, Clock, MapPin, User, Loader2, Star } from "lucide-react";
import { Ticket, TicketStatus } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collection, getDocs, query, where } from "firebase/firestore";

const mapIssueToCategory = (issue: string): Ticket["category"] => {
  if (issue?.toLowerCase().startsWith("hardware")) return "hardware";
  if (issue?.toLowerCase().startsWith("internet")) return "internet";
  if (issue?.toLowerCase().startsWith("software")) return "software";
  return "erp";
};

const formatDateTime = (value?: Date) => {
  if (!value) return "N/A";
  return value.toLocaleString();
};

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const { user, isAdmin } = useUser();
  const { toast } = useToast();
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [admins, setAdmins] = useState<
    Array<{ id: string; name: string; email?: string }>
  >([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Rating state for employees
  const [rating, setRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Load rating if exists (for employee)
  useEffect(() => {
    if (!id || isAdmin) return;
    (async () => {
      const db = getFirestore(app);
      const ref = doc(db, "tickets", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.rating === "number") setRating(data.rating);
      }
    })();
  }, [id, isAdmin]);

  const handleSetRating = async (value: number) => {
    if (!id || isAdmin) return;
    setSubmittingRating(true);
    try {
      const db = getFirestore(app);
      const ref = doc(db, "tickets", id);
      await updateDoc(ref, { rating: value });
      setRating(value);
      toast({ title: "Thank you for your feedback!" });
    } catch (e) {
      toast({
        title: "Failed to submit rating",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const db = getFirestore(app);
    const ref = doc(db, "tickets", id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setTicket(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        const issue: string = data.issue || "";
        const statusTitle: string = data.status || "Pending";
        const status: TicketStatus = statusTitle.toLowerCase() as TicketStatus;
        const createdAt: Date =
          data.timestamp && typeof data.timestamp.toDate === "function"
            ? (data.timestamp as Timestamp).toDate()
            : new Date();
        const acknowledgedAt: Date | undefined =
          data.acknowledgeTime &&
          typeof data.acknowledgeTime.toDate === "function"
            ? (data.acknowledgeTime as Timestamp).toDate()
            : undefined;
        const resolvedAt: Date | undefined =
          data.timeResolved && typeof data.timeResolved.toDate === "function"
            ? (data.timeResolved as Timestamp).toDate()
            : undefined;
        const rating: number | undefined = typeof data.rating === "number" ? data.rating : undefined;
        const mapped: Ticket = {
          id: snap.id,
          ticketNo: `GDC-${data.ticket || ""}`,
          createdBy: {
            uid: data.createdBy?.uid || "",
            name: data.userName || "",
            employeeNo: data.employeeID || undefined,
            location: data.location || undefined,
          },
          assignedTo: data.staffAssignedName
            ? { uid: "", name: data.staffAssignedName }
            : null,
          category: mapIssueToCategory(issue),
          status,
          details: data.remarks || "",
          remarks: data.remarks ? [data.remarks] : [],
          createdAt,
          acknowledgedAt,
          resolvedAt,
          rating,
        };
        setAcknowledged(Boolean(data.acknowledged));
        setTicket(mapped);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [id]);

  const meta: Array<{ label: string; value?: string; type?: "status" }> | null =
    useMemo(() => {
      if (!ticket) return null;
      return [
        { label: "Ticket No", value: ticket.ticketNo },
        { label: "Status", type: "status" },
        { label: "Category", value: ticket.category.toUpperCase() },
        { label: "Created", value: formatDateTime(ticket.createdAt) },
        { label: "Acknowledged", value: formatDateTime(ticket.acknowledgedAt) },
        { label: "Resolved", value: formatDateTime(ticket.resolvedAt) },
      ];
    }, [ticket]);

  const canAcknowledge =
    isAdmin && ticket && ticket.status === "pending" && !acknowledged;
  const canResolve =
    isAdmin && ticket && acknowledged && ticket.status !== "resolved";

  const handleAcknowledge = async () => {
    if (!id || !user) return;
    try {
      setUpdating(true);
      const db = getFirestore(app);
      const ref = doc(db, "tickets", id);
      await updateDoc(ref, {
        status: "Ongoing",
        acknowledged: true,
        acknowledgeTime: serverTimestamp(),
        staffAssigned: user.name,
        staffAssignedName: user.name,
      });
      toast({
        title: "Ticket acknowledged",
        description: "Status updated to Ongoing.",
      });
    } catch (err) {
      toast({
        title: "Failed to acknowledge",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!id || !user) return;
    try {
      setUpdating(true);
      const db = getFirestore(app);
      const ref = doc(db, "tickets", id);
      // Fetch the current ticket to get acknowledgeTime/timestamp
      const ticketSnap = await getDoc(ref);
      let ackTime = null;
      let createdTime = null;
      if (ticketSnap.exists()) {
        const data = ticketSnap.data();
        ackTime = data.acknowledgeTime || null;
        createdTime = data.timestamp || null;
      }
      await updateDoc(ref, {
        status: "Resolved",
        resolved: true,
        timeResolved: ackTime || createdTime || serverTimestamp(),
      });
      toast({
        title: "Ticket resolved",
        description: "Status updated to Resolved.",
      });
    } catch (err) {
      toast({
        title: "Failed to resolve",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const openReassign = async () => {
    setIsReassignOpen(true);
    try {
      setLoadingAdmins(true);
      const db = getFirestore(app);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "admin"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || (data.email?.split("@")[0] ?? "Unknown"),
          email: data.email,
        };
      });
      setAdmins(list);
    } catch (e) {
      toast({
        title: "Failed to load admins",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleReassignTo = async (admin: {
    id: string;
    name: string;
    email?: string;
  }) => {
    if (!id) return;
    try {
      setUpdating(true);
      const db = getFirestore(app);
      const ref = doc(db, "tickets", id);
      await updateDoc(ref, {
        staffAssigned: admin.name,
        staffAssignedName: admin.name,
      });
      toast({
        title: "Ticket reassigned",
        description: `Assigned to ${admin.name}.`,
      });
      setIsReassignOpen(false);
    } catch (e) {
      toast({
        title: "Failed to reassign",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="gdc-card">
          <CardHeader>
            <CardTitle>Loading ticket...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch the ticket details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="gdc-card">
          <CardHeader>
            <CardTitle>Ticket not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/app/tickets/all">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ticket Details</h1>
          <p className="text-muted-foreground">
            Full information for {ticket.ticketNo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAcknowledge && (
            <Button onClick={handleAcknowledge} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Acknowledge Ticket
            </Button>
          )}
          {canResolve && (
            <>
              <Button onClick={handleResolve} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                onClick={openReassign}
                disabled={updating}
              >
                Reassign Ticket
              </Button>
            </>
          )}
          <Link to="/app/tickets/all">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>
        </div>
      </div>

      <Card className="gdc-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{ticket.ticketNo}</span>
            <StatusBadge status={ticket.status} />
            <Badge variant="outline">{ticket.category.toUpperCase()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meta?.map((m, idx) => {
              if (m.label === "Resolved") {
                return [
                  <div key={m.label} className="text-sm">
                    <div className="text-muted-foreground">{m.label}</div>
                    <div className="font-medium">
                      {m.type === "status" ? (
                        <StatusBadge status={ticket.status} />
                      ) : (
                        m.value
                      )}
                    </div>
                  </div>,
                  // Show rating UI for employee, read-only stars for admin
                  user && ticket.status === "resolved" ? (
                    isAdmin ? (
                      ticket.rating > 0 && (
                        <div className="mt-2" key="rating-ui">
                          <div className="text-sm text-muted-foreground mb-1">
                            Rate your experience:
                          </div>
                          <div
                            className="mt-2 flex items-center gap-1"
                            key="admin-rating-ui"
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-7 h-7 ${
                                  star <= ticket.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill={star <= ticket.rating ? "#facc15" : "none"}
                              />
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({ticket.rating} star{ticket.rating > 1 ? "s" : ""})
                            </span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="mt-2" key="rating-ui">
                        <div className="text-sm text-muted-foreground mb-1">
                          Rate your experience:
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="focus:outline-none"
                              disabled={submittingRating}
                              onClick={() => handleSetRating(star)}
                              aria-label={`Rate ${star} star${
                                star > 1 ? "s" : ""
                              }`}
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill={star <= rating ? "#facc15" : "none"}
                              />
                            </button>
                          ))}
                          {submittingRating && (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {rating > 0 && (
                          <div className="text-xs text-green-700 mt-1">
                            You rated this ticket {rating} star
                            {rating > 1 ? "s" : ""}.
                          </div>
                        )}
                      </div>
                    )
                  ) : null,
                ];
              }
              return (
                <div key={m.label} className="text-sm">
                  <div className="text-muted-foreground">{m.label}</div>
                  <div className="font-medium">
                    {m.type === "status" ? (
                      <StatusBadge status={ticket.status} />
                    ) : (
                      m.value
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Reported By</div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{ticket.createdBy.name}</span>
              </div>
              {ticket.createdBy.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{ticket.createdBy.location}</span>
                </div>
              )}
            </div>
          </div>

          {ticket.assignedTo && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Assigned To</div>
              <div className="text-sm font-medium">
                {ticket.assignedTo.name}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Problem Description
            </div>
            <div className="text-sm">{ticket.details}</div>
          </div>
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Ticket</DialogTitle>
            <DialogDescription>
              Select an admin to assign this ticket to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {loadingAdmins ? (
              <div className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
                admins...
              </div>
            ) : (
              admins.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between border rounded-md p-2"
                >
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    {a.email ? (
                      <div className="text-xs text-muted-foreground">
                        {a.email}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReassignTo(a)}
                    disabled={updating}
                  >
                    Assign
                  </Button>
                </div>
              ))
            )}
            {!loadingAdmins && admins.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No admin users found.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
