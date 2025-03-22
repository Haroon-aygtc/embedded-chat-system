import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  BarChart3,
  Code,
  Database,
  FileText,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const AdminDashboardTutorial = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Admin Dashboard Tutorial
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Learn how to use the admin dashboard to manage your chat system
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="widget">Widget Config</TabsTrigger>
          <TabsTrigger value="context">Context Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard Overview</CardTitle>
              <CardDescription>
                Understanding the admin dashboard layout and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  The admin dashboard is the central control panel for managing
                  your chat system. It provides tools for configuring the chat
                  widget, defining context rules, creating prompt templates,
                  monitoring analytics, and managing users.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Settings className="h-5 w-5 mr-2 text-primary" />
                      Widget Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Customize the appearance and behavior of the chat widget
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                      Context Rules
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Define business domain limitations for AI responses
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      Prompt Templates
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create reusable templates for common AI interactions
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Database className="h-5 w-5 mr-2 text-primary" />
                      Knowledge Base
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage knowledge sources for more accurate AI responses
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Code className="h-5 w-5 mr-2 text-primary" />
                      Embed Code
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generate code to embed the chat widget in your website
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Analytics
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View usage statistics and performance metrics
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      User Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage user accounts, roles, and permissions
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      System Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure global system settings and security options
                    </p>
                  </div>
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Admin Access</AlertTitle>
                  <AlertDescription>
                    The admin dashboard is only accessible to users with the
                    "admin" role. Make sure you have the appropriate permissions
                    before attempting to access it.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Configuration</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the chat widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  The Widget Configurator allows you to customize the appearance
                  and behavior of the chat widget without writing any code.
                  Changes made here will be applied to all instances of the
                  widget across your website.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Available Settings</h3>

                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Setting</th>
                          <th className="px-4 py-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Primary Color
                          </td>
                          <td className="px-4 py-2">
                            The main color used for the widget header, buttons,
                            and user messages
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Position</td>
                          <td className="px-4 py-2">
                            Where the widget appears on the page (bottom-right,
                            bottom-left, top-right, top-left)
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Chat Icon Size
                          </td>
                          <td className="px-4 py-2">
                            The size of the chat icon in the minimized state
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Initial State
                          </td>
                          <td className="px-4 py-2">
                            Whether the widget starts minimized or expanded
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Welcome Message
                          </td>
                          <td className="px-4 py-2">
                            The initial message displayed when the widget is
                            first opened
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Widget Title
                          </td>
                          <td className="px-4 py-2">
                            The text displayed in the widget header
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Placeholder Text
                          </td>
                          <td className="px-4 py-2">
                            The text displayed in the input field when empty
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Advanced Settings</h3>

                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Setting</th>
                          <th className="px-4 py-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Auto-Open Delay
                          </td>
                          <td className="px-4 py-2">
                            Time in seconds before the widget automatically
                            opens (0 to disable)
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Session Timeout
                          </td>
                          <td className="px-4 py-2">
                            Time in minutes before the chat session expires due
                            to inactivity
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Max File Upload Size
                          </td>
                          <td className="px-4 py-2">
                            Maximum size in MB for file attachments (0 to
                            disable uploads)
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Allowed File Types
                          </td>
                          <td className="px-4 py-2">
                            File extensions that can be uploaded (e.g., .pdf,
                            .jpg, .png)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Real-time Updates</AlertTitle>
                  <AlertDescription>
                    Changes made in the Widget Configurator are applied in
                    real-time to all instances of the widget. There's no need to
                    redeploy your website or update the embed code.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Context Rules</CardTitle>
              <CardDescription>
                Define business domain limitations for AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  Context Rules allow you to define the boundaries and
                  limitations for AI responses. They help ensure that the AI
                  stays on-topic and provides information that is relevant to
                  your business domain.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    What are Context Rules?
                  </h3>
                  <p>
                    Context Rules are sets of instructions and constraints that
                    guide the AI's responses. They can include:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Topics the AI should focus on</li>
                    <li>Topics the AI should avoid</li>
                    <li>Specific terminology to use</li>
                    <li>Tone and style guidelines</li>
                    <li>Response length limitations</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Creating a Context Rule
                  </h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <span className="font-medium">
                        Navigate to the Context Rules section
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Click on "Context Rules" in the admin dashboard sidebar
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Click "Add New Rule"</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        This will open the rule creation form
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Fill in the rule details
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Provide a name, description, and the actual rule content
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Set the priority</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Higher priority rules take precedence when multiple
                        rules apply
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Save the rule</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        The rule will be applied to all future AI responses
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Example Context Rule</h3>
                  <div className="bg-muted rounded-md p-4">
                    <p className="font-medium mb-2">
                      E-commerce Product Support
                    </p>
                    <p className="text-sm mb-4">
                      This rule guides the AI to provide helpful responses about
                      our e-commerce products and services.
                    </p>
                    <div className="text-sm">
                      <p className="mb-2">Rule Content:</p>
                      <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
                        {`You are a helpful assistant for our e-commerce store that sells electronics.

DO:
- Provide information about our products (smartphones, laptops, tablets, accessories)
- Help with order status, shipping, and returns
- Suggest products based on customer needs
- Explain our warranty and support policies

DON'T:
- Provide information about competitors' products
- Discuss pricing beyond what's listed on our website
- Make promises about delivery times
- Share customer data or order details without verification

When asked about products we don't sell, politely explain that we specialize in electronics and redirect to our product categories.`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Testing Context Rules</AlertTitle>
                  <AlertDescription>
                    Always test your context rules before deploying them to
                    ensure they work as expected. The Context Rules Editor
                    includes a testing tool where you can see how the AI
                    responds with your rules applied.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Templates</CardTitle>
              <CardDescription>
                Create reusable templates for common AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  Prompt Templates allow you to create predefined structures for
                  AI prompts. They help ensure consistency in AI responses and
                  make it easier to handle common types of interactions.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    What are Prompt Templates?
                  </h3>
                  <p>
                    Prompt Templates are predefined structures that guide how
                    the AI generates responses for specific types of queries.
                    They can include variables that are filled in at runtime
                    based on the user's input or other context.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Creating a Prompt Template
                  </h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <span className="font-medium">
                        Navigate to the Prompt Templates section
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Click on "Templates" in the admin dashboard sidebar
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Click "Add New Template"
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        This will open the template creation form
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Fill in the template details
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Provide a name, description, and the template content
                        with variables
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Define variables</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Specify any variables that will be replaced at runtime
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Save the template</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        The template will be available for use in AI
                        interactions
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Example Prompt Template
                  </h3>
                  <div className="bg-muted rounded-md p-4">
                    <p className="font-medium mb-2">
                      Product Recommendation Template
                    </p>
                    <p className="text-sm mb-4">
                      This template helps the AI provide personalized product
                      recommendations.
                    </p>
                    <div className="text-sm">
                      <p className="mb-2">Template Content:</p>
                      <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
                        {`The user is looking for a {{product_category}} with the following requirements:

Budget: {{budget}}
Key features: {{features}}
Use case: {{use_case}}

Based on these requirements, recommend 2-3 specific products from our catalog that would be a good fit. For each product, provide:
1. Product name and model
2. Why it's a good match for their needs
3. Key specifications
4. Price point

End with a question asking if they'd like more details about any of the recommended products.`}
                      </pre>
                    </div>
                    <p className="text-sm mt-4 font-medium">Variables:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>product_category (e.g., laptop, smartphone)</li>
                      <li>budget (e.g., $500-$800)</li>
                      <li>features (e.g., long battery life, good camera)</li>
                      <li>use_case (e.g., gaming, business, everyday use)</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Template Variables</AlertTitle>
                  <AlertDescription>
                    Variables in templates are enclosed in double curly braces
                    (e.g., &quot;{{ variable_name }}&quot;). At runtime, these
                    variables are replaced with actual values based on the
                    user's input or other context.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  The User Management section allows you to create, edit, and
                  delete user accounts. You can also assign roles and
                  permissions to control access to different parts of the
                  system.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">User Roles</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-left">Permissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-medium">Admin</td>
                          <td className="px-4 py-2">
                            Full access to all features
                          </td>
                          <td className="px-4 py-2">
                            Create/edit/delete all resources, manage users,
                            access all settings
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Editor</td>
                          <td className="px-4 py-2">
                            Can edit content but not manage users
                          </td>
                          <td className="px-4 py-2">
                            Create/edit context rules, templates, knowledge base
                            entries
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Viewer</td>
                          <td className="px-4 py-2">
                            Read-only access to analytics and logs
                          </td>
                          <td className="px-4 py-2">
                            View analytics, logs, and existing resources
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">User</td>
                          <td className="px-4 py-2">
                            Regular user with no admin access
                          </td>
                          <td className="px-4 py-2">
                            Use the chat widget, manage own profile
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Managing Users</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Creating a New User</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                        <li>Click the "Add User" button</li>
                        <li>Fill in the user details (name, email, role)</li>
                        <li>
                          Set an initial password or generate a random one
                        </li>
                        <li>Save the user</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-medium">Editing a User</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                        <li>Find the user in the list</li>
                        <li>Click the "Edit" button</li>
                        <li>Update the user details</li>
                        <li>Save the changes</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-medium">Deleting a User</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                        <li>Find the user in the list</li>
                        <li>Click the "Delete" button</li>
                        <li>Confirm the deletion</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">User Activity</h3>
                  <p className="text-sm">
                    You can view a user's activity history, including:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Login history</li>
                    <li>Chat interactions</li>
                    <li>Admin actions (for admin users)</li>
                    <li>Active sessions</li>
                  </ul>
                  <p className="text-sm">
                    This information can be useful for troubleshooting issues
                    and monitoring user behavior.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Security Best Practices</AlertTitle>
                  <AlertDescription>
                    Always follow the principle of least privilege when
                    assigning roles. Give users only the permissions they need
                    to perform their tasks, and regularly review user accounts
                    to ensure they are still needed.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardTutorial;
