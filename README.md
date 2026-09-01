# AI Career Match (AI Resume Matcher)

An intelligent, full-stack web application designed to bridge the gap between job seekers and employers by leveraging advanced AI to analyze resumes, match them against specific job descriptions, calculate accurate compatibility scores, identify skill gaps, and generate tailored recommendations.

## 🚀 Live Demo & Access
- **Production URL:** https://ai-resume-matchers.lovable.app
  
---

## 📌 Project Overview
In today's competitive job market, tailoring a resume for every job application is a time-consuming challenge. **AI Career Match** automates this process. By processing uploaded resumes (PDF/Text/Docs) and parsing target job descriptions, the system utilizes generative AI to evaluate candidate suitability, provide a detailed percentage match score, highlight missing skills, and offer actionable insights to improve profile strength.

---

## ✨ Key Features
- **Smart Resume & Job Description Analysis:** Seamlessly processes resume content alongside job postings to evaluate alignment.
- **Dynamic Match Scoring:** Generates an accurate percentage score indicating how well a resume fits a specific role.
- **Skill Gap Identification:** Pinpoints missing keywords, technologies, or qualifications required by the employer.
- **AI-Powered Recommendations:** Provides structured feedback and suggestions to optimize the resume for better ATS (Applicant Tracking System) performance.
- **Analysis History Dashboard:** Tracks previously analyzed resumes, scores, and unique job targets for easy progress monitoring.
- **Secure Authentication & Data Storage:** Utilizes robust database infrastructure to ensure user data privacy and secure session handling.

---

## 🛠️ Technology Stack

### **Frontend:**
- **React & Vite:** For building a fast, modern, and reactive single-page application.
- **TypeScript:** Ensuring type safety and scalable code architecture.
- **Tailwind CSS:** For styling a clean, responsive, and professional user interface.
- **Lucide React:** For modern, scalable UI icons.

### **Backend & Database:**
- **Supabase:** Serving as the backend-as-a-service (BaaS) for PostgreSQL database management, user authentication, and secure data storage.
- **Row Level Security (RLS):** Implemented to ensure complete data isolation and user privacy.

### **AI Integration:**
- **Google Gemini AI:** Powering the core natural language processing, semantic matching, and analytical intelligence via the Lovable AI Gateway.

---

## 📂 Project Architecture & Workflow
1. **Input Stage:** The user uploads or pastes their resume text and inputs the target job title and description.
2. **Processing Stage:** The application securely sends the structured text payload to the AI processing engine.
3. **Evaluation Stage:** The AI engine cross-references the candidate's skills, experience, and keywords with the job requirements.
4. **Output Stage:** Results are rendered instantly on a clean dashboard displaying the match score, gaps, and recommendations, while simultaneously saving the record to the Supabase database.

---

## ⚙️ Local Development & Setup

If you wish to run or test this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/ai-resume-matcher.git](https://github.com/your-username/ai-resume-matcher.git)
