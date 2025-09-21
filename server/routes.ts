import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudyPlanSchema } from "@shared/schema";
import { ScheduleAlgorithm } from "./services/schedule-algorithm";
import { ExcelGenerator } from "./services/excel-generator";
import { randomUUID } from "crypto";

// In-memory storage for generated files (in production, use cloud storage)
const fileStorage = new Map<string, Buffer>();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate study plan
  app.post("/api/study-plans/generate", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertStudyPlanSchema.parse(req.body);
      
      // Validate test date is in the future
      const testDate = new Date(validatedData.testDate);
      const today = new Date();
      if (testDate <= today) {
        return res.status(400).json({ 
          message: "Test date must be in the future" 
        });
      }

      // Validate that at least one practice test day is selected
      if (validatedData.practiceTestDays.length === 0) {
        return res.status(400).json({ 
          message: "Please select at least one practice test day" 
        });
      }

      // Generate schedule using algorithm
      const algorithm = new ScheduleAlgorithm(validatedData);
      const schedule = algorithm.generateSchedule();
      
      // Get preview statistics
      const preview = algorithm.getPreviewStats();

      // Store the study plan
      const studyPlan = await storage.createStudyPlan(validatedData);
      await storage.updateStudyPlan(studyPlan.id, { schedule });

      // Generate Excel file
      const excelGenerator = new ExcelGenerator();
      const excelBuffer = await excelGenerator.generateExcel(schedule, validatedData);
      
      // Store the file with a unique ID
      const fileId = randomUUID();
      fileStorage.set(fileId, excelBuffer);

      // Set file to expire after 1 hour
      setTimeout(() => {
        fileStorage.delete(fileId);
      }, 60 * 60 * 1000);

      res.json({
        success: true,
        studyPlanId: studyPlan.id,
        preview,
        downloadUrl: `/api/files/download/${fileId}`,
      });

    } catch (error: any) {
      console.error("Error generating study plan:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "Failed to generate study plan" 
      });
    }
  });

  // Download generated Excel file
  app.get("/api/files/download/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const fileBuffer = fileStorage.get(fileId);
      
      if (!fileBuffer) {
        return res.status(404).json({ 
          message: "File not found or expired" 
        });
      }

      const filename = `mcat-study-plan-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      res.send(fileBuffer);

    } catch (error: any) {
      console.error("Error downloading file:", error);
      res.status(500).json({ 
        message: "Failed to download file" 
      });
    }
  });

  // Get study plan by ID
  app.get("/api/study-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const studyPlan = await storage.getStudyPlan(id);
      
      if (!studyPlan) {
        return res.status(404).json({ 
          message: "Study plan not found" 
        });
      }

      res.json(studyPlan);

    } catch (error: any) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ 
        message: "Failed to fetch study plan" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
