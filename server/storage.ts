import { type User, type InsertUser, type StudyPlan, type InsertStudyPlan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getStudyPlan(id: string): Promise<StudyPlan | undefined>;
  createStudyPlan(studyPlan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private studyPlans: Map<string, StudyPlan>;

  constructor() {
    this.users = new Map();
    this.studyPlans = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getStudyPlan(id: string): Promise<StudyPlan | undefined> {
    return this.studyPlans.get(id);
  }

  async createStudyPlan(insertStudyPlan: InsertStudyPlan): Promise<StudyPlan> {
    const id = randomUUID();
    const studyPlan: StudyPlan = {
      ...insertStudyPlan,
      id,
      schedule: null,
      createdAt: new Date(),
    };
    this.studyPlans.set(id, studyPlan);
    return studyPlan;
  }

  async updateStudyPlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan | undefined> {
    const existing = this.studyPlans.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.studyPlans.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
