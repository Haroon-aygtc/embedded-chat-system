import React, { useState } from "react";
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
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Users,
  MessageSquare,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import RealTimeMetrics from "./RealTimeMetrics";
import AIModelPerformance from "./AIModelPerformance";
import KnowledgeBaseInsights from "./KnowledgeBaseInsights";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
}

const AnalyticsCard = ({
  title = "Metric",
  value = "0",
  description = "No data available",
  icon = <Activity className="h-4 w-4 text-muted-foreground" />,
  change,
  changeType = "neutral",
}: AnalyticsCardProps) => {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {change && (
          <div
            className={`mt-1 flex items-center text-xs ${changeType === "increase" ? "text-green-500" : changeType === "decrease" ? "text-red-500" : "text-gray-500"}`}
          >
            {changeType === "increase"
              ? "↑"
              : changeType === "decrease"
                ? "↓"
                : "→"}{" "}
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ConversationStatsProps {
  totalConversations?: number;
  averageLength?: number;
  responseTime?: number;
  satisfactionRate?: number;
}

const ConversationStats = ({
  totalConversations = 1248,
  averageLength = 8,
  responseTime = 1.2,
  satisfactionRate = 87,
}: ConversationStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Total Conversations"
        value={totalConversations.toLocaleString()}
        description="All time conversations"
        icon={<MessageSquare className="h-4 w-4" />}
        change="+12% from last month"
        changeType="increase"
      />
      <AnalyticsCard
        title="Avg. Conversation Length"
        value={`${averageLength} msgs`}
        description="Messages per conversation"
        icon={<Activity className="h-4 w-4" />}
        change="+3% from last month"
        changeType="increase"
      />
      <AnalyticsCard
        title="Avg. Response Time"
        value={`${responseTime}s`}
        description="Time to first response"
        icon={<Clock className="h-4 w-4" />}
        change="-0.3s from last month"
        changeType="increase"
      />
      <AnalyticsCard
        title="Satisfaction Rate"
        value={`${satisfactionRate}%`}
        description="Based on user feedback"
        icon={<Users className="h-4 w-4" />}
        change="+2% from last month"
        changeType="increase"
      />
    </div>
  );
};

interface UsageChartProps {
  data?: any;
  period?: "daily" | "weekly" | "monthly";
}

const UsageChart = ({ period = "daily" }: UsageChartProps) => {
  return (
    <Card className="col-span-4 bg-white">
      <CardHeader>
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>Chat widget usage over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <LineChart className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Chart visualization would appear here</p>
            <p className="text-sm">Showing {period} usage statistics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TopQueriesProps {
  queries?: Array<{ query: string; count: number }>;
}

const TopQueries = ({
  queries = [
    { query: "How do I embed the chat widget?", count: 145 },
    { query: "What are context rules?", count: 132 },
    { query: "How to configure the AI model?", count: 97 },
    { query: "Can I customize the appearance?", count: 89 },
    { query: "How to export conversation data?", count: 76 },
  ],
}: TopQueriesProps) => {
  const maxCount = Math.max(...queries.map((q) => q.count));

  return (
    <Card className="col-span-2 bg-white">
      <CardHeader>
        <CardTitle>Top Queries</CardTitle>
        <CardDescription>Most frequent user questions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queries.map((query, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{query.query}</span>
                <span className="font-medium">{query.count}</span>
              </div>
              <Progress
                value={(query.count / maxCount) * 100}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface ModelDistributionProps {
  distribution?: { gemini: number; huggingFace: number };
}

const ModelDistribution = ({
  distribution = { gemini: 65, huggingFace: 35 },
}: ModelDistributionProps) => {
  return (
    <Card className="col-span-2 bg-white">
      <CardHeader>
        <CardTitle>AI Model Distribution</CardTitle>
        <CardDescription>Query distribution between models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <PieChart className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Chart visualization would appear here</p>
            <div className="mt-4 flex justify-center space-x-4">
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Gemini ({distribution.gemini}%)</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="text-sm">
                  Hugging Face ({distribution.huggingFace}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ContextBreakdownProps {
  contexts?: Array<{ name: string; percentage: number }>;
}

const ContextBreakdown = ({
  contexts = [
    { name: "General Inquiries", percentage: 40 },
    { name: "Technical Support", percentage: 25 },
    { name: "Product Information", percentage: 20 },
    { name: "Billing Questions", percentage: 10 },
    { name: "Other", percentage: 5 },
  ],
}: ContextBreakdownProps) => {
  return (
    <Card className="col-span-2 bg-white">
      <CardHeader>
        <CardTitle>Context Breakdown</CardTitle>
        <CardDescription>Distribution of conversation contexts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Chart visualization would appear here</p>
            <p className="text-sm">Showing context distribution</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface AnalyticsDashboardProps {
  period?: "daily" | "weekly" | "monthly";
  conversationStats?: ConversationStatsProps;
  topQueries?: TopQueriesProps["queries"];
  modelDistribution?: ModelDistributionProps["distribution"];
  contextBreakdown?: ContextBreakdownProps["contexts"];
}

const AnalyticsDashboard = ({
  period = "daily",
  conversationStats,
  topQueries,
  modelDistribution,
  contextBreakdown,
}: AnalyticsDashboardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time</TabsTrigger>
          <TabsTrigger value="ai-models">AI Models</TabsTrigger>
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ConversationStats {...conversationStats} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UsageChart period={period} />
            <TopQueries queries={topQueries} />
            <ModelDistribution distribution={modelDistribution} />
            <ContextBreakdown contexts={contextBreakdown} />
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <RealTimeMetrics
            isLoading={isLoading}
            onRefresh={handleRefresh}
            lastUpdated={new Date().toLocaleTimeString()}
          />
        </TabsContent>

        <TabsContent value="ai-models" className="space-y-4">
          <AIModelPerformance
            modelDistribution={modelDistribution}
            contextBreakdown={contextBreakdown}
          />
        </TabsContent>

        <TabsContent value="knowledge-base" className="space-y-4">
          <KnowledgeBaseInsights
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Conversation Details</CardTitle>
              <CardDescription>
                Detailed conversation metrics and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">Conversation details would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
