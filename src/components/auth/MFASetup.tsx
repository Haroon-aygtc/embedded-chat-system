import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { QrCode } from "lucide-react";

interface MFASetupProps {
  onComplete: (verified: boolean) => void;
  onCancel: () => void;
}

const MFASetup = ({ onComplete, onCancel }: MFASetupProps) => {
  const [step, setStep] = useState<"intro" | "qrcode" | "verify">("intro");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateMFASecret = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your backend API
      // to generate a secret and QR code URL
      // For demo purposes, we're simulating this
      setTimeout(() => {
        setSecret("EXAMPLESECRETHGFEDCBA");
        setQrCodeUrl(
          "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/ChatAdmin:user@example.com?secret=EXAMPLESECRETHGFEDCBA&issuer=ChatAdmin",
        );
        setStep("qrcode");
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate MFA secret. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would verify the code with your backend
      // For demo purposes, we're accepting any 6-digit code
      setTimeout(() => {
        if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
          toast({
            title: "Success",
            description: "MFA has been successfully set up.",
          });
          onComplete(true);
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Code",
            description: "Please enter a valid 6-digit code.",
          });
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify code. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enhance your account security with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "intro" && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Why use two-factor authentication?
              </h3>
              <p className="text-sm text-blue-700">
                Two-factor authentication adds an extra layer of security to
                your account. In addition to your password, you'll need a code
                from your authenticator app to sign in.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm">To set up two-factor authentication:</p>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>
                  Install an authenticator app like Google Authenticator or
                  Authy
                </li>
                <li>Scan the QR code we'll provide with your app</li>
                <li>Enter the verification code from your app</li>
              </ol>
            </div>
          </div>
        )}

        {step === "qrcode" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-gray-50">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-200 rounded-md">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Can't scan the QR code?</p>
              <p className="text-sm">
                Enter this code manually in your authenticator app:
              </p>
              <div className="p-2 bg-gray-100 rounded-md font-mono text-center select-all">
                {secret}
              </div>
            </div>
            <Button onClick={() => setStep("verify")} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        {step === "intro" && (
          <Button onClick={generateMFASecret} disabled={isLoading}>
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        )}
        {step === "verify" && (
          <Button
            onClick={verifyCode}
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MFASetup;
