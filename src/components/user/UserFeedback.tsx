import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, ThumbsUp, ThumbsDown, Send } from "lucide-react";

const feedbackFormSchema = z.object({
  feedbackType: z.enum(["suggestion", "bug", "question", "praise"]),
  message: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters" }),
  satisfaction: z.enum([
    "very_satisfied",
    "satisfied",
    "neutral",
    "dissatisfied",
    "very_dissatisfied",
  ]),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface UserFeedbackProps {
  onSubmit?: (data: FeedbackFormValues) => Promise<void>;
  onClose: () => void;
}

const UserFeedback = ({ onSubmit, onClose }: UserFeedbackProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackType: "suggestion",
      message: "",
      satisfaction: "neutral",
    },
  });

  const handleSubmit = async (data: FeedbackFormValues) => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Share Your Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your thoughts and experiences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="suggestion" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Suggestion
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="bug" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Bug Report
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="question" />
                        </FormControl>
                        <FormLabel className="font-normal">Question</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="praise" />
                        </FormControl>
                        <FormLabel className="font-normal">Praise</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please share your thoughts, ideas, or report issues..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific to help us understand your feedback better.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="satisfaction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Satisfaction</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex justify-between"
                    >
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem
                            value="very_dissatisfied"
                            className="sr-only"
                          />
                        </FormControl>
                        <ThumbsDown
                          className={`h-6 w-6 ${field.value === "very_dissatisfied" ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                          onClick={() =>
                            form.setValue("satisfaction", "very_dissatisfied")
                          }
                        />
                        <FormLabel className="text-xs font-normal">
                          Very Dissatisfied
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem
                            value="dissatisfied"
                            className="sr-only"
                          />
                        </FormControl>
                        <ThumbsDown
                          className={`h-5 w-5 ${field.value === "dissatisfied" ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`}
                          onClick={() =>
                            form.setValue("satisfaction", "dissatisfied")
                          }
                        />
                        <FormLabel className="text-xs font-normal">
                          Dissatisfied
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem value="neutral" className="sr-only" />
                        </FormControl>
                        <div
                          className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center"
                          onClick={() =>
                            form.setValue("satisfaction", "neutral")
                          }
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${field.value === "neutral" ? "bg-gray-500" : ""}`}
                          />
                        </div>
                        <FormLabel className="text-xs font-normal">
                          Neutral
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem
                            value="satisfied"
                            className="sr-only"
                          />
                        </FormControl>
                        <ThumbsUp
                          className={`h-5 w-5 ${field.value === "satisfied" ? "text-green-500 fill-green-500" : "text-muted-foreground"}`}
                          onClick={() =>
                            form.setValue("satisfaction", "satisfied")
                          }
                        />
                        <FormLabel className="text-xs font-normal">
                          Satisfied
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem
                            value="very_satisfied"
                            className="sr-only"
                          />
                        </FormControl>
                        <ThumbsUp
                          className={`h-6 w-6 ${field.value === "very_satisfied" ? "text-green-600 fill-green-600" : "text-muted-foreground"}`}
                          onClick={() =>
                            form.setValue("satisfaction", "very_satisfied")
                          }
                        />
                        <FormLabel className="text-xs font-normal">
                          Very Satisfied
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            "Submitting..."
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserFeedback;
