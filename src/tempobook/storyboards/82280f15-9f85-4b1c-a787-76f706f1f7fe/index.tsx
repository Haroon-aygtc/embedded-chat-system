import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Sidebar from "@/components/admin/Sidebar";
import DashboardHeader from "@/components/admin/DashboardHeader";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import WidgetConfigurator from "@/components/admin/WidgetConfigurator";
import ContextRulesEditor from "@/components/admin/ContextRulesEditor";
import PromptTemplates from "@/components/admin/PromptTemplates";
import EmbedCodeGenerator from "@/components/admin/EmbedCodeGenerator";

// This is a demo version of the admin dashboard for the storyboard
const AdminDashboardDemo = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="widget">Widget</TabsTrigger>
              <TabsTrigger value="context">Context Rules</TabsTrigger>
              <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="widget">
              <WidgetConfigurator />
            </TabsContent>

            <TabsContent value="context">
              <ContextRulesEditor />
            </TabsContent>

            <TabsContent value="prompts">
              <PromptTemplates />
            </TabsContent>

            <TabsContent value="embed">
              <EmbedCodeGenerator />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Settings content will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardDemo;
