import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Download,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  isLoading?: boolean;
}

const MetricCard = ({
  title,
  value,
  description,
  icon,
  change,
  changeType = "neutral",
  isLoading = false,
}: MetricCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
        {change && (
          <div
            className={`mt-1 flex items-center text-xs ${changeType === "increase" ? "text-green-500" : changeType === "decrease" ? "text-red-500" : "text-gray-500"}`}
          >
            {changeType === "increase" ? (
              <ArrowUpRight className="mr-1 h-3 w-3" />
            ) : changeType === "decrease" ? (
              <ArrowUpRight className="mr-1 h-3 w-3 rotate-180 transform" />
            ) : (
              "-"
            )}{" "}
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RealTimeMetricsProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

const RealTimeMetrics = ({
  isLoading = false,
  onRefresh,
  lastUpdated,
}: RealTimeMetricsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Real-Time Metrics</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Users"
              value="342"
              description="Current active users"
              icon={<Users className="h-4 w-4" />}
              change="+12% from last hour"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Active Sessions"
              value="189"
              description="Open chat sessions"
              icon={<MessageSquare className="h-4 w-4" />}
              change="+8% from last hour"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Response Time"
              value="1.2s"
              description="Average response time"
              icon={<Clock className="h-4 w-4" />}
              change="-0.3s from last hour"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Error Rate"
              value="0.5%"
              description="Failed responses"
              icon={<AlertCircle className="h-4 w-4" />}
              change="-0.2% from last hour"
              changeType="increase"
              isLoading={isLoading}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current service health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Service</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" /> Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" /> Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket Service</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" /> Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Service</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" /> Operational
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Load</CardTitle>
                <CardDescription>System resource utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Database Connections</span>
                    <span className="text-sm font-medium">56%</span>
                  </div>
                  <Progress value={56} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Network I/O</span>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Conversations"
              value="1,248"
              description="All time conversations"
              icon={<MessageSquare className="h-4 w-4" />}
              change="+12% from last month"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Avg. Conversation Length"
              value="8 msgs"
              description="Messages per conversation"
              icon={<Activity className="h-4 w-4" />}
              change="+3% from last month"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Avg. Response Time"
              value="1.2s"
              description="Time to first response"
              icon={<Clock className="h-4 w-4" />}
              change="-0.3s from last month"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Satisfaction Rate"
              value="87%"
              description="Based on user feedback"
              icon={<Users className="h-4 w-4" />}
              change="+2% from last month"
              changeType="increase"
              isLoading={isLoading}
            />
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Queries</CardTitle>
                <CardDescription>Most frequent user questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        How do I embed the chat widget?
                      </span>
                      <span className="font-medium">145</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">What are context rules?</span>
                      <span className="font-medium">132</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        How to configure the AI model?
                      </span>
                      <span className="font-medium">97</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        Can I customize the appearance?
                      </span>
                      <span className="font-medium">89</span>
                    </div>
                    <Progress value={61} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        How to export conversation data?
                      </span>
                      <span className="font-medium">76</span>
                    </div>
                    <Progress value={52} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="API Latency"
              value="45ms"
              description="Average API response time"
              icon={<Activity className="h-4 w-4" />}
              change="-5ms from yesterday"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="AI Processing"
              value="850ms"
              description="Average AI processing time"
              icon={<Activity className="h-4 w-4" />}
              change="-50ms from yesterday"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="Database Queries"
              value="12ms"
              description="Average query execution time"
              icon={<Activity className="h-4 w-4" />}
              change="-2ms from yesterday"
              changeType="increase"
              isLoading={isLoading}
            />
            <MetricCard
              title="WebSocket Latency"
              value="35ms"
              description="Average WebSocket latency"
              icon={<Activity className="h-4 w-4" />}
              change="+5ms from yesterday"
              changeType="decrease"
              isLoading={isLoading}
            />
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Distribution</CardTitle>
                <CardDescription>
                  Query distribution between models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Gemini</span>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-2 h-3 w-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm">Hugging Face</span>
                      </div>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <Progress value={35} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMetrics;
