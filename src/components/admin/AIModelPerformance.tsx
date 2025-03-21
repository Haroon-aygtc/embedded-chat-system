import React from "react";
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

interface AIModelPerformanceProps {
  modelDistribution?: { gemini: number; huggingFace: number };
  contextBreakdown?: Array<{ name: string; percentage: number }>;
}

const AIModelPerformance = ({
  modelDistribution = { gemini: 65, huggingFace: 35 },
  contextBreakdown = [
    { name: "General Inquiries", percentage: 40 },
    { name: "Technical Support", percentage: 25 },
    { name: "Product Information", percentage: 20 },
    { name: "Billing Questions", percentage: 10 },
    { name: "Other", percentage: 5 },
  ],
}: AIModelPerformanceProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI Model Performance</h2>

      <Tabs defaultValue="distribution">
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
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Gemini</span>
                    </div>
                    <span className="text-sm font-medium">
                      {modelDistribution.gemini}%
                    </span>
                  </div>
                  <Progress value={modelDistribution.gemini} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Hugging Face</span>
                    </div>
                    <span className="text-sm font-medium">
                      {modelDistribution.huggingFace}%
                    </span>
                  </div>
                  <Progress
                    value={modelDistribution.huggingFace}
                    className="h-2"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium">Model Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Gemini</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Avg. Response Time
                      </span>
                      <span className="text-xs font-medium">0.8s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Accuracy Rate
                      </span>
                      <span className="text-xs font-medium">92%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Error Rate
                      </span>
                      <span className="text-xs font-medium">0.4%</span>
                    </div>
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      Primary Model
                    </Badge>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Hugging Face</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Avg. Response Time
                      </span>
                      <span className="text-xs font-medium">1.2s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Accuracy Rate
                      </span>
                      <span className="text-xs font-medium">88%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Error Rate
                      </span>
                      <span className="text-xs font-medium">0.7%</span>
                    </div>
                    <Badge className="mt-2 bg-purple-100 text-purple-800">
                      Fallback Model
                    </Badge>
                  </div>
                </div>
              </div>
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
                {contextBreakdown.map((context, index) => (
                  <div key={index}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">{context.name}</span>
                      <span className="text-sm font-medium">
                        {context.percentage}%
                      </span>
                    </div>
                    <Progress value={context.percentage} className="h-2" />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">
                  Context Rule Effectiveness
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">General Inquiries</h4>
                      <p className="text-xs text-muted-foreground">
                        Handles basic questions about the platform
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      98% Effective
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">Technical Support</h4>
                      <p className="text-xs text-muted-foreground">
                        Resolves technical issues and implementation questions
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      92% Effective
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">
                        Product Information
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Provides details about features and capabilities
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      95% Effective
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelPerformance;
