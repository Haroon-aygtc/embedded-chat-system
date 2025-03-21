import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText, RefreshCw, Search } from "lucide-react";

interface KnowledgeBaseInsightsProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const KnowledgeBaseInsights = ({
  isLoading = false,
  onRefresh,
}: KnowledgeBaseInsightsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Knowledge Base Insights</h2>
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
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">
                  Across all knowledge bases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Knowledge Bases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Active knowledge sources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Retrieval Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">120ms</div>
                <p className="text-xs text-muted-foreground">
                  Time to retrieve relevant documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Relevance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">
                  Average document relevance
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Health</CardTitle>
                <CardDescription>
                  Status and performance of knowledge bases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">
                          Product Documentation
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          245 documents • Last updated 2 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">
                          API Documentation
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          189 documents • Last updated 5 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">FAQ Database</h4>
                        <p className="text-xs text-muted-foreground">
                          156 documents • Last updated 1 day ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">
                          Support Articles
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          312 documents • Last updated 7 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Needs Update
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Knowledge Bases
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Usage</CardTitle>
              <CardDescription>
                How knowledge bases are being utilized
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Product Documentation</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">API Documentation</span>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">FAQ Database</span>
                    <span className="text-sm font-medium">18%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Support Articles</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">
                  Top Accessed Documents
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Getting Started Guide</span>
                    </div>
                    <Badge variant="outline">245 accesses</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">API Authentication</span>
                    </div>
                    <Badge variant="outline">189 accesses</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Widget Configuration</span>
                    </div>
                    <Badge variant="outline">156 accesses</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Troubleshooting Guide</span>
                    </div>
                    <Badge variant="outline">132 accesses</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Sources</CardTitle>
              <CardDescription>
                Sources of knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Internal Documentation</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Public Documentation</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Support Tickets</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm">Community Forums</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">Integration Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">Confluence</h4>
                      <p className="text-xs text-muted-foreground">
                        Internal documentation system
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">GitHub Wiki</h4>
                      <p className="text-xs text-muted-foreground">
                        Technical documentation
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">Zendesk</h4>
                      <p className="text-xs text-muted-foreground">
                        Support ticket system
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <h4 className="text-sm font-medium">Discourse</h4>
                      <p className="text-xs text-muted-foreground">
                        Community forum
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Needs Reauthorization
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Test Knowledge Retrieval
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBaseInsights;
