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
import supabase from "@/services/supabaseClient";
import { format } from "date-fns";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contextRules, setContextRules] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const pageSize = 10;

  useEffect(() => {
    fetchContextRules();
    fetchLogs();
  }, [page, searchTerm, modelFilter, contextFilter, dateRange]);

  const fetchContextRules = async () => {
    try {
      const { data, error } = await supabase
        .from("context_rules")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setContextRules(data || []);
    } catch (error) {
      console.error("Error fetching context rules:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ai_interaction_logs")
        .select("*, context_rule:context_rule_id(name)", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(
          `query.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`,
        );
      }

      if (modelFilter) {
        query = query.eq("model_used", modelFilter);
      }

      if (contextFilter) {
        query = query.eq("context_rule_id", contextFilter);
      }

      if (dateRange.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }

      if (dateRange.to) {
        // Add one day to include the end date fully
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("created_at", endDate.toISOString());
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));

      // Extract unique models for filtering
      if (data && data.length > 0) {
        const models = [...new Set(data.map((log) => log.model_used))];
        setAvailableModels(models);
      }
    } catch (error) {
      console.error("Error fetching AI interaction logs:", error);
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
      setLoading(true);

      // Fetch all logs with current filters but no pagination
      let query = supabase
        .from("ai_interaction_logs")
        .select("*, context_rule:context_rule_id(name)")
        .order("created_at", { ascending: false });

      // Apply the same filters as the current view
      if (searchTerm) {
        query = query.or(
          `query.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`,
        );
      }

      if (modelFilter) {
        query = query.eq("model_used", modelFilter);
      }

      if (contextFilter) {
        query = query.eq("context_rule_id", contextFilter);
      }

      if (dateRange.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }

      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Format data for CSV
        const csvData = data.map((log) => ({
          id: log.id,
          user_id: log.user_id,
          query: log.query,
          response: log.response,
          model_used: log.model_used,
          context_rule: log.context_rule?.name || "None",
          created_at: log.created_at,
        }));

        // Convert to CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(","),
          ...csvData.map((row) =>
            headers
              .map((header) =>
                JSON.stringify((row as any)[header] || "").replace(/\n/g, " "),
              )
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
          `ai-interaction-logs-${new Date().toISOString()}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
    } finally {
      setLoading(false);
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
              disabled={loading || logs.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model-filter">Filter by Model</Label>
              <Select
                value={modelFilter || ""}
                onValueChange={(value) => setModelFilter(value || null)}
              >
                <SelectTrigger id="model-filter">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
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
                value={contextFilter || ""}
                onValueChange={(value) => setContextFilter(value || null)}
              >
                <SelectTrigger id="context-filter">
                  <SelectValue placeholder="All Contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Contexts</SelectItem>
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
                      No logs found
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
