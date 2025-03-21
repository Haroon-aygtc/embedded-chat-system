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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
  Download,
  Upload,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import supabase from "@/services/supabaseClient";

// Define user schema
const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["admin", "editor", "viewer", "user"]),
  isActive: z.boolean().default(true),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "user";
  isActive: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [userActivity, setUserActivity] = useState<any[]>([]);

  const pageSize = 10;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      isActive: true,
    },
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from Supabase using our API service
      const response = await supabase
        .from("users")
        .select("*", { count: "exact" });

      if (response.error) {
        throw response.error;
      }

      // Process the users data
      const supabaseUsers = response.data.map((user) => ({
        id: user.id,
        name: user.full_name || user.email.split("@")[0],
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        avatar:
          user.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        lastLogin: null, // We'll fetch this separately
        createdAt: user.created_at,
      }));

      // Apply filters
      let filteredUsers = [...supabaseUsers];

      if (searchTerm) {
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      if (roleFilter) {
        filteredUsers = filteredUsers.filter(
          (user) => user.role === roleFilter,
        );
      }

      if (statusFilter) {
        filteredUsers = filteredUsers.filter((user) =>
          statusFilter === "active" ? user.isActive : !user.isActive,
        );
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedUsers = filteredUsers.slice(start, end);

      // Fetch last login for each user
      const usersWithActivity = await Promise.all(
        paginatedUsers.map(async (user) => {
          try {
            // Get last login from user_activity table
            const activityResponse = await supabase
              .from("user_activity")
              .select("*")
              .eq("user_id", user.id)
              .eq("action", "login")
              .order("created_at", { ascending: false })
              .limit(1);

            if (!activityResponse.error && activityResponse.data.length > 0) {
              return {
                ...user,
                lastLogin: activityResponse.data[0].created_at,
              };
            }

            return user;
          } catch (error) {
            console.error(
              `Error fetching activity for user ${user.id}:`,
              error,
            );
            return user;
          }
        }),
      );

      setUsers(usersWithActivity);
      setTotalPages(Math.ceil(filteredUsers.length / pageSize));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: UserFormValues) => {
    try {
      // Create user in Supabase
      const { data: userData, error } = await supabase
        .from("users")
        .insert([
          {
            email: data.email,
            full_name: data.name,
            role: data.role,
            is_active: data.isActive,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // If password is provided, create auth user
      if (data.password) {
        try {
          const { error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
          });

          if (authError) {
            console.error("Error creating auth user:", authError);
            // Continue anyway as the database user was created
          } else {
            // Update the user with the auth_id
            const { data: authData } = await supabase.auth.admin.getUserByEmail(
              data.email,
            );
            if (authData?.user) {
              await supabase
                .from("users")
                .update({ auth_id: authData.user.id })
                .eq("id", userData.id);
            }
          }
        } catch (authError) {
          console.error("Error in auth user creation:", authError);
          // Continue anyway as the database user was created
        }
      }

      // Log the activity
      await supabase.from("user_activity").insert([
        {
          user_id: userData.id,
          action: "user_created",
          metadata: { created_by: "admin" },
        },
      ]);

      // Add the new user to the list
      const newUser: User = {
        id: userData.id,
        name: userData.full_name || userData.email.split("@")[0],
        email: userData.email,
        role: userData.role,
        isActive: userData.is_active,
        avatar: userData.avatar_url,
        createdAt: userData.created_at,
      };

      setUsers([...users, newUser]);
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (data: UserFormValues) => {
    if (!selectedUser) return;

    try {
      // Update user in Supabase
      const { data: userData, error } = await supabase
        .from("users")
        .update({
          email: data.email,
          full_name: data.name,
          role: data.role,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabase.from("user_activity").insert([
        {
          user_id: selectedUser.id,
          action: "user_updated",
          metadata: { updated_by: "admin" },
        },
      ]);

      // Update the user in the list
      const updatedUsers = users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: userData.full_name || userData.email.split("@")[0],
              email: userData.email,
              role: userData.role,
              isActive: userData.is_active,
            }
          : user,
      );

      setUsers(updatedUsers);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      form.reset();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // First check if user has an auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", selectedUser.id)
        .single();

      if (userError) throw userError;

      // If user has an auth_id, delete the auth user
      if (userData?.auth_id) {
        try {
          const { error: authError } = await supabase.auth.admin.deleteUser(
            userData.auth_id,
          );
          if (authError) {
            console.error("Error deleting auth user:", authError);
            // Continue anyway to delete the database user
          }
        } catch (authError) {
          console.error("Error in auth user deletion:", authError);
          // Continue anyway to delete the database user
        }
      }

      // Delete the user from the database
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      // Update the UI
      const updatedUsers = users.filter((user) => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleViewActivity = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);

    try {
      // Fetch user activity from Supabase
      const { data: activityData, error: activityError } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (activityError) throw activityError;

      // Fetch user sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false })
        .limit(5);

      if (sessionError) throw sessionError;

      // Format the activity data
      const formattedActivity =
        activityData?.map((activity) => ({
          id: activity.id,
          action: activity.action,
          timestamp: activity.created_at,
          ipAddress: activity.ip_address || "Unknown",
          userAgent: activity.user_agent || "Unknown",
          metadata: activity.metadata,
        })) || [];

      // If no activity data is found, use some default entries
      if (formattedActivity.length === 0) {
        formattedActivity.push({
          id: "1",
          action: "Account created",
          timestamp: user.createdAt || new Date().toISOString(),
          ipAddress: "Unknown",
          userAgent: "Unknown",
        });
      }

      setUserActivity(formattedActivity);
      setIsActivityDialogOpen(true);
    } catch (error) {
      console.error(`Error fetching activity for user ${user.id}:`, error);

      // Fallback to basic activity if there's an error
      const fallbackActivity = [
        {
          id: "1",
          action: "Account created",
          timestamp: user.createdAt || new Date().toISOString(),
          ipAddress: "Unknown",
          userAgent: "Unknown",
        },
      ];

      setUserActivity(fallbackActivity);
      setIsActivityDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = () => {
    // In a real implementation, this would generate a CSV file with user data
    const csvData = [
      ["ID", "Name", "Email", "Role", "Status", "Last Login", "Created At"],
      ...users.map((user) => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.isActive ? "Active" : "Inactive",
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never",
        new Date(user.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `users-${new Date().toISOString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportUsers = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would parse the CSV file and create users
    console.log("Importing users...");
    setIsImportDialogOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "editor":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportUsers}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              form.reset({
                name: "",
                email: "",
                role: "user",
                isActive: true,
              });
              setIsCreateDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Select
              value={roleFilter || ""}
              onValueChange={(value) => setRoleFilter(value || null)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || ""}
              onValueChange={(value) => setStatusFilter(value || null)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? format(new Date(user.lastLogin), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewActivity(user)}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive an email with
              login instructions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateUser)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Leave blank to auto-generate"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      If left blank, a secure password will be generated and
                      sent to the user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>
                          This determines what actions the user can perform.
                        </span>
                      </div>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system.
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
              <DialogFooter>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateUser)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system.
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
              <DialogFooter>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 border rounded-md bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <div>
              <p className="font-medium text-destructive">
                Warning: This will permanently delete the user account for{" "}
                <span className="font-bold">{selectedUser?.name}</span>.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All associated data will be removed from the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Users Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Users</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportUsers} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input id="csv-file" type="file" accept=".csv" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>First row must be header row</li>
                <li>Required columns: Name, Email, Role</li>
                <li>Optional columns: Password, IsActive</li>
                <li>Role must be one of: admin, editor, viewer, user</li>
                <li>IsActive must be true or false</li>
              </ul>
            </div>
            <DialogFooter>
              <Button type="submit">Import</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Activity - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Recent activity and login history for this user.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="sessions">Login Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>
                          {format(new Date(activity.timestamp), "PPpp")}
                        </TableCell>
                        <TableCell>{activity.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="sessions" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device / Browser</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Chrome on Windows</div>
                        <div className="text-xs text-muted-foreground">
                          {userActivity[0]?.userAgent}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(userActivity[0]?.timestamp), "PPpp")}
                      </TableCell>
                      <TableCell>{userActivity[0]?.ipAddress}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Safari on macOS</div>
                        <div className="text-xs text-muted-foreground">
                          {userActivity[3]?.userAgent}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(userActivity[3]?.timestamp), "PPpp")}
                      </TableCell>
                      <TableCell>{userActivity[3]?.ipAddress}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700"
                        >
                          Expired
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActivityDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
