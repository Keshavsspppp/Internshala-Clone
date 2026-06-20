const mongoose = require("mongoose");
require("dotenv").config();
const Internship = require("./Model/Internship");
const Job = require("./Model/Job");

const databaseUrl = process.env.DATABASE_URL;

const internshipsData = [
  {
    title: "Software Engineering Intern",
    company: "Google",
    location: "Remote",
    category: "Engineering",
    aboutCompany: "Google's mission is to organize the world's information and make it universally accessible and useful.",
    aboutInternship: "We are looking for a Software Engineering Intern to work on core features, cloud systems, and scalable services.",
    whoCanApply: "Students currently enrolled in a Bachelor's, Master's, or PhD in Computer Science or a related technical field.",
    perks: ["Certificate", "Flexible work hours", "Free meals", "Letter of recommendation"],
    numberOfOpening: "10",
    stipend: "₹50,000/month",
    startDate: "Immediately",
    additionalInfo: "Strong proficiency in Java, C++, Python or Go is highly preferred."
  },
  {
    title: "Marketing Strategy Intern",
    company: "Meta",
    location: "Mumbai, India",
    category: "MBA",
    aboutCompany: "Meta builds technologies that help people connect, find communities, and grow businesses.",
    aboutInternship: "Assist the regional marketing team in executing digital campaigns, researching audience insights, and optimizing performance metrics.",
    whoCanApply: "MBA or marketing graduates with strong analytical abilities and passionate about social media platforms.",
    perks: ["Certificate", "Informal dress code", "Mentorship sessions"],
    numberOfOpening: "4",
    stipend: "₹30,000/month",
    startDate: "Next Month",
    additionalInfo: "Familiarity with Facebook Ads Manager and Google Analytics is a plus."
  },
  {
    title: "Graphic Design Intern",
    company: "Adobe",
    location: "Delhi, India",
    category: "Design",
    aboutCompany: "Adobe is the global leader in digital media and digital marketing solutions.",
    aboutInternship: "Collaborate with the creative team to design UI mockups, visual assets, and marketing collateral.",
    whoCanApply: "Design students with strong portfolios showcasing Adobe Photoshop, Illustrator, or Figma skills.",
    perks: ["Certificate", "Flexible work hours", "Job offer possibility"],
    numberOfOpening: "3",
    stipend: "₹25,000/month",
    startDate: "Immediately",
    additionalInfo: "Please attach a link to your portfolio (Behance/Dribbble/Figma) in the application."
  },
  {
    title: "Data Science Intern",
    company: "Netflix",
    location: "Bangalore, India",
    category: "Data Science",
    aboutCompany: "Netflix is the world's leading streaming entertainment service.",
    aboutInternship: "Work on recommendation algorithms, analyze user behavior data, and build predictive statistical models.",
    whoCanApply: "Students in Statistics, Mathematics, Computer Science, or Data Analytics.",
    perks: ["Certificate", "High stipend", "Letter of recommendation"],
    numberOfOpening: "2",
    stipend: "₹60,000/month",
    startDate: "Immediately",
    additionalInfo: "Knowledge of Python/R, SQL, and Machine Learning libraries (scikit-learn, TensorFlow) is required."
  },
  {
    title: "Content Writing Intern",
    company: "Amazon",
    location: "Remote",
    category: "Media",
    aboutCompany: "Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.",
    aboutInternship: "Write high-quality product descriptions, blog posts, and marketing copy targeting e-commerce growth.",
    whoCanApply: "Candidates with excellent English writing and grammar skills.",
    perks: ["Certificate", "Flexible work hours", "Letter of recommendation"],
    numberOfOpening: "5",
    stipend: "₹20,000/month",
    startDate: "Immediate",
    additionalInfo: "Prior blogging experience or SEO knowledge is preferred."
  }
];

const jobsData = [
  {
    title: "Frontend Developer",
    company: "Microsoft",
    location: "Hyderabad, India",
    Experience: "2+ years",
    category: "Engineering",
    aboutCompany: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
    aboutJob: "We are seeking a Frontend Developer to build high-performance, user-friendly UI dashboards using React, Next.js, and TypeScript.",
    whoCanApply: "Developers with a Bachelor's degree and 2+ years of production experience in React.js and modern CSS.",
    perks: ["Health Insurance", "Work From Home options", "Yearly Bonuses", "Gym Membership"],
    AdditionalInfo: "Hybrid work mode (3 days in office).",
    CTC: "₹24 LPA",
    StartDate: "Immediately"
  },
  {
    title: "Backend Engineer",
    company: "Spotify",
    location: "Remote",
    Experience: "1+ years",
    category: "Engineering",
    aboutCompany: "Spotify is a digital music, podcast, and video service that gives you access to millions of songs.",
    aboutJob: "Develop robust microservices, manage database operations (SQL/NoSQL), and maintain streaming infrastructure.",
    whoCanApply: "Developers experienced in Node.js, Express, databases, and Docker/Kubernetes.",
    perks: ["Stock options", "Remote work allowance", "Unlimited vacation policy"],
    AdditionalInfo: "Fully remote. Open to candidates across India.",
    CTC: "₹18 LPA",
    StartDate: "Next month"
  },
  {
    title: "Data Scientist",
    company: "Tesla",
    location: "Bangalore, India",
    Experience: "3+ years",
    category: "Data Science",
    aboutCompany: "Tesla's mission is to accelerate the world's transition to sustainable energy.",
    aboutJob: "Analyze hardware diagnostic data, train deep learning models, and support autopilot performance optimization.",
    whoCanApply: "Data Scientists with a strong background in Machine Learning, Computer Vision, or NLP.",
    perks: ["Relocation assistance", "Free Tesla charging", "High base compensation"],
    AdditionalInfo: "Requires strong expertise in Python, PyTorch, and cloud platforms (AWS/GCP).",
    CTC: "₹30 LPA",
    StartDate: "Immediate"
  },
  {
    title: "UI/UX Designer",
    company: "Slack",
    location: "Pune, India",
    Experience: "2+ years",
    category: "Design",
    aboutCompany: "Slack is a new way to communicate with your team. It's faster, better organized, and more secure than email.",
    aboutJob: "Define visual styles, user flows, and wireframes to make team collaboration smoother and more intuitive.",
    whoCanApply: "Product designers with experience shipping consumer or enterprise SaaS interfaces in Figma.",
    perks: ["Creative workspace", "Free meals", "Learning budget"],
    AdditionalInfo: "Please share Figma/design links in your application.",
    CTC: "₹12 LPA",
    StartDate: "Immediately"
  },
  {
    title: "Associate Product Manager",
    company: "Apple",
    location: "Chennai, India",
    Experience: "1+ years",
    category: "MBA",
    aboutCompany: "Apple designs and creates consumer electronics, computer software, and online services.",
    aboutJob: "Drive product requirements, coordinate with engineering and design teams, and analyze user feedback to prioritize features.",
    whoCanApply: "Candidates with a business/MBA degree or technical background with product management experience.",
    perks: ["Employee discounts", "Premium health cover", "Flexible hours"],
    AdditionalInfo: "Strong communication and stakeholder management skills are required.",
    CTC: "₹20 LPA",
    StartDate: "Immediately"
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB. Clearing existing collections...");
    
    await Internship.deleteMany({});
    await Job.deleteMany({});
    
    console.log("Inserting internships...");
    await Internship.insertMany(internshipsData);
    console.log("Inserted internships successfully!");
    
    console.log("Inserting jobs...");
    await Job.insertMany(jobsData);
    console.log("Inserted jobs successfully!");
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
