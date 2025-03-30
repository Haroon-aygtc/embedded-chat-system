import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter, Calendar } from "lucide-react";
import aiService from "@/services/aiService";
import { format } from "date-fns";
import { getMySQLClient } from "@/services/mysqlClient";
import logger from "@/utils/logger";

interface AIInteractionLog {
  id: string;
  user_id: string;
  query: string;
  response: string;
  model_used: string;
  context_rule_id: string | null;
  created_at: string;
  metadata: any;
  context_rule?: {
    name: string;
  };
  knowledge_base_results?: number;
  knowledge_base_ids?: string[];
}

const AIInteractionLogs = () => {
  const [logs, setLogs] = useState<AIInteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  } | null>({ from: null, to: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contextRules, setContextRules] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchContextRules();
    fetchLogs();
  }, [page, searchTerm, modelFilter, contextFilter, dateRange]);

  const fetchContextRules = async () => {
    try {
      setError(null);
      const sequelize = await getMySQLClient();

      const contextRulesData = await sequelize.query(
        `SELECT id, name FROM context_rules ORDER BY name`,
        { type: sequelize.QueryTypes.SELECT },
      );

      setContextRules(contextRulesData as { id: string; name: string }[]);
    } catch (error) {
      console.error("Error fetching context rules:", error);
      setError("Failed to load context rules. Please try again.");
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params: any = {
        page,
        pageSize,
        query: searchTerm || undefined,
        modelUsed: modelFilter || undefined,
        contextRuleId: contextFilter || undefined,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      };

      // Fetch logs using aiService
      const result = await aiService.getAIInteractionLogs(params);

      setLogs(result.logs || []);
      setTotalPages(result.totalPages);

      // Extract unique models for filtering
      if (result.logs && result.logs.length > 0) {
        const models = [
          ...new Set(result.logs.map((log: any) => log.model_used)),
        ];
        setAvailableModels(models);
      }
    } catch (error) {
      console.error("Error fetching AI interaction logs:", error);
      setError("Failed to load interaction logs. Please try again.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setError(null);

      // Get MySQL client
      const sequelize = await getMySQLClient();

      // Build query conditions
      const conditions = [];
      const replacements: any[] = [];

      if (searchTerm) {
        conditions.push("(l.query LIKE ? OR l.response LIKE ?)");
        replacements.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (modelFilter) {
        conditions.push("l.model_used = ?");
        replacements.push(modelFilter);
      }

      if (contextFilter) {
        if (contextFilter === "null") {
          conditions.push("l.context_rule_id IS NULL");
        } else {
          conditions.push("l.context_rule_id = ?");
          replacements.push(contextFilter);
        }
      }

      if (dateRange?.from) {
        conditions.push("l.created_at >= ?");
        replacements.push(dateRange.from.toISOString());
      }

      if (dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        conditions.push("l.created_at < ?");
        replacements.push(endDate.toISOString());
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      try {
        // Execute query
        const logs = await sequelize.query(
          `SELECT l.*, c.name as context_rule_name 
           FROM ai_interaction_logs l
           LEFT JOIN context_rules c ON l.context_rule_id = c.id
           ${whereClause} 
           ORDER BY l.created_at DESC`,
          {
            replacements,
            type: sequelize.QueryTypes.SELECT,
          },
        );

        if (!logs || logs.length === 0) {
          setError("No data available to export with the current filters.");
          setExportLoading(false);
          return;
        }
        // Format data for CSV
        const csvData = logs.map((log: any) => ({
          id: log.id,
          user_id: log.user_id,
          query: log.query,
          response: log.response,
          model_used: log.model_used,
          context_rule: log.context_rule_name || "None",
          knowledge_base_results: log.knowledge_base_results || 0,
          knowledge_base_ids: log.knowledge_base_ids
            ? log.knowledge_base_ids.split(",").join(";")
            : "",
          created_at: log.created_at,
        }));

        // Convert to CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(","),
          ...csvData.map((row) =>
            headers
              .map((header) => {
                const value = (row as any)[header];
                // Handle different data types appropriately
                if (value === null || value === undefined) {
                  return "";
                } else if (typeof value === "string") {
                  // Escape quotes and remove newlines
                  return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
                } else {
                  return `"${String(value).replace(/"/g, '""')}"`;
                }
              })
              .join(","),
          ),
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `ai-interaction-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (queryError) {
        logger.error("Error executing export query:", queryError);
        setError("Error executing export query. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
      setError("Failed to export logs. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setModelFilter(null);
    setContextFilter(null);
    setDateRange({ from: null, to: null });
    setPage(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Interaction Logs</CardTitle>
        <CardDescription>
          Review and analyze AI model interactions and responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search queries or responses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={loading || exportLoading || logs.length === 0}
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model-filter">Filter by Model</Label>
              <Select
                value={modelFilter || "all"}
                onValueChange={(value) =>
                  setModelFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="model-filter">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="context-filter">Filter by Context</Label>
              <Select
                value={contextFilter || "all"}
                onValueChange={(value) =>
                  setContextFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="context-filter">
                  <SelectValue placeholder="All Contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  <SelectItem value="null">No Context</SelectItem>
                  {contextRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User Query</TableHead>
                  <TableHead>AI Response</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Knowledge Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.query}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {log.response}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.model_used}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.context_rule ? (
                          <Badge variant="secondary">
                            {log.context_rule.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.knowledge_base_results ? (
                          <Badge variant="secondary">
                            {log.knowledge_base_results} results
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not used</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInteractionLogs;
