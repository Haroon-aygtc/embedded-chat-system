import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Globe,
  Settings,
  Database,
  FileText,
  Image,
  Video,
  List,
  Table,
  Brain,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Copy,
  Search,
  Loader2,
} from "lucide-react";
import scrappingService, {
  ScrapeOptions,
  ScrapeResult,
} from "@/services/scrappingService";

const ScrappingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ScrapeResult[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapeResult | null>(null);
  const [previewTab, setPreviewTab] = useState("text");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScrapeOptions>({
    defaultValues: {
      url: "",
      includeHeader: true,
      includeFooter: true,
      scrapeFullPage: true,
      scrapeImages: true,
      scrapeVideos: true,
      scrapeText: true,
      handleDynamicContent: false,
      maxPages: 1,
      waitTime: 1000,
      selector: "",
      loginRequired: false,
      pagination: {
        enabled: false,
        nextButtonSelector: "",
        maxPages: 1,
      },
      aiOptions: {
        performSentimentAnalysis: true,
        performNER: true,
        generateSummary: true,
        extractKeywords: true,
        categorizeContent: true,
      },
      exportOptions: {
        format: "json",
        saveToPublic: true,
        overwriteExisting: false,
      },
    },
  });

  const watchLoginRequired = watch("loginRequired");
  const watchPagination = watch("pagination.enabled");
  const watchHandleDynamicContent = watch("handleDynamicContent");

  useEffect(() => {
    loadJobs();

    // Set up refresh interval for jobs
    const interval = setInterval(() => {
      if (activeTab === "jobs") {
        loadJobs();
      }
    }, 5000);

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab]);

  const loadJobs = async () => {
    try {
      const allJobs = scrappingService.getAllJobs();
      setJobs(allJobs);
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load jobs");
    }
  };

  const onSubmit = async (data: ScrapeOptions) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Start the scraping job
      const jobId = await scrappingService.startScraping(data);

      setSuccess(`Scraping job started successfully! Job ID: ${jobId}`);
      setActiveTab("jobs");
      loadJobs();
    } catch (err: any) {
      console.error("Error starting scraping job:", err);
      setError(err.message || "Failed to start scraping job");
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job: ScrapeResult) => {
    setSelectedJob(job);
    setActiveTab("preview");
    setPreviewTab("text");
  };

  const handleDeleteJob = (jobId: string) => {
    try {
      scrappingService.deleteJob(jobId);
      loadJobs();
      setSuccess("Job deleted successfully");

      // If the deleted job is currently selected, clear the selection
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(null);
        setActiveTab("jobs");
      }
    } catch (err: any) {
      console.error("Error deleting job:", err);
      setError(err.message || "Failed to delete job");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="container mx-auto py-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI-Powered Web Scraping</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>New Scrape</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Jobs</span>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2"
            disabled={!selectedJob}
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* New Scrape Tab */}
        <TabsContent value="new">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Configuration */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Configuration</CardTitle>
                    <CardDescription>
                      Configure the URL and basic scraping options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL to Scrape</Label>
                      <Controller
                        name="url"
                        control={control}
                        rules={{ required: "URL is required" }}
                        render={({ field }) => (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="url"
                                placeholder="https://example.com"
                                className="pl-8"
                                {...field}
                              />
                            </div>
                            <Button type="button" variant="outline">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      />
                      {errors.url && (
                        <p className="text-sm text-red-500">
                          {errors.url.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content Selection</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="includeHeader"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="include-header"
                                />
                              )}
                            />
                            <Label htmlFor="include-header">
                              Include Header
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="includeFooter"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="include-footer"
                                />
                              )}
                            />
                            <Label htmlFor="include-footer">
                              Include Footer
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="scrapeFullPage"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="scrape-full-page"
                                />
                              )}
                            />
                            <Label htmlFor="scrape-full-page">
                              Scrape Full Page
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Content Types</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="scrapeText"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="scrape-text"
                                />
                              )}
                            />
                            <Label htmlFor="scrape-text">Scrape Text</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="scrapeImages"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="scrape-images"
                                />
                              )}
                            />
                            <Label htmlFor="scrape-images">Scrape Images</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="scrapeVideos"
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="scrape-videos"
                                />
                              )}
                            />
                            <Label htmlFor="scrape-videos">Scrape Videos</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selector">CSS Selector (Optional)</Label>
                      <Controller
                        name="selector"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="selector"
                            placeholder=".main-content, #article, etc."
                            {...field}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Specify a CSS selector to target specific content. Leave
                        empty to scrape the entire page.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Options</CardTitle>
                    <CardDescription>
                      Configure dynamic content handling, pagination, and
                      authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="handleDynamicContent"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="handle-dynamic-content"
                          />
                        )}
                      />
                      <Label htmlFor="handle-dynamic-content">
                        Handle Dynamic Content (JavaScript)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable this option to handle JavaScript-rendered content.
                      This will use a headless browser to render the page.
                    </p>

                    {watchHandleDynamicContent && (
                      <div className="space-y-4 border rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="loginRequired"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="login-required"
                              />
                            )}
                          />
                          <Label htmlFor="login-required">Login Required</Label>
                        </div>

                        {watchLoginRequired && (
                          <div className="space-y-4 pl-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="login-username">Username</Label>
                                <Controller
                                  name="loginCredentials.username"
                                  control={control}
                                  defaultValue=""
                                  render={({ field }) => (
                                    <Input
                                      id="login-username"
                                      placeholder="username"
                                      {...field}
                                    />
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Controller
                                  name="loginCredentials.password"
                                  control={control}
                                  defaultValue=""
                                  render={({ field }) => (
                                    <Input
                                      id="login-password"
                                      type="password"
                                      placeholder="password"
                                      {...field}
                                    />
                                  )}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="login-username-selector">
                                Username Selector
                              </Label>
                              <Controller
                                name="loginCredentials.usernameSelector"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                  <Input
                                    id="login-username-selector"
                                    placeholder="#username, input[name='username']"
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="login-password-selector">
                                Password Selector
                              </Label>
                              <Controller
                                name="loginCredentials.passwordSelector"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                  <Input
                                    id="login-password-selector"
                                    placeholder="#password, input[name='password']"
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="login-submit-selector">
                                Submit Button Selector
                              </Label>
                              <Controller
                                name="loginCredentials.submitSelector"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                  <Input
                                    id="login-submit-selector"
                                    placeholder="button[type='submit'], .login-button"
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mt-4">
                          <Controller
                            name="pagination.enabled"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="pagination-enabled"
                              />
                            )}
                          />
                          <Label htmlFor="pagination-enabled">
                            Enable Pagination
                          </Label>
                        </div>

                        {watchPagination && (
                          <div className="space-y-4 pl-6">
                            <div className="space-y-2">
                              <Label htmlFor="pagination-next-button">
                                Next Button Selector
                              </Label>
                              <Controller
                                name="pagination.nextButtonSelector"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                  <Input
                                    id="pagination-next-button"
                                    placeholder=".next-page, a.pagination-next"
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pagination-max-pages">
                                Maximum Pages
                              </Label>
                              <Controller
                                name="pagination.maxPages"
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    id="pagination-max-pages"
                                    type="number"
                                    min="1"
                                    max="100"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="wait-time">Wait Time (ms)</Label>
                          <Controller
                            name="waitTime"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="wait-time"
                                type="number"
                                min="0"
                                step="100"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            )}
                          />
                          <p className="text-xs text-muted-foreground">
                            Time to wait for dynamic content to load (in
                            milliseconds)
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Options */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                    <CardDescription>
                      Configure AI-powered analysis options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="aiOptions.performSentimentAnalysis"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="sentiment-analysis"
                            />
                          )}
                        />
                        <Label htmlFor="sentiment-analysis">
                          Sentiment Analysis
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="aiOptions.performNER"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="named-entity-recognition"
                            />
                          )}
                        />
                        <Label htmlFor="named-entity-recognition">
                          Named Entity Recognition
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="aiOptions.generateSummary"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="generate-summary"
                            />
                          )}
                        />
                        <Label htmlFor="generate-summary">
                          Generate Summary
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="aiOptions.extractKeywords"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="extract-keywords"
                            />
                          )}
                        />
                        <Label htmlFor="extract-keywords">
                          Extract Keywords
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="aiOptions.categorizeContent"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="categorize-content"
                            />
                          )}
                        />
                        <Label htmlFor="categorize-content">
                          Categorize Content
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>
                      Configure how to export the scraped data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="export-format">Export Format</Label>
                      <Controller
                        name="exportOptions.format"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="export-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="xml">XML</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="exportOptions.saveToPublic"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="save-to-public"
                          />
                        )}
                      />
                      <Label htmlFor="save-to-public">
                        Save to Public Directory
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="exportOptions.overwriteExisting"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="overwrite-existing"
                          />
                        )}
                      />
                      <Label htmlFor="overwrite-existing">
                        Overwrite Existing Files
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Scrape...
                    </>
                  ) : (
                    <>Start Scraping</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Scraping Jobs</CardTitle>
                <Button variant="outline" size="sm" onClick={loadJobs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                View and manage your scraping jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scraping jobs found. Start a new scrape to see results
                  here.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {job.metadata.pageTitle || job.url}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {job.url}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    job.status === "completed"
                                      ? "default"
                                      : job.status === "failed"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {job.status.charAt(0).toUpperCase() +
                                    job.status.slice(1)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(job.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewJob(job)}
                                disabled={job.status === "in-progress"}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteJob(job.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {job.status === "in-progress" && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{job.progress}%</span>
                              </div>
                              <Progress value={job.progress} className="h-2" />
                            </div>
                          )}

                          {job.status === "failed" && job.error && (
                            <div className="mt-2 text-sm text-red-500">
                              <span className="font-medium">Error:</span>{" "}
                              {job.error}
                            </div>
                          )}

                          {job.status === "completed" && (
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{job.data.text.length} texts</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                <span>{job.data.images.length} images</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                <span>{job.data.videos.length} videos</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Table className="h-3 w-3" />
                                <span>{job.data.tables.length} tables</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {job.status === "completed" && job.aiAnalysis && (
                          <div className="bg-slate-50 p-4 md:w-64 border-t md:border-t-0 md:border-l">
                            <h4 className="text-sm font-medium flex items-center gap-1">
                              <Brain className="h-3 w-3" /> AI Analysis
                            </h4>
                            <div className="mt-2 space-y-2 text-xs">
                              {job.aiAnalysis.sentiment && (
                                <div>
                                  <span className="font-medium">
                                    Sentiment:
                                  </span>{" "}
                                  {job.aiAnalysis.sentiment.overall}
                                </div>
                              )}
                              {job.aiAnalysis.summary && (
                                <div>
                                  <span className="font-medium">Summary:</span>{" "}
                                  <span className="line-clamp-2">
                                    {job.aiAnalysis.summary}
                                  </span>
                                </div>
                              )}
                              {job.aiAnalysis.categories &&
                                job.aiAnalysis.categories.length > 0 && (
                                  <div>
                                    <span className="font-medium">
                                      Categories:
                                    </span>{" "}
                                    <span className="line-clamp-1">
                                      {job.aiAnalysis.categories.join(", ")}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          {!selectedJob ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No job selected. Please select a job from the Jobs tab to
                preview.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {selectedJob.metadata.pageTitle || "Scraped Content"}
                        </CardTitle>
                        <CardDescription>
                          <a
                            href={selectedJob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {selectedJob.url}
                          </a>
                        </CardDescription>
                      </div>
                      {selectedJob.exportPath && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={selectedJob.exportPath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={previewTab} onValueChange={setPreviewTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger
                          value="text"
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="hidden sm:inline">Text</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="images"
                          className="flex items-center gap-1"
                        >
                          <Image className="h-3 w-3" />
                          <span className="hidden sm:inline">Images</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="videos"
                          className="flex items-center gap-1"
                        >
                          <Video className="h-3 w-3" />
                          <span className="hidden sm:inline">Videos</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="tables"
                          className="flex items-center gap-1"
                        >
                          <Table className="h-3 w-3" />
                          <span className="hidden sm:inline">Tables</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="lists"
                          className="flex items-center gap-1"
                        >
                          <List className="h-3 w-3" />
                          <span className="hidden sm:inline">Lists</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="mt-4">
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                          {selectedJob.data.text.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No text content found.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedJob.data.text.map((text, index) => (
                                <div key={index} className="group">
                                  <div className="flex justify-between items-start">
                                    <p>{text}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => copyToClipboard(text)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {index < selectedJob.data.text.length - 1 && (
                                    <Separator className="my-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="images" className="mt-4">
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                          {selectedJob.data.images.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No images found.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {selectedJob.data.images.map((src, index) => (
                                <div key={index} className="group relative">
                                  <img
                                    src={src}
                                    alt={`Scraped image ${index + 1}`}
                                    className="rounded-md object-cover w-full h-40"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/150?text=Image+Error";
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        asChild
                                      >
                                        <a
                                          href={src}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </a>
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => copyToClipboard(src)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="videos" className="mt-4">
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                          {selectedJob.data.videos.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No videos found.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedJob.data.videos.map((src, index) => (
                                <div key={index} className="group">
                                  <div className="flex justify-between items-start">
                                    <a
                                      href={src}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      {src}
                                    </a>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => copyToClipboard(src)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {index <
                                    selectedJob.data.videos.length - 1 && (
                                    <Separator className="my-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="tables" className="mt-4">
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                          {selectedJob.data.tables.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No tables found.
                            </div>
                          ) : (
                            <div className="space-y-8">
                              {selectedJob.data.tables.map(
                                (table, tableIndex) => (
                                  <div
                                    key={table.id}
                                    className="overflow-x-auto"
                                  >
                                    <h3 className="text-sm font-medium mb-2">
                                      Table {tableIndex + 1}
                                    </h3>
                                    <table className="w-full border-collapse border border-gray-200">
                                      {table.headers.length > 0 && (
                                        <thead>
                                          <tr>
                                            {table.headers.map(
                                              (
                                                header: string,
                                                index: number,
                                              ) => (
                                                <th
                                                  key={index}
                                                  className="border border-gray-200 px-4 py-2 text-left text-xs font-medium bg-gray-50"
                                                >
                                                  {header}
                                                </th>
                                              ),
                                            )}
                                          </tr>
                                        </thead>
                                      )}
                                      <tbody>
                                        {table.rows.map(
                                          (row: string[], rowIndex: number) => (
                                            <tr key={rowIndex}>
                                              {row.map(
                                                (
                                                  cell: string,
                                                  cellIndex: number,
                                                ) => (
                                                  <td
                                                    key={cellIndex}
                                                    className="border border-gray-200 px-4 py-2 text-xs"
                                                  >
                                                    {cell}
                                                  </td>
                                                ),
                                              )}
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="lists" className="mt-4">
                        <ScrollArea className="h-[500px] rounded-md border p-4">
                          {selectedJob.data.lists.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No lists found.
                            </div>
                          ) : (
                            <div className="space-y-8">
                              {selectedJob.data.lists.map((list, listIndex) => (
                                <div key={list.id}>
                                  <h3 className="text-sm font-medium mb-2">
                                    List {listIndex + 1} ({list.type})
                                  </h3>
                                  {list.type === "ordered" ? (
                                    <ol className="list-decimal pl-5 space-y-1">
                                      {list.items.map(
                                        (item: string, itemIndex: number) => (
                                          <li
                                            key={itemIndex}
                                            className="text-sm"
                                          >
                                            {item}
                                          </li>
                                        ),
                                      )}
                                    </ol>
                                  ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {list.items.map(
                                        (item: string, itemIndex: number) => (
                                          <li
                                            key={itemIndex}
                                            className="text-sm"
                                          >
                                            {item}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {selectedJob.aiAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedJob.aiAnalysis.sentiment && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            Sentiment Analysis
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${
                                selectedJob.aiAnalysis.sentiment.overall ===
                                "POSITIVE"
                                  ? "bg-green-100 text-green-800"
                                  : selectedJob.aiAnalysis.sentiment.overall ===
                                      "NEGATIVE"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedJob.aiAnalysis.sentiment.overall}
                            </Badge>
                            <span className="text-sm">
                              Score:{" "}
                              {selectedJob.aiAnalysis.sentiment.score.toFixed(
                                2,
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedJob.aiAnalysis.summary && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">Summary</h3>
                          <p className="text-sm">
                            {selectedJob.aiAnalysis.summary}
                          </p>
                        </div>
                      )}

                      {selectedJob.aiAnalysis.categories &&
                        selectedJob.aiAnalysis.categories.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.aiAnalysis.categories.map(
                                (category, index) => (
                                  <Badge key={index} variant="secondary">
                                    {category}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {selectedJob.aiAnalysis.keywords &&
                        selectedJob.aiAnalysis.keywords.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Keywords
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.aiAnalysis.keywords.map(
                                (keyword, index) => (
                                  <Badge key={index} variant="outline">
                                    {keyword}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {selectedJob.aiAnalysis.entities &&
                        selectedJob.aiAnalysis.entities.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Named Entities
                            </h3>
                            <ScrollArea className="h-[200px] rounded-md border p-2">
                              <div className="space-y-2">
                                {selectedJob.aiAnalysis.entities
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 20)
                                  .map((entity, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {entity.type}
                                        </Badge>
                                        <span className="text-sm">
                                          {entity.name}
                                        </span>
                                      </div>
                                      <Badge variant="secondary">
                                        {entity.count}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Page Title</h3>
                      <p className="text-sm">
                        {selectedJob.metadata.pageTitle || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Page Description
                      </h3>
                      <p className="text-sm">
                        {selectedJob.metadata.pageDescription || "N/A"}
                      </p>
                    </div>
                    {selectedJob.metadata.pageKeywords &&
                      selectedJob.metadata.pageKeywords.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            Page Keywords
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.metadata.pageKeywords.map(
                              (keyword, index) => (
                                <Badge key={index} variant="outline">
                                  {keyword}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    <div>
                      <h3 className="text-sm font-medium mb-1">Scraped At</h3>
                      <p className="text-sm">
                        {new Date(selectedJob.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Elements Count
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span className="text-sm">
                            {selectedJob.data.text.length} texts
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span className="text-sm">
                            {selectedJob.data.images.length} images
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span className="text-sm">
                            {selectedJob.data.videos.length} videos
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Table className="h-3 w-3" />
                          <span className="text-sm">
                            {selectedJob.data.tables.length} tables
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScrappingModule;
