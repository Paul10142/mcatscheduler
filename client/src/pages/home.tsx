import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Calendar, TrendingUp, FileSpreadsheet, Shield, CheckCircle } from "lucide-react";
import StudyPlanForm from "@/components/study-plan-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">MCAT Study Plan Generator</h1>
                <p className="text-sm text-muted-foreground">Create your personalized study schedule</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Expert MCAT Tutor Platform
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Intro Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Generate Your Custom MCAT Study Plan</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Based on your test date, study hours, and preferences, we'll create a personalized Excel study schedule 
                  that follows proven MCAT preparation strategies used by top tutors.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Smart Scheduling</h3>
                  <p className="text-sm text-muted-foreground">Automatically places practice tests and review sessions</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">AAMC Priority</h3>
                  <p className="text-sm text-muted-foreground">Follows optimal material sequence for maximum results</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Professional Output</h3>
                  <p className="text-sm text-muted-foreground">Formatted Excel file ready to use immediately</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Plan Form */}
          <StudyPlanForm />

          {/* Footer */}
          <footer className="mt-12 border-t border-border pt-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-primary text-primary-foreground rounded-lg p-2">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-semibold text-foreground">Expert MCAT Tutor Platform</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                This study plan generator uses proven strategies from expert MCAT tutors
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Deterministic Algorithm</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Input Validation</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>Professional Formatting</span>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
