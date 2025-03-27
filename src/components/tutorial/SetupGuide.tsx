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
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileCode,
  Terminal,
} from "lucide-react";

const SetupGuide = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Setup Guide</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Step-by-step instructions for setting up the embeddable chat system
        </p>
      </div>

      <Tabs defaultValue="prerequisites" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="database">Database Setup</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="prerequisites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
              <CardDescription>
                Required tools and accounts before you begin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Node.js (v16+)</h3>
                    <p className="text-sm text-muted-foreground">
                      The application requires Node.js version 16 or higher.
                      Download from{" "}
                      <a
                        href="https://nodejs.org"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        nodejs.org
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Supabase Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a free Supabase account at{" "}
                      <a
                        href="https://supabase.com"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        supabase.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Git</h3>
                    <p className="text-sm text-muted-foreground">
                      Version control system to clone the repository. Download
                      from{" "}
                      <a
                        href="https://git-scm.com"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        git-scm.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Code Editor</h3>
                    <p className="text-sm text-muted-foreground">
                      We recommend Visual Studio Code with TypeScript and React
                      extensions
                    </p>
                  </div>
                </div>

                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Make sure you have administrative access to your machine to
                    install the required tools and dependencies.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installation Steps</CardTitle>
              <CardDescription>
                Setting up the project on your local machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Terminal className="h-5 w-5 mr-2 text-primary" />
                    Clone the Repository
                  </h3>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                    git clone https://github.com/yourusername/chat-widget.git
                    <br />
                    cd chat-widget
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Terminal className="h-5 w-5 mr-2 text-primary" />
                    Install Dependencies
                  </h3>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                    npm install
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will install all the required dependencies defined in
                    package.json
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <FileCode className="h-5 w-5 mr-2 text-primary" />
                    Set Up Environment Variables
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a .env.local file in the root directory with the
                    following variables:
                  </p>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                    MYSQL_HOST=localhost
                    <br />
                    MYSQL_PORT=3306
                    <br />
                    MYSQL_USER=root
                    <br />
                    MYSQL_PASSWORD=password
                    <br />
                    MYSQL_DATABASE=chat_widget_db
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Terminal className="h-5 w-5 mr-2 text-primary" />
                    Start the Development Server
                  </h3>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                    npm run dev:all
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will start both the Vite development server and the
                    WebSocket server
                  </p>
                </div>

                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription>
                    The WebSocket server runs on port 8080 by default. Make sure
                    this port is available or update the port in
                    server/websocket-server.js
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>
                Setting up the Supabase database and schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Database className="h-5 w-5 mr-2 text-primary" />
                    Set Up MySQL Database
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Install MySQL on your local machine or use a cloud
                      provider
                    </li>
                    <li>Create a new database named 'chat_widget_db'</li>
                    <li>
                      Configure your connection details in the .env.local file
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Terminal className="h-5 w-5 mr-2 text-primary" />
                    Run Database Migrations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The project includes migration files in the migrations
                    directory. You can apply them using Sequelize CLI.
                  </p>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                    # Using Sequelize CLI
                    <br />
                    npx sequelize-cli db:migrate
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Manual SQL Execution</h3>
                  <p className="text-sm text-muted-foreground">
                    Alternatively, you can execute the SQL files manually in
                    your MySQL client:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Connect to your MySQL database using a client like MySQL
                      Workbench
                    </li>
                    <li>
                      Open each migration file from the migrations directory
                    </li>
                    <li>Execute the SQL statements in your client</li>
                    <li>Execute the files in numerical order (by filename)</li>
                  </ol>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Make sure your MySQL server is properly configured and
                    accessible from your application for all database features
                    to work properly.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Final configuration steps before using the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Authentication Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure authentication in your application:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      The application uses JWT-based authentication with MySQL
                    </li>
                    <li>
                      Make sure the authentication routes are properly
                      configured
                    </li>
                    <li>
                      Set up proper session management in your application
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Create an Admin User</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first admin user to access the admin dashboard:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Sign up using the application's signup page</li>
                    <li>
                      In the Supabase SQL Editor, run the following query to
                      make your user an admin:
                    </li>
                  </ol>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto mt-2">
                    UPDATE users
                    <br />
                    SET role = 'admin'
                    <br />
                    WHERE email = 'your-email@example.com';
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">
                    WebSocket Server Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The WebSocket server runs on port 8080 by default. If you
                    need to change this:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Open server/websocket-server.js</li>
                    <li>Update the PORT variable</li>
                    <li>
                      Make sure to update the WebSocket URL in the client code
                      as well
                    </li>
                  </ol>
                </div>

                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Production Deployment</AlertTitle>
                  <AlertDescription>
                    For production deployment, you'll need to set up proper
                    HTTPS for both the main application and the WebSocket
                    server. Consider using a service like Vercel for the
                    frontend and a service like Heroku or Railway for the
                    WebSocket server.
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

export default SetupGuide;
