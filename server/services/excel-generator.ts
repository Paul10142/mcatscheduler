import ExcelJS from "exceljs";
import type { ScheduleDay } from "../../client/src/lib/study-plan-types";
import type { InsertStudyPlan } from "@shared/schema";

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet("MCAT Study Plan");
    this.setupWorksheet();
  }

  private setupWorksheet(): void {
    // Set column widths
    this.worksheet.columns = [
      { header: "Days Left", key: "daysLeft", width: 12 },
      { header: "Day", key: "day", width: 8 },
      { header: "Day of Week", key: "dayOfWeek", width: 12 },
      { header: "Practice Questions", key: "practiceQuestions", width: 40 },
      { header: "CARS", key: "cars", width: 30 },
      { header: "Other/Review", key: "review", width: 20 },
    ];

    // Style header row
    const headerRow = this.worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6F0FF" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    // Freeze header row
    this.worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  async generateExcel(schedule: ScheduleDay[], studyPlan: InsertStudyPlan): Promise<Buffer> {
    // Add data rows
    schedule.forEach((day, index) => {
      const rowNumber = index + 2; // Start from row 2 (after header)
      const row = this.worksheet.addRow({
        daysLeft: day.daysLeft,
        day: day.date,
        dayOfWeek: day.dayOfWeek,
        practiceQuestions: day.practiceQuestions || "",
        cars: day.cars || "",
        review: day.review || "",
      });

      // Apply conditional formatting based on day type
      if (day.isPracticeTest) {
        // Practice test days - yellow background
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
        // Make practice test text red and bold
        row.getCell("practiceQuestions").font = { bold: true, color: { argb: "FFFF0000" } };
      } else if (day.isReviewDay) {
        // Review days - light orange background
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCC99" },
        };
        row.getCell("practiceQuestions").font = { color: { argb: "FFFF6600" } };
      } else if (day.isBlackout) {
        // Blackout days - gray background
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" },
        };
      } else if (day.daysLeft <= studyPlan.taperDays) {
        // Taper period - light blue background
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6F3FF" },
        };
      }

      // Color code different types of content
      if (day.practiceQuestions && !day.isPracticeTest && !day.isReviewDay) {
        row.getCell("practiceQuestions").font = { color: { argb: "FF0066CC" } };
      }
      if (day.cars) {
        row.getCell("cars").font = { color: { argb: "FF009900" } };
      }
      if (day.review) {
        row.getCell("review").font = { color: { argb: "FF9900CC" } };
      }

      // Add borders to all cells
      ["A", "B", "C", "D", "E", "F"].forEach(col => {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });

      // Center align specific columns
      row.getCell("daysLeft").alignment = { horizontal: "center", vertical: "middle" };
      row.getCell("day").alignment = { horizontal: "center", vertical: "middle" };
      row.getCell("dayOfWeek").alignment = { horizontal: "center", vertical: "middle" };
    });

    // Add summary information at the top
    this.addSummarySection(schedule, studyPlan);

    // Auto-fit row heights
    this.worksheet.eachRow((row) => {
      row.height = Math.max(20, row.height || 0);
    });

    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }

  private addSummarySection(schedule: ScheduleDay[], studyPlan: InsertStudyPlan): void {
    // Insert summary rows at the top (above the schedule)
    this.worksheet.insertRow(1, []);
    this.worksheet.insertRow(1, []);
    this.worksheet.insertRow(1, []);
    this.worksheet.insertRow(1, []);
    this.worksheet.insertRow(1, []);

    // Add title
    const titleRow = this.worksheet.getRow(1);
    titleRow.getCell(1).value = "MCAT Study Plan";
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.height = 25;

    // Add test date
    const testDateRow = this.worksheet.getRow(2);
    testDateRow.getCell(1).value = `Test Date: ${studyPlan.testDate}`;
    testDateRow.getCell(1).font = { size: 12, bold: true };

    // Add study hours
    const hoursRow = this.worksheet.getRow(3);
    hoursRow.getCell(1).value = `Study Hours: ${studyPlan.weekdayHours}h weekdays, ${studyPlan.weekendHours}h weekends`;
    hoursRow.getCell(1).font = { size: 11 };

    // Add statistics
    const practiceTestCount = schedule.filter(day => day.isPracticeTest).length;
    const statsRow = this.worksheet.getRow(4);
    statsRow.getCell(1).value = `Schedule: ${schedule.length} total days, ${practiceTestCount} practice tests`;
    statsRow.getCell(1).font = { size: 11 };

    // Add empty row for spacing
    this.worksheet.getRow(5);
  }

  async getBuffer(): Promise<Buffer> {
    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }
}
