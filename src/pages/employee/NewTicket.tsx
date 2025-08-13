import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/mock-data";

const ticketSchema = z.object({
  employeeNo: z.string().min(1, "Employee number is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  location: z.string().min(1, "Location is required"),
  category: z.enum(["internet", "hardware", "software", "erp"], {
    required_error: "Please select an issue category",
  }),
  details: z.string().min(10, "Please provide at least 10 characters describing the issue"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function NewTicket() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      employeeNo: currentUser.employeeNo || "",
      employeeName: currentUser.displayName,
      location: currentUser.location || "",
      category: undefined,
      details: "",
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate ticket number
      const ticketNo = `GDC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      
      toast({
        title: "Ticket Created Successfully!",
        description: `Your ticket ${ticketNo} has been submitted and is pending review.`,
      });

      // Reset form
      form.reset({
        employeeNo: currentUser.employeeNo || "",
        employeeName: currentUser.displayName,
        location: currentUser.location || "",
        category: undefined,
        details: "",
      });

    } catch (error) {
      toast({
        title: "Error Creating Ticket",
        description: "There was a problem submitting your ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryDescriptions = {
    internet: "Network connectivity, Wi-Fi, internet access issues",
    hardware: "Computer, printer, monitor, and other physical equipment problems",
    software: "Application errors, software installation, and compatibility issues",
    erp: "Enterprise Resource Planning system issues and errors",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Ticket</h1>
        <p className="text-muted-foreground">
          Report an issue and our IT team will assist you promptly
        </p>
      </div>

      <Card className="gdc-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Employee Details</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Number</FormLabel>
                        <FormControl>
                          <Input placeholder="GDC-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Building A - Floor 2" {...field} />
                      </FormControl>
                      <FormDescription>
                        Please specify your building and floor for faster assistance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Issue Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Issue Details</h3>
                <Separator />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of issue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internet">
                            <div className="flex flex-col items-start">
                              <span>Internet/Network</span>
                              <span className="text-xs text-muted-foreground">
                                {categoryDescriptions.internet}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hardware">
                            <div className="flex flex-col items-start">
                              <span>Hardware</span>
                              <span className="text-xs text-muted-foreground">
                                {categoryDescriptions.hardware}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="software">
                            <div className="flex flex-col items-start">
                              <span>Software</span>
                              <span className="text-xs text-muted-foreground">
                                {categoryDescriptions.software}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="erp">
                            <div className="flex flex-col items-start">
                              <span>ERP System</span>
                              <span className="text-xs text-muted-foreground">
                                {categoryDescriptions.erp}
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe the issue in detail. Include any error messages, steps you've already tried, and when the problem started..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The more details you provide, the faster we can resolve your issue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Optional Attachment */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Additional Information</h3>
                <Separator />
                
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Attach screenshots or files (optional)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" type="button">
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* SLA Notice */}
              <div className="bg-accent-light rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Service Level Agreement</p>
                    <p className="text-muted-foreground">
                      Your ticket will be acknowledged within 30 minutes and resolved within 8 hours during business hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}