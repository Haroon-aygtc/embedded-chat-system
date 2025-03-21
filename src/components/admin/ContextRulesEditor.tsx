import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, AlertCircle, Info, Edit, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { contextRulesApi } from "@/services/apiService";
import { ContextRule, ResponseFilter } from "@/types/contextRules";

// Define the schema for context rules
const contextRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  isActive: z.boolean().default(true),
  contextType: z.enum(["business", "general"]),
  keywords: z
    .array(z.string())
    .min(1, { message: "At least one keyword is required" }),
  excludedTopics: z.array(z.string()).optional(),
  promptTemplate: z
    .string()
    .min(10, { message: "Prompt template must be at least 10 characters" }),
  responseFilters: z
    .array(
      z.object({
        type: z.enum(["keyword", "regex", "semantic"]),
        value: z.string(),
        action: z.enum(["block", "flag", "modify"]),
      }),
    )
    .optional(),
});

type FormContextRule = z.infer<typeof contextRuleSchema>;

// Sample query for the example section
const sampleUserQuery = "Tell me about visa services in Dubai";

const ContextRulesEditor = () => {
  const [activeTab, setActiveTab] = useState("rules-list");
  const [rules, setRules] = useState<ContextRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRule, setSelectedRule] = useState<ContextRule | null>(null);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingExcludedTopic, setIsAddingExcludedTopic] = useState(false);
  const [newExcludedTopic, setNewExcludedTopic] = useState("");
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<ResponseFilter>({
    type: "keyword",
    value: "",
    action: "block",
  });
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<{ result: string; matches: string[] } | null>(null);
  const [isTestingRule, setIsTestingRule] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormContextRule>({
    resolver: zodResolver(contextRuleSchema),
    defaultValues: {
      isActive: true,
      contextType: "business",
      keywords: [],
      excludedTopics: [],
      responseFilters: [],
    },
  });

  // Fetch rules on component mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const data =