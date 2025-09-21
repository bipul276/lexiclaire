import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Upload, Shield, MessageSquare, FileText, CheckCircle, Lock, Zap, ArrowRight, Users, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LexiclaireLogo } from "./lexiclaire-logo";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onGetStarted, onLogin, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <LexiclaireLogo size={32} />
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#security" className="text-muted-foreground hover:text-primary transition-colors">
                Security
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </a>
            </nav>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="hover:text-primary" onClick={onLogin}>
                Log In
              </Button>
              <Button size="sm" className="shadow-lg hover:shadow-xl transition-all" onClick={onSignUp}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Two Column Layout */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-background via-card/50 to-secondary/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Tagline with accent color */}
              <div className="inline-block">
                <p className="text-lg text-secondary font-medium italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Justice begins with understanding.
                </p>
              </div>
              
              {/* Main headline with emphasized words */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Lexiclaire uses <span className="text-primary">AI</span> to translate 
                  <span className="text-destructive"> complex legal documents</span> into 
                  <span className="text-secondary"> simple, actionable insights</span>.
                </h1>
                <p className="text-xl text-muted-foreground mt-6 leading-relaxed">
                  Get <strong className="text-foreground">clarity in seconds</strong>, not hours. Perfect for freelancers, small business owners, and anyone who needs to understand legal documents without a lawyer.
                </p>
              </div>

              {/* CTA with trust elements */}
              <div className="space-y-6">
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary group"
                  onClick={onGetStarted}
                >
                  Analyze My Document
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                {/* Social proof */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="h-8 w-8 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border-2 border-card flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full border-2 border-card flex items-center justify-center">
                        <Star className="h-4 w-4 text-secondary" />
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      Trusted by <strong className="text-foreground">1,200+</strong> professionals
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="flex items-center space-x-8 pt-4 border-t border-border/50">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span className="text-sm">SSL Secured</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Lock className="h-4 w-4 text-secondary" />
                  <span className="text-sm">Data Encrypted</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-sm">GDPR Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1659355894099-b2c2b2884322?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGRvY3VtZW50JTIwYW5hbHlzaXMlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc1ODA0Nzg4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Legal document analysis technology"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-secondary/10"></div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 bg-card rounded-xl p-4 shadow-xl border border-secondary/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-secondary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">AI Analysis Complete</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-xl border border-primary/20">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Risk Detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-r from-background via-muted/10 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-4 py-2">
                ✨ Powered by Advanced AI
              </Badge>
            </div>
            <h2 className="mb-6 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Powerful <span className="text-primary">AI-driven</span> legal analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform complex legal jargon into clear, actionable insights with our advanced AI technology.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="lexiclaire-shadow hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Plain-Language Summary
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get instant summaries that break down complex legal documents into simple, understandable language.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-medium text-secondary">⚡ Instant Results</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lexiclaire-shadow hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-gradient-to-r from-destructive/10 to-orange-200/20 rounded-xl flex items-center justify-center mx-auto mb-6 border border-destructive/20">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="mb-4 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Risk Detection
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically identify potential risks, unusual clauses, and red flags in your legal documents.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-medium text-destructive">🛡️ Smart Protection</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lexiclaire-shadow hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-secondary/20">
                  <MessageSquare className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="mb-4 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Interactive Chat
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions about your document and get instant, detailed answers from our AI assistant.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-medium text-secondary">💬 AI Assistant</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-secondary/5 via-background to-primary/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-dots-pattern opacity-5"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                🚀 Simple Process
              </Badge>
            </div>
            <h2 className="mb-6 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              How it works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get <strong className="text-foreground">legal clarity</strong> in three simple steps
            </p>
          </div>
          
          {/* Step-by-step process with connecting lines */}
          <div className="relative max-w-6xl mx-auto">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-card">
                    <Upload className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">1</span>
                  </div>
                </div>
                <h3 className="mb-4 text-foreground text-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Upload
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Securely upload your legal document or import from cloud storage. 
                  <strong className="text-secondary"> Supports PDF, DOCX, and TXT files.</strong>
                </p>
              </div>
              
              <div className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 bg-gradient-to-r from-secondary to-secondary/80 rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-card">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                </div>
                <h3 className="mb-4 text-foreground text-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Analyze
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our <strong className="text-primary">advanced AI</strong> analyzes every clause and identifies 
                  key terms, risks, and obligations in <strong className="text-secondary">under 30 seconds</strong>.
                </p>
              </div>
              
              <div className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 bg-gradient-to-r from-success to-success/80 rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-card">
                    <CheckCircle className="h-8 w-8 text-success-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                </div>
                <h3 className="mb-4 text-foreground text-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Understand
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Review <strong className="text-success">plain-language summaries</strong>, ask questions, 
                  and make informed decisions with confidence.
                </p>
              </div>
            </div>
            
            {/* CTA after process */}
            <div className="text-center mt-16">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-lg hover:shadow-xl"
                onClick={onGetStarted}
              >
                Try It Now - It's Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-4 py-2">
                👥 Trusted by Professionals
              </Badge>
            </div>
            <h2 className="mb-6 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Join <span className="text-primary">1,200+</span> professionals who trust Lexiclaire
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users are saying about their experience with Lexiclaire
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="lexiclaire-shadow hover:shadow-xl transition-all border-0 bg-gradient-to-br from-card to-secondary/5">
              <CardContent className="p-8">
                <div className="flex items-start space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed italic">
                  "As a freelance consultant, I deal with contracts daily. Lexiclaire has saved me countless hours and helped me catch clauses that could have cost me thousands. The AI explanations are incredibly clear."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary">SM</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sarah Martinez</p>
                    <p className="text-sm text-muted-foreground">Business Consultant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lexiclaire-shadow hover:shadow-xl transition-all border-0 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8">
                <div className="flex items-start space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed italic">
                  "Before Lexiclaire, I was spending $300+ per hour on legal reviews for simple contracts. Now I understand exactly what I'm signing and only call my lawyer for complex issues. It's a game-changer."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
                    <span className="font-medium text-secondary">MK</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Michael Kim</p>
                    <p className="text-sm text-muted-foreground">Small Business Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-4 py-2">
                🔒 Enterprise Security
              </Badge>
            </div>
            <h2 className="mb-6 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your <span className="text-destructive">privacy</span> and <span className="text-primary">security</span> matter
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              We take document security seriously. Your sensitive legal documents are protected with 
              <strong className="text-foreground"> enterprise-grade security</strong>.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="lexiclaire-shadow hover:shadow-xl transition-all border-0 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-3 text-foreground text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                        End-to-End Encryption
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        All documents are encrypted during upload, processing, and storage using 
                        <strong className="text-primary"> industry-standard AES-256 encryption</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lexiclaire-shadow hover:shadow-xl transition-all border-0 bg-gradient-to-br from-card to-secondary/5">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-secondary/10 to-success/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-secondary/20">
                      <Zap className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-3 text-foreground text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Automatic Deletion
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Guest uploads are <strong className="text-secondary">automatically deleted after analysis</strong>. 
                        Registered users have full control over document retention.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-12">
              <div className="inline-flex items-center space-x-2 bg-card/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-border/50">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">SOC 2 Type II Compliant</span>
                <span className="text-muted-foreground">•</span>
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">GDPR Ready</span>
                <span className="text-muted-foreground">•</span>
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">Zero-Knowledge Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary/90 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-pattern opacity-10"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ready to understand your legal documents?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Join thousands of professionals who trust Lexiclaire to make sense of complex legal language. 
              Get started for free today.
            </p>
            <div className="space-y-4">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-4 text-lg bg-white text-primary border-white hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl transition-all"
                onClick={onGetStarted}
              >
                Start Your Free Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-primary-foreground/80">
                No credit card required • Instant results • 100% secure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <LexiclaireLogo size={24} />
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2025 Lexiclaire. Making legal documents understandable for everyone.
              <br />
              <span className="text-xs">Justice begins with understanding.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}