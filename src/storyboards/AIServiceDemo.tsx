import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import aiService from "@/services/aiService";

const AIServiceDemo = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [model, setModel] = useState<"auto" | "gemini" | "huggingface">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");
    setMetadata(null);

    try {
      let result;
      if (model === "auto") {
        result = await aiService.generateResponse(query);
      } else if (model === "gemini") {
        const prompt = `User query: ${query}\n\nPlease provide a helpful response.`;
        result = await aiService.generateGeminiResponse(prompt);
      } else {
        const prompt = `User query: ${query}\n\nPlease provide a helpful response.`;
        result = await aiService.generateHuggingFaceResponse(prompt);
      }

      setResponse(result.content);
      setMetadata(result.metadata || {});

      // Log the interaction (in a real app, you'd use a real user ID)
      await aiService.logAIInteraction("demo-user", query, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>AI Service Demo</CardTitle>
          <CardDescription>
            Test the AI response generation service with different models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={model}
                onValueChange={(value) => setModel(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Smart Selection)</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="huggingface">Hugging Face</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">Your Query</Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your question here..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Response...
                </>
              ) : (
                "Generate Response"
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-gray-50 p-4 border">
                <h3 className="text-sm font-medium mb-2">AI Response:</h3>
                <div className="whitespace-pre-wrap text-sm">{response}</div>
              </div>

              {metadata && (
                <div className="rounded-md bg-gray-50 p-4 border">
                  <h3 className="text-sm font-medium mb-2">Metadata:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          This demo uses real API calls to AI models
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIServiceDemo;
