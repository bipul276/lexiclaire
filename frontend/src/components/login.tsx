import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { FileText, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LexiclaireLogo } from "../components/lexiclaire-logo";
import { loginUser } from "../services/api";
import type { AuthResponse } from "../services/api";

interface LoginProps {
  onBack: () => void;
  onSignUp: () => void;
  onLoginSuccess: (response: AuthResponse) => void;
}

export function Login({ onBack, onSignUp, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      onLoginSuccess(response);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "An unknown error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 self-start">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="mb-6"><LexiclaireLogo size={40} textClassName="text-3xl" /></div>
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Welcome back
            </h1>
            <p className="text-muted-foreground">Sign in to continue analyzing your legal documents</p>
          </div>

          <Card className="lexiclaire-shadow border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sign in to your account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                  <Button variant="link" className="text-sm px-0">Forgot password?</Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full"> {/* Google SVG */} Google</Button>
                <Button variant="outline" className="w-full"> {/* X SVG */} X</Button>
              </div>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Button variant="link" onClick={onSignUp} className="px-0">Sign up for free</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="flex items-center justify-center p-12 relative z-10">
            <div className="max-w-md text-center space-y-8">
                <div className="relative">
                    <ImageWithFallback
                        src="https://images.unsplash.com/photo-1739298061757-7a3339cee982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHRlYW18ZW58MXx8fHwxNzU4MDQ3ODkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        alt="Professional business team"
                        className="w-80 h-64 object-cover rounded-2xl shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-secondary/10 rounded-2xl"></div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Trusted by professionals worldwide
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Join <strong className="text-primary">1,200+</strong> lawyers, business owners, and freelancers who use Lexiclaire to understand legal documents instantly.
                    </p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                    <p className="text-foreground italic mb-4">
                        "Lexiclaire has transformed how I review contracts. What used to take hours now takes minutes, and I catch details I might have missed before."
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                            <span className="font-medium text-primary">JD</span>
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-foreground">Jennifer Davis</p>
                            <p className="text-sm text-muted-foreground">Legal Consultant</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

