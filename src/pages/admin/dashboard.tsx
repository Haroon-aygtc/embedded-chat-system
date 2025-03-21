import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  Code,
  BarChart3,
  FileText,
  Database,
  BookOpen,
  History,
} from "lucide-react";

import WidgetConfigurator from "@/components/admin/WidgetConfigurator";
import ContextRulesEditor from "@/components/admin/ContextRulesEditor";
import PromptTemplates from "@/components/admin/PromptTemplates";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import EmbedCodeGenerator from "@/components/admin/EmbedCodeGenerator";
import KnowledgeBaseManager from "@/components/admin/KnowledgeBaseManager";
import AIInteractionLogs from "@/components/admin/AIInteractionLogs";
import SystemSettings from "@/components/admin/SystemSettings";
import UserManagement from "@/components/admin/UserManagement";
import { useAdmin } from "@/context/AdminContext";

const Dashboard = () => {
  const { activeSection, setActiveSection } = useAdmin();

  return (
    <div className="w-full">
      <Tabs
        value={activeSection}
        onValueChange={setActiveSection}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Widget Config</span>
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Context Rules</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={activeSection === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("overview")}
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeSection === "widget" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("widget")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Widget Config
          </Button>
          <Button
            variant={activeSection === "context" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("context")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Context Rules
          </Button>
          <Button
            variant={activeSection === "templates" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("templates")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Templates
          </Button>
          <Button
            variant={activeSection === "knowledge" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("knowledge")}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Knowledge Base
          </Button>
          <Button
            variant={activeSection === "embed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("embed")}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            Embed Code
          </Button>
          <Button
            variant={activeSection === "logs" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("logs")}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            AI Logs
          </Button>
          <Button
            variant={activeSection === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("analytics")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={activeSection === "settings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant={activeSection === "users" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("users")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Users
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.7%</div>
                <p className="text-xs text-muted-foreground">
                  +0.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground">
                  -0.3s from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveSection("widget")}
                >
                  <Settings className="h-6 w-6" />
                  Configure Widget
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveSection("context")}
                >
                  <MessageSquare className="h-6 w-6" />
                  Edit Context Rules
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveSection("embed")}
                >
                  <Code className="h-6 w-6" />
                  Get Embed Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Status</span>
                  <span className="text-sm font-medium text-green-600">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gemini API</span>
                  <span className="text-sm font-medium text-green-600">
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hugging Face API</span>
                  <span className="text-sm font-medium text-green-600">
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <span className="text-sm font-medium text-green-600">
                    Healthy
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widget">
          <WidgetConfigurator />
        </TabsContent>

        <TabsContent value="context">
          <ContextRulesEditor />
        </TabsContent>

        <TabsContent value="templates">
          <PromptTemplates />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBaseManager />
        </TabsContent>

        <TabsContent value="embed">
          <EmbedCodeGenerator />
        </TabsContent>

        <TabsContent value="logs">
          <AIInteractionLogs />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
