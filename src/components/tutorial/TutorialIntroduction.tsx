import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Database,
  Layers,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

const TutorialIntroduction = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Context-Aware Embeddable Chat System
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          A comprehensive tutorial for setting up and using the embeddable AI
          chat widget
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About This Tutorial</CardTitle>
          <CardDescription>
            Learn how to set up, configure, and use all features of the
            embeddable chat system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This tutorial will guide you through the entire process of setting
            up and using the Context-Aware Embeddable Chat System. You'll learn
            how to configure the environment, understand the architecture, and
            use all the features available in the application.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <Layers className="h-5 w-5 mr-2 text-primary" />
                System Architecture
              </h3>
              <p className="text-sm text-muted-foreground">
                Understand the core components and how they interact with each
                other
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <Database className="h-5 w-5 mr-2 text-primary" />
                Database Setup
              </h3>
              <p className="text-sm text-muted-foreground">
                Learn about the Supabase tables, functions, and security
                policies
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Chat Widget
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure and customize the embeddable chat widget
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Admin Dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage context rules, prompt templates, and system settings
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-primary" />
                User Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Handle user accounts, roles, and permissions
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium flex items-center mb-2">
                <Code className="h-5 w-5 mr-2 text-primary" />
                Embedding Options
              </h3>
              <p className="text-sm text-muted-foreground">
                Learn different ways to embed the chat widget in your website
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="setup">Initial Setup</TabsTrigger>
          <TabsTrigger value="features">Core Features</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Essential steps to set up your development environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="pl-2">
                  <span className="font-medium">Clone the repository</span>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Start by cloning the project repository from GitHub
                  </p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">Install dependencies</span>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Run{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      npm install
                    </code>{" "}
                    to install all required packages
                  </p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">
                    Set up environment variables
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Configure your Supabase credentials and other environment
                    variables
                  </p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">
                    Start the development server
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Run{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      npm run dev:all
                    </code>{" "}
                    to start both the frontend and WebSocket server
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Features</CardTitle>
              <CardDescription>
                Key functionalities of the embeddable chat system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Real-time Chat</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    WebSocket-based messaging system for instant communication
                  </p>
                  <Button variant="link" size="sm" className="px-0">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Context Rules</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Define business domain limitations for AI responses
                  </p>
                  <Button variant="link" size="sm" className="px-0">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Prompt Templates</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create reusable templates for common AI interactions
                  </p>
                  <Button variant="link" size="sm" className="px-0">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Widget Customization</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Customize appearance and behavior of the chat widget
                  </p>
                  <Button variant="link" size="sm" className="px-0">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Topics</CardTitle>
              <CardDescription>
                In-depth guides for advanced functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    Custom AI Model Integration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to integrate custom AI models from Hugging Face or
                    other providers
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    Knowledge Base Management
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Set up and manage knowledge bases for more accurate AI
                    responses
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Analytics & Reporting</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand user interactions and AI performance metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorialIntroduction;
