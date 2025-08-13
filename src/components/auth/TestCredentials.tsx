import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockUsers } from '@/lib/mock-users';

export const TestCredentials = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Test Accounts</CardTitle>
        <CardDescription>
          Use these credentials to test the application in development mode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockUsers.map((user) => (
            <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{user.displayName}</span>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Password:</strong> {user.password}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These are mock accounts for development only. 
            In production, you would use real Firebase authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
