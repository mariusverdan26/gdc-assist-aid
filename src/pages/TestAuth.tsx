import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function TestAuth() {
  const { user, loading, isAuthenticated, isAdmin, isEmployee, signOut } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading authentication state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>
            This page shows the current authentication state and user information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span>Authenticated:</span>
                  <Badge variant={isAuthenticated ? "default" : "secondary"}>
                    {isAuthenticated ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Role:</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {isAdmin ? "Admin" : isEmployee ? "Employee" : "None"}
                  </Badge>
                </div>
              </div>
            </div>

            {user && (
              <div>
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Employee No:</strong> {user.employeeNo || 'N/A'}</p>
                  <p><strong>Location:</strong> {user.location || 'N/A'}</p>
                  <p><strong>UID:</strong> {user.uid}</p>
                  <p><strong>Created:</strong> {user.createdAt.toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {user.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="pt-4 border-t">
              <Button onClick={signOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firestore Authentication</CardTitle>
          <CardDescription>
            This authentication system uses Firestore to validate user credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>User enters username (employeeID) and password</li>
              <li>System queries Firestore 'users' collection</li>
              <li>Matches employeeID and password fields</li>
              <li>If found, creates user session and stores in localStorage</li>
              <li>Session persists until user signs out or clears browser data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
