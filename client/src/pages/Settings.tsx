import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <Layout>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>
                Connect your GitHub account to track pull requests and deployments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">GitHub Connection</Label>
                  <CardDescription>
                    Link your GitHub account to enable PR tracking
                  </CardDescription>
                </div>
                <Button variant="outline" className="gap-2">
                  <i className="ri-github-fill"></i>
                  Connected
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-2">
                <Label className="text-base">Webhook URL</Label>
                <CardDescription className="mb-2">
                  Add this URL to your GitHub repository webhooks to receive real-time updates
                </CardDescription>
                <div className="flex gap-2">
                  <Input value="https://devsprint-planner.example.com/api/webhooks/github" readOnly />
                  <Button variant="secondary">Copy</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-pr-tracking" />
                  <Label htmlFor="auto-pr-tracking">Automatically link PRs to tasks by branch name</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="auto-status-update" />
                  <Label htmlFor="auto-status-update">Update task status when PR status changes</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Vercel Integration</CardTitle>
              <CardDescription>
                Connect Vercel to track deployment status of your tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Vercel Connection</Label>
                  <CardDescription>
                    Link your Vercel projects to track deployments
                  </CardDescription>
                </div>
                <Button variant="outline" className="gap-2">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-triangle"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /></svg>
                  Connect Vercel
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-2">
                <Label className="text-base">Deployment Webhook</Label>
                <CardDescription className="mb-2">
                  Add this URL to your Vercel project webhooks to receive deployment status updates
                </CardDescription>
                <div className="flex gap-2">
                  <Input value="https://devsprint-planner.example.com/api/webhooks/deployment" readOnly />
                  <Button variant="secondary">Copy</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-deployment-link" />
                  <Label htmlFor="auto-deployment-link">Automatically link deployments to tasks</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="deployment-notifications" />
                  <Label htmlFor="deployment-notifications">Notify when deployments complete</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Hackathon Settings</CardTitle>
              <CardDescription>
                Configure settings for hackathon mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-hackathon-summary" />
                  <Label htmlFor="auto-hackathon-summary">Auto-generate pitch summary at end of hackathon</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="hackathon-countdown" defaultChecked />
                  <Label htmlFor="hackathon-countdown">Show countdown timer in hackathon mode</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="hackathon-notifications" defaultChecked />
                  <Label htmlFor="hackathon-notifications">Send reminder notifications during hackathon</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
