import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save, User } from "lucide-react";

const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z
    .string()
    .max(160, { message: "Bio must not exceed 160 characters" })
    .optional(),
  avatarUrl: z.string().optional(),
  notifyOnMessage: z.boolean().default(true),
  notifyOnMention: z.boolean().default(true),
  emailDigest: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  initialData?: Partial<ProfileFormValues>;
  onSubmit?: (data: ProfileFormValues) => Promise<void>;
  onCancel?: () => void;
}

const UserProfileForm = ({
  initialData = {},
  onSubmit,
  onCancel,
}: UserProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultValues: Partial<ProfileFormValues> = {
    fullName: "",
    email: "",
    bio: "",
    avatarUrl: "",
    notifyOnMessage: true,
    notifyOnMention: true,
    emailDigest: false,
    ...initialData,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    // In a real implementation, this would open a file picker
    // and upload the selected image
    const mockAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    form.setValue("avatarUrl", mockAvatarUrl);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your account information and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 pt-6"
            >
              <TabsContent value="profile" className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={form.watch("avatarUrl")} />
                    <AvatarFallback className="text-lg">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarUpload}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Change Avatar
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little about yourself"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description for your profile. Max 160 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <FormField
                  control={form.control}
                  name="notifyOnMessage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Chat Messages
                        </FormLabel>
                        <FormDescription>
                          Receive notifications when you get new chat messages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyOnMention"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Mentions</FormLabel>
                        <FormDescription>
                          Receive notifications when you are mentioned
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailDigest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Email Digest
                        </FormLabel>
                        <FormDescription>
                          Receive a weekly email digest of your activity
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <div className="flex justify-end space-x-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserProfileForm;
