 Project LOOP – AI-Powered Customer Feedback Intelligence Platform

Project LOOP is an AI-powered SaaS platform designed to help organizations collect, organize, analyze, and understand customer feedback. The application leverages Artificial Intelligence to perform sentiment analysis, identify key themes, generate executive summaries, and provide actionable business insights through an interactive dashboard.



 Features

 Secure User Authentication
 Multi-Workspace Support
 Customer Feedback Management
 AI-Based Sentiment Analysis
 Automatic Theme Detection
 Interactive Dashboard
 Ask LOOP AI Assistant
 AI-Powered Report Generation
 Business Insights & Recommendations
 Search and Filter Feedback
 Fully Responsive Design



 Tech Stack

Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS

 Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

 Artificial Intelligence
- Groq API
- Llama 3.3 70B Versatile

Authentication
- NextAuth (Auth.js)

Deployment
- Vercel



Project Structure


project-loop/
│
├── app/
├── components/
├── lib/
├── prisma/
├── public/
├── styles/
├── package.json
└── README.md



Installation
Clone the repository

bash
git clone https://github.com/Keerjohnny/project-loop-ai-powered-customer-feedback-intelligence-platform.git


 Navigate to the project

bash
cd project-loop-ai-powered-customer-feedback-intelligence-platform

 Install dependencies

bash
npm install


Configure Environment Variables

Create a `.env` file and add the following:

env
DATABASE_URL=

DIRECT_URL=

AUTH_SECRET=

GROQ_API_KEY=

GROQ_MODEL=llama-3.3-70b-versatile


 Generate Prisma Client

bash
npx prisma generate


 Run Database Migration

bash
npx prisma migrate dev


 Start Development Server

bash
npm run dev




 Deployment

The application is deployed using Vercel

To deploy:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the required environment variables.
4. Deploy the project.


AI Features

- Sentiment Analysis
- Theme Detection
- Customer Feedback Summarization
- Executive Insights
- Business Recommendations
- Customer Pain Point Analysis
- Trend Analysis
- AI Report Generation



Workflow


Customer Feedback
        │
        ▼
Store in PostgreSQL
        │
        ▼
AI Analysis (Groq)
        │
        ├── Sentiment Analysis
        ├── Theme Detection
        ├── Summary Generation
        └── Business Recommendations
        │
        ▼
Interactive Dashboard
        │
        ▼
Business Decision Making




 Screenshots

- Landing Page
- Sign In Page
- Dashboard
- Feedback Management
- Reports
- Ask LOOP AI
- Analytics Dashboard



Future Enhancements

- Real-Time Analytics
- Email Integration
- Voice Feedback Analysis
- Multi-Language Support
- Predictive Analytics
- Team Collaboration
- Advanced AI Models
- Notification System


 Author

Keerthana Y 

MCA Student

AI & Full Stack Developer





License

This project is developed for educational and internship purposes.
