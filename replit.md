# MCAT Study Plan Generator

## Overview

This is a full-stack web application that generates customized MCAT study plan spreadsheets. The app allows students to input their test date, study hours, practice test preferences, and blackout days to receive a professionally formatted Excel file with a deterministic, day-by-day study schedule. Built by an expert MCAT tutor, it follows proven preparation strategies and ensures consistent, reliable output every time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: React Hook Form for form handling with Zod validation, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: Custom design system with CSS variables for theming, responsive design patterns

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling and request logging
- **File Generation**: ExcelJS for creating formatted Excel files with templates, conditional formatting, and professional styling
- **Algorithm**: Deterministic scheduling algorithm that places practice tests, review sessions, and study materials based on available time and constraints

### Data Storage Solutions
- **Development**: In-memory storage using Maps for rapid prototyping
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions for users and study plans
- **Data Models**: Study plans include test dates, study hours, practice test preferences, blackout dates, and generated schedules
- **File Storage**: Temporary in-memory buffer storage for generated Excel files (production would use cloud storage)

### Authentication and Authorization
- **Current State**: Basic user schema defined but authentication not yet implemented
- **Planned**: Session-based authentication with user management capabilities
- **Data Protection**: Input validation with Zod schemas and sanitization

### External Dependencies
- **Database**: Neon PostgreSQL (serverless) for production data persistence
- **UI Components**: Radix UI for accessible, unstyled component primitives
- **Form Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date manipulation and formatting
- **File Generation**: ExcelJS for creating formatted spreadsheet files
- **Development**: Vite with React plugin, TSX for TypeScript compilation
- **Styling**: Tailwind CSS with custom design tokens and responsive utilities