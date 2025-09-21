import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { FileText, Eye, EyeOff, ArrowLeft, Check, X, Loader2, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LexiclaireWordmark } from "./lexiclaire-logo";
import { registerUser } from "../services/api";
import type { AuthResponse } from "../services/api";

interface SignUpProps {
  onBack: () => void;
  onLogin: () => void;
  onSignUpSuccess: (response: AuthResponse) => void;
}

export function SignUp({ onBack, onLogin, onSignUpSuccess }: SignUpProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
    { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
  ];

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isFormValid = formData.firstName && formData.lastName && formData.email &&
                      passwordRequirements.every(req => req.met) && passwordsMatch && agreeToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await registerUser(registrationData);
      onSignUpSuccess(response);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "An unknown error occurred during registration.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary/5 via-primary/5 to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-pattern opacity-10"></div>
        <div className="flex items-center justify-center p-12 relative z-10">
          <div className="max-w-md text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-block p-4 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <LexiclaireWordmark size="lg" className="justify-center mb-4" />
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Start your journey
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                What you'll get with Lexiclaire:
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg">
                  <div className="h-6 w-6 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="h-3 w-3 text-secondary" /></div>
                  <div>
                    <p className="font-medium text-foreground">Plain-Language Analysis</p>
                    <p className="text-sm text-muted-foreground">Transform complex legal jargon into clear, understandable insights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg">
                  <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="h-3 w-3 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">Risk Detection</p>
                    <p className="text-sm text-muted-foreground">Automatically identify potential risks and red flags</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg">
                  <div className="h-6 w-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="h-3 w-3 text-success" /></div>
                  <div>
                    <p className="font-medium text-foreground">Document History</p>
                    <p className="text-sm text-muted-foreground">Save and organize all your analyzed documents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 self-start">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
            <div className="mb-6"><LexiclaireWordmark size="lg" className="justify-center" /></div>
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Create your account</h1>
            <p className="text-muted-foreground">Join thousands of professionals who trust Lexiclaire</p>
          </div>

          <Card className="lexiclaire-shadow border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Get started for free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" type="text" placeholder="John" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  {formData.password && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-foreground">Password requirements:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordRequirements.map((req, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            {req.met ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground" />}
                            <span className={`text-xs ${req.met ? 'text-success' : 'text-muted-foreground'}`}>{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center space-x-2 mt-2">
                      {passwordsMatch ? (<><Check className="h-3 w-3 text-success" /><span className="text-xs text-success">Passwords match</span></>) : (<><X className="h-3 w-3 text-destructive" /><span className="text-xs text-destructive">Passwords don't match</span></>)}
                    </div>
                  )}
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked === true)} className="mt-0.5" />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">I agree to the <Button variant="link" className="text-sm px-0 h-auto">Terms of Service</Button> and <Button variant="link" className="text-sm px-0 h-auto">Privacy Policy</Button></Label>
                </div>
                <Button type="submit" className="w-full" disabled={!isFormValid || isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full"> {/* Google SVG */} Google</Button>
                <Button variant="outline" className="w-full"> {/* X SVG */} X</Button>
              </div>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Button variant="link" onClick={onLogin} className="px-0">Sign in</Button>
              </div>
            </CardContent>
          </Card>
          <div className="text-center">
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-3 py-1">✨ Free forever • No credit card required</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

