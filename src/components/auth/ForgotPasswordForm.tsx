import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestPasswordReset(email);
    setSubmitted(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {submitted ? (
            <div className="text-center py-4">
              <Alert className="mb-4">
                <AlertDescription>
                  If an account exists with the email {email}, you will receive
                  a password reset link shortly.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/login")}
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      clearError();
                      setEmail(e.target.value);
                    }}
                    required
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                    <Mail size={16} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
