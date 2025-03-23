import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getMySQLClient } from "@/services/mysqlClient";

interface ModelData {
  name: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  isActive: boolean;
}

interface ContextData {
  name: string;
  percentage: number;
  effectiveness: number;
}

interface AIModelPerformanceProps {
  timeRange?: "day" | "week" | "month";
}

const AIModelPerformance: React.FC<AIModelPerformanceProps> = ({
  timeRange = "week",
}) => {
  const [modelData, setModelData] = useState<ModelData[]>([]);
  const [contextData, setContextData] = useState<ContextData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("distribution");

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeRange
      const now = new Date();
      let startDate = new Date();

      if (timeRange === "day") {
        startDate.setDate(now.getDate() - 1);
      } else if (timeRange === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }

      const sequelize = await getMySQLClient();

      // Fetch model distribution data
      const modelUsageData = await sequelize.query(
        `SELECT model_used, created_at, metadata 
         FROM ai_interaction_logs 
         WHERE created_at >= ? 
         ORDER BY created_at DESC`,
        {
          replacements: [startDate.toISOString()],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Process model data
      const modelCounts: Record<string, number> = {};
      const modelResponseTimes: Record<string, number[]> = {};
      const modelErrors: Record<string, number> = {};

      modelUsageData.forEach((log: any) => {
        const model = log.model_used;

        // Count requests per model
        modelCounts[model] = (modelCounts[model] || 0) + 1;

        // Parse metadata if it's a string
        const metadata =
          typeof log.metadata === "string"
            ? JSON.parse(log.metadata)
            : log.metadata || {};

        // Track response times
        if (metadata?.responseTime) {
          if (!modelResponseTimes[model]) modelResponseTimes[model] = [];
          modelResponseTimes[model].push(metadata.responseTime);
        }

        // Track errors
        if (metadata?.error) {
          modelErrors[model] = (modelErrors[model] || 0) + 1;
        }
      });

      // Calculate total requests
      const totalRequests = Object.values(modelCounts).reduce(
        (sum, count) => sum + count,
        0,
      );

      // Format model data
      const formattedModelData: ModelData[] = Object.keys(modelCounts).map(
        (model) => {
          const requestCount = modelCounts[model];
          const responseTimes = modelResponseTimes[model] || [];
          const avgResponseTime =
            responseTimes.length > 0
              ? responseTimes.reduce((sum, time) => sum + time, 0) /
                responseTimes.length
              : 0;
          const errorCount = modelErrors[model] || 0;
          const errorRate =
            requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

          return {
            name: model,
            requestCount,
            avgResponseTime,
            errorRate,
            isActive: true,
          };
        },
      );

      setModelData(formattedModelData);

      // Fetch context rule data with metadata for effectiveness calculation
      const contextRuleData = await sequelize.query(
        `SELECT l.context_rule_id, c.name as context_rule_name, l.metadata 
         FROM ai_interaction_logs l
         LEFT JOIN context_rules c ON l.context_rule_id = c.id
         WHERE l.created_at >= ?`,
        {
          replacements: [startDate.toISOString()],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Process context data
      const contextCounts: Record<string, number> = {};
      const contextSuccessCounts: Record<string, number> = {};
      let totalContexts = 0;

      contextRuleData.forEach((log: any) => {
        const contextName = log.context_rule_name || "No Context";
        contextCounts[contextName] = (contextCounts[contextName] || 0) + 1;
        totalContexts++;

        // Parse metadata if it's a string
        const metadata =
          typeof log.metadata === "string"
            ? JSON.parse(log.metadata || "{}")
            : log.metadata || {};

        // Track successful interactions
        if (metadata?.success === true || metadata?.status === "success") {
          contextSuccessCounts[contextName] =
            (contextSuccessCounts[contextName] || 0) + 1;
        }
      });

      // Format context data with calculated effectiveness
      const formattedContextData: ContextData[] = Object.keys(
        contextCounts,
      ).map((context) => {
        const totalInteractions = contextCounts[context] || 0;
        const successfulInteractions = contextSuccessCounts[context] || 0;

        // Calculate effectiveness as the percentage of successful interactions
        const effectiveness =
          totalInteractions > 0
            ? (successfulInteractions / totalInteractions) * 100
            : 90; // Default to 90% if no data available

        return {
          name: context,
          percentage:
            totalContexts > 0
              ? (contextCounts[context] / totalContexts) * 100
              : 0,
          effectiveness: effectiveness,
        };
      });

      setContextData(formattedContextData);
    } catch (err) {
      console.error("Error fetching AI model performance data:", err);
      setError("Failed to load performance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (modelData.length === 0 && contextData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 text-gray-800 rounded-md">
        <p className="font-medium">No Data Available</p>
        <p>
          There is no AI model performance data available for the selected time
          period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI Model Performance</h2>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="distribution">Model Distribution</TabsTrigger>
          <TabsTrigger value="context">Context Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Distribution</CardTitle>
              <CardDescription>
                Query distribution between models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No model usage data available for the selected time period.
                  </div>
                ) : (
                  modelData.map((model, index) => {
                    const colorClasses = [
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-red-500",
                      "bg-indigo-500",
                    ];

                    const percentage =
                      (model.requestCount /
                        modelData.reduce((sum, m) => sum + m.requestCount, 0)) *
                      100;

                    return (
                      <div key={model.name}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`mr-2 h-3 w-3 rounded-full ${colorClasses[index % colorClasses.length]}`}
                            ></div>
                            <span className="text-sm">{model.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })
                )}
              </div>

              {modelData.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium">Model Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {modelData.slice(0, 2).map((model, index) => (
                      <div
                        key={model.name}
                        className="space-y-2 rounded-lg border p-3"
                      >
                        <h4 className="text-sm font-medium">{model.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Avg. Response Time
                          </span>
                          <span className="text-xs font-medium">
                            {model.avgResponseTime.toFixed(1)}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Accuracy Rate
                          </span>
                          <span className="text-xs font-medium">
                            {(100 - model.errorRate).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Error Rate
                          </span>
                          <span className="text-xs font-medium">
                            {model.errorRate.toFixed(1)}%
                          </span>
                        </div>
                        <Badge
                          className={`mt-2 ${index === 0 ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                        >
                          {index === 0 ? "Primary Model" : "Fallback Model"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Context Breakdown</CardTitle>
              <CardDescription>
                Distribution of conversation contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contextData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No context usage data available for the selected time
                    period.
                  </div>
                ) : (
                  contextData.map((context) => (
                    <div key={context.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">{context.name}</span>
                        <span className="text-sm font-medium">
                          {context.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={context.percentage} className="h-2" />
                    </div>
                  ))
                )}
              </div>

              {contextData.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-medium">
                    Context Rule Effectiveness
                  </h3>
                  <div className="space-y-4">
                    {contextData.slice(0, 3).map((context) => (
                      <div
                        key={context.name}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h4 className="text-sm font-medium">
                            {context.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {context.name === "General Inquiries"
                              ? "Handles basic questions about the platform"
                              : context.name === "Technical Support"
                                ? "Resolves technical issues and implementation questions"
                                : context.name === "Product Information"
                                  ? "Provides details about features and capabilities"
                                  : "Manages user inquiries and requests"}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {context.effectiveness.toFixed(0)}% Effective
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelPerformance;
