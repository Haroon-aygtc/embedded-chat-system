import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, FileText, Code } from "lucide-react";

const ScrapingModule = () => {
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>("");
  const [activeTab, setActiveTab] = useState("url");
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL to scrape");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults("");

    try {
      // Mock scraping functionality since we can't make actual server requests
      setTimeout(() => {
        // Simulate successful scraping
        setResults(
          `<div class="scraped-content">
            <h1>Sample Scraped Content from ${url}</h1>
            <p>This is simulated content that would be extracted from the website.</p>
            <p>In a real implementation, this would contain the actual HTML content extracted based on the selector: "${selector || "*"}"</p>
            <ul>
              <li>Sample item 1</li>
              <li>Sample item 2</li>
              <li>Sample item 3</li>
            </ul>
          </div>`,
        );
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError("Failed to scrape the website. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Web Scraping Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="url">URL Scraping</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selector">CSS Selector (optional)</Label>
                <Input
                  id="selector"
                  placeholder=".article-content, #main-content"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to extract the entire page content
                </p>
              </div>

              <Button
                onClick={handleScrape}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  "Scrape Website"
                )}
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>Advanced Scraping Options</Label>
                <p className="text-sm text-muted-foreground">
                  Configure advanced scraping options like authentication,
                  headers, and more.
                </p>
                <div className="p-4 border rounded-md bg-muted/50 text-center">
                  <p>Advanced options are not available in the demo version.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
              {error}
            </div>
          )}

          {results && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Scraping Results</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    View HTML
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-4 bg-muted/20 max-h-[400px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: results }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScrapingModule;
