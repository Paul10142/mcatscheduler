import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudyPlanSchema, type InsertStudyPlan } from "@shared/schema";
import { Calendar, Clock, FileText, Ban, Settings, Sparkles, Eye, Download, Plus, Trash2, Lightbulb, Info } from "lucide-react";
import type { StudyPlanPreview, BlackoutDate } from "@/lib/study-plan-types";

const practiceTestDayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function StudyPlanForm() {
  const { toast } = useToast();
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [preview, setPreview] = useState<StudyPlanPreview | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const form = useForm<InsertStudyPlan>({
    resolver: zodResolver(insertStudyPlanSchema),
    defaultValues: {
      testDate: "",
      weekdayHours: 4,
      weekendHours: 8,
      practiceTestDays: [],
      blackoutDates: [],
      taperDays: 3,
      outputFormat: "excel",
    },
  });

  const testDate = form.watch("testDate");

  // Calculate days left when test date changes
  const calculateDaysLeft = (dateStr: string) => {
    if (!dateStr) return 0;
    const testDate = new Date(dateStr);
    const today = new Date();
    const timeDiff = testDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const daysLeft = calculateDaysLeft(testDate);

  const generatePlanMutation = useMutation({
    mutationFn: async (data: InsertStudyPlan) => {
      const response = await apiRequest("POST", "/api/study-plans/generate", {
        ...data,
        blackoutDates,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPreview(data.preview);
      setDownloadUrl(data.downloadUrl);
      toast({
        title: "Study plan generated successfully!",
        description: "Your personalized MCAT study schedule is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error generating study plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!downloadUrl) throw new Error("No download URL available");
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mcat-study-plan-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "Your Excel study plan is being downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudyPlan) => {
    generatePlanMutation.mutate({
      ...data,
      blackoutDates,
    });
  };

  const addBlackoutDate = () => {
    setBlackoutDates([...blackoutDates, { date: "", reason: "" }]);
  };

  const removeBlackoutDate = (index: number) => {
    setBlackoutDates(blackoutDates.filter((_, i) => i !== index));
  };

  const updateBlackoutDate = (index: number, field: keyof BlackoutDate, value: string) => {
    const updated = [...blackoutDates];
    updated[index] = { ...updated[index], [field]: value };
    setBlackoutDates(updated);
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Test Date Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 rounded-lg p-2 mr-3">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Test Date Information</h3>
                <p className="text-sm text-muted-foreground">When is your MCAT scheduled?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="testDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MCAT Test Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={minDate}
                        data-testid="input-testdate"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Select your official MCAT test date</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Days Until Test</Label>
                <Input
                  value={daysLeft}
                  readOnly
                  className="bg-muted"
                  data-testid="text-daysleft"
                />
                <p className="text-xs text-muted-foreground mt-1">Automatically calculated from test date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Hours Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 rounded-lg p-2 mr-3">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Daily Study Hours</h3>
                <p className="text-sm text-muted-foreground">How many hours can you dedicate each day?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="weekdayHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekday Hours (Mon-Fri)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="16"
                          step="0.5"
                          placeholder="e.g., 4"
                          data-testid="input-weekdayhours"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                        <span className="absolute right-3 top-2 text-muted-foreground text-sm">hours</span>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">1-16 hours per weekday</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weekendHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekend Hours (Sat-Sun)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="16"
                          step="0.5"
                          placeholder="e.g., 8"
                          data-testid="input-weekendhours"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                        <span className="absolute right-3 top-2 text-muted-foreground text-sm">hours</span>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">1-16 hours per weekend day</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Practice Test Preferences */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 rounded-lg p-2 mr-3">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Practice Test Schedule</h3>
                <p className="text-sm text-muted-foreground">When do you prefer to take full-length practice tests?</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="practiceTestDays"
                render={() => (
                  <FormItem>
                    <FormLabel>Preferred Practice Test Days</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {practiceTestDayOptions.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="practiceTestDays"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), day.value]
                                      : (field.value || []).filter((value) => value !== day.value);
                                    field.onChange(updatedValue);
                                  }}
                                  data-testid={`checkbox-practicetest-${day.value}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select all days when you can take 7.5-hour practice exams</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Practice Test Strategy</h4>
                    <p className="text-xs text-muted-foreground">
                      Practice tests will be automatically scheduled on your selected days, with review sessions 
                      placed the following day. Each practice test requires approximately 7.5 hours including breaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blackout Dates Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 rounded-lg p-2 mr-3">
                <Ban className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Blackout Dates</h3>
                <p className="text-sm text-muted-foreground">Days when you cannot study (vacations, holidays, etc.)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                {blackoutDates.map((blackoutDate, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      type="date"
                      value={blackoutDate.date}
                      onChange={(e) => updateBlackoutDate(index, "date", e.target.value)}
                      className="flex-1"
                      data-testid={`input-blackoutdate-${index}`}
                    />
                    <Input
                      type="text"
                      placeholder="Reason (optional)"
                      value={blackoutDate.reason || ""}
                      onChange={(e) => updateBlackoutDate(index, "reason", e.target.value)}
                      className="flex-1"
                      data-testid={`input-blackoutreason-${index}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlackoutDate(index)}
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`button-removeblackout-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={addBlackoutDate}
                className="w-full"
                data-testid="button-addblackout"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Blackout Date
              </Button>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Blackout Date Tips</h4>
                    <p className="text-xs text-muted-foreground">
                      The algorithm will automatically skip these dates and redistribute study materials to other days. 
                      Consider adding major holidays, travel dates, or other committed days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 rounded-lg p-2 mr-3">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Advanced Options</h3>
                <p className="text-sm text-muted-foreground">Fine-tune your study plan preferences</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="taperDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taper Period (Final Days)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-taperdays">
                          <SelectValue placeholder="Select taper days" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2">2 days</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="4">4 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Reduced study intensity before test day</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="outputFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-outputformat">
                          <SelectValue placeholder="Select output format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="google-sheets">Google Sheets (Copy)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose your preferred output format</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Button
                type="submit"
                size="lg"
                disabled={generatePlanMutation.isPending}
                className="px-8 py-3"
                data-testid="button-generate"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generatePlanMutation.isPending ? "Generating..." : "Generate My Study Plan"}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-2">
                This will create a customized Excel file with your complete study schedule
              </p>
              
              {generatePlanMutation.isPending && (
                <div className="mt-4">
                  <div className="inline-flex items-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Generating your personalized study plan...</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {preview && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 rounded-lg p-2 mr-3">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Study Plan Preview</h3>
                  <p className="text-sm text-muted-foreground">Sample of your generated schedule</p>
                </div>
              </div>
              
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-muted rounded-lg p-3">
                  <div className="font-medium text-foreground">Total Days</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-totaldays">{preview.totalDays}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="font-medium text-foreground">Practice Tests</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-practicetests">{preview.practiceTestCount}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="font-medium text-foreground">Total Study Hours</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-studyhours">{preview.totalStudyHours}</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-foreground border-r border-border">Days Left</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground border-r border-border">Day</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground border-r border-border">Day of Week</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground border-r border-border">Practice Questions</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground border-r border-border">CARS</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Other/Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.schedule.slice(0, 10).map((day, index) => (
                      <tr key={index} className={`hover:bg-muted/50 ${day.isPracticeTest ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                        <td className="px-4 py-3 border-r border-border font-medium" data-testid={`row-daysleft-${index}`}>{day.daysLeft}</td>
                        <td className="px-4 py-3 border-r border-border" data-testid={`row-date-${index}`}>{day.date}</td>
                        <td className="px-4 py-3 border-r border-border" data-testid={`row-dayofweek-${index}`}>{day.dayOfWeek}</td>
                        <td className={`px-4 py-3 border-r border-border ${day.isPracticeTest ? 'text-red-600 font-medium' : day.isReviewDay ? 'text-orange-600' : 'text-blue-600'}`} data-testid={`row-practice-${index}`}>
                          {day.practiceQuestions || ''}
                        </td>
                        <td className="px-4 py-3 border-r border-border text-green-600" data-testid={`row-cars-${index}`}>{day.cars || ''}</td>
                        <td className="px-4 py-3 text-purple-600" data-testid={`row-review-${index}`}>{day.review || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-muted-foreground">Practice Questions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span className="text-muted-foreground">Practice Test</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-orange-600 rounded"></div>
                    <span className="text-muted-foreground">Review Day</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-download"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadMutation.isPending ? "Downloading..." : "Download Excel File"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </form>
    </Form>
  );
}
