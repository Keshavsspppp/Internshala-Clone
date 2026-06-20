import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Book,
  Calendar,
  Cat,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
// const filteredJobs = [
//     {
//       _id: "101",
//       title: "Frontend Developer",
//       company: "Amazon",
//       location: "Seattle",
//       CTC: "$100K/year",
//       Experience: "2+ years",
//       category: "Engineering",
//       StartDate: "April 1, 2025",
//       aboutCompany:
//         "Amazon is a global leader in e-commerce and cloud computing, providing cutting-edge technology solutions.",
//       aboutJob:
//         "Seeking a skilled Frontend Developer proficient in React.js, JavaScript, and UI development.",
//       Whocanapply:
//         "Developers with experience in JavaScript, React.js, and modern frontend frameworks.",
//       perks:
//         "Remote work, stock options, health insurance, learning resources.",
//       AdditionalInfo: "This role is hybrid with occasional onsite meetings.",
//       numberOfopning: "3",
//     },
//     {
//       _id: "102",
//       title: "Data Analyst",
//       company: "Microsoft",
//       location: "Remote",
//       CTC: "$90K/year",
//       Experience: "1+ years",
//       category: "Data Science",
//       StartDate: "March 15, 2025",
//       aboutCompany:
//         "Microsoft is a technology company specializing in software development, cloud computing, and AI.",
//       aboutJob:
//         "Looking for a Data Analyst with expertise in SQL, Python, and data visualization tools.",
//       Whocanapply:
//         "Candidates with experience in data analytics, SQL, Python, and Tableau/Power BI.",
//       perks: "Flexible hours, remote work, upskilling programs, bonuses.",
//       AdditionalInfo: "This is a fully remote role.",
//       numberOfopning: "2",
//     },
//     {
//       _id: "103",
//       title: "UX Designer",
//       company: "Apple",
//       location: "California",
//       CTC: "$110K/year",
//       Experience: "3+ years",
//       category: "Design",
//       StartDate: "March 30, 2025",
//       aboutCompany:
//         "Apple is a leader in consumer electronics and software, focusing on design and innovation.",
//       aboutJob:
//         "Seeking a UX Designer to craft intuitive user experiences for our next-generation products.",
//       Whocanapply:
//         "Designers with experience in Figma, Adobe XD, user research, and usability testing.",
//       perks:
//         "Creative environment, free lunches, fitness perks, flexible hours.",
//       AdditionalInfo: "Office-based with occasional remote work options.",
//       numberOfopning: "1",
//     },
//     {
//       _id: "104",
//       title: "Backend Developer",
//       company: "NextGen Solutions",
//       location: "Austin, TX",
//       CTC: "$90,000 - $110,000",
//       Experience: "3-5 years",
//       category: "Engineering",
//       StartDate: "March 20, 2025",
//       aboutCompany:
//         "NextGen Solutions specializes in building scalable backend systems and APIs for high-performance applications.",
//       aboutJob:
//         "Looking for a Backend Developer skilled in Node.js, Express.js, and database management.",
//       Whocanapply:
//         "Developers with experience in server-side programming, databases (SQL, NoSQL), and RESTful APIs.",
//       perks: "Stock options, remote work, gym membership, yearly bonuses.",
//       AdditionalInfo: "Hybrid role with 2 days of in-office meetings per week.",
//       numberOfopning: "3",
//     },
//     {
//       _id: "105",
//       title: "UI/UX Designer",
//       company: "Design Pro",
//       location: "San Francisco, CA",
//       CTC: "$70,000 - $85,000",
//       Experience: "2+ years",
//       category: "Design",
//       StartDate: "March 25, 2025",
//       aboutCompany:
//         "Design Pro is an award-winning UI/UX design agency focusing on innovative user experiences.",
//       aboutJob:
//         "We need a UI/UX Designer who can create user-friendly interfaces and improve the user experience of our applications.",
//       Whocanapply:
//         "Designers with proficiency in Figma, Adobe XD, and user research methodologies.",
//       perks:
//         "Creative workspace, wellness programs, free team lunches, flexible hours.",
//       AdditionalInfo: "Office-based with flexible working hours.",
//       numberOfopning: "1",
//     },
//   ];
const index = () => {
  const user=useSelector(selectuser)
  const router = useRouter();
  const { id } = router.query;
  const [loading, setloading] = useState(true);
  const [jobdata, setjob] = useState<any>(null);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        setloading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/job/${id}`);
        setjob(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    if (id) {
      fetchdata();
    }
  }, [id]);

  const [availability, setAvailability] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  if (loading || !jobdata || Object.keys(jobdata).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  const handlesubmitapplication = async () => {
    if (!coverLetter.trim()) {
      toast.error("please write a cover letter");
      return;
    }
    if (!availability) {
      toast.error("please select your availability");
      return;
    }
    try {
      const applicationdata = {
        category: jobdata.category,
        company: jobdata.company,
        coverLetter: coverLetter,
        user: user,
        Application: id,
        availability,
      };
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/application`,
        applicationdata
      );
      toast.success("Application submit successfully");
      router.push("/job");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="p-8 sm:p-10 border-b border-slate-100 relative bg-gradient-to-br from-white to-blue-50/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-650 bg-blue-50 w-fit px-2.5 py-1 rounded-full border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="uppercase tracking-wider">Actively Hiring</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                Ref: {String(id).slice(-6).toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 font-heading">
              {jobdata.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-semibold mb-8">{jobdata.company}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Location</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{jobdata.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">CTC (Annual)</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{jobdata.CTC}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Book className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Category</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{jobdata.category}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center space-x-2 bg-emerald-50/50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <Clock className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span className="text-emerald-700 text-xs font-bold">
                Posted on {jobdata.createAt || "Recently"}
              </span>
            </div>
          </div>

          {/* Company Details */}
          <div className="p-8 sm:p-10 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 font-heading">
              About {jobdata.company}
            </h2>
            <div className="mb-4">
              <a
                href="#"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 w-fit group"
              >
                <span>Visit company website</span>
                <ExternalLink className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              {jobdata.aboutCompany}
            </p>
          </div>

          {/* Job Details */}
          <div className="p-8 sm:p-10 space-y-8 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3 font-heading">
                About the Job role
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {jobdata.aboutJob}
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Who can apply
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                  {jobdata.whoCanApply}
                </p>
              </div>

              {jobdata.perks && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Perks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(jobdata.perks)
                      ? jobdata.perks
                      : String(jobdata.perks).split(",")
                    ).map((perk: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-slate-650 rounded-lg text-xs font-medium shadow-sm animate-fade-in">
                        {perk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jobdata.AdditionalInfo && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Additional Information
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-650 font-medium">
                    {jobdata.AdditionalInfo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Apply Button Footer */}
          <div className="p-8 bg-slate-50/50 flex justify-center">
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please sign in to apply for this job.");
                  return;
                }
                setIsModalOpen(true);
              }}
              className="px-10 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-150 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-150 animate-slide-up">
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application form</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-heading mt-0.5">
                    Apply to {jobdata.company}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              {/* Resume Info */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3">
                <span className="text-blue-600 mt-0.5">📝</span>
                <div>
                  <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Your Resume</h3>
                  <p className="text-xs text-blue-650 mt-1 leading-relaxed">
                    Your current profile resume and career history details will be submitted dynamically with this application.
                  </p>
                </div>
              </div>

              {/* Cover Letter Input */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                  Cover Letter
                </label>
                <p className="text-xs text-slate-455 mb-3">
                  Why should the hiring team select you for this position?
                </p>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full h-36 p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm text-slate-700 placeholder-slate-400 transition-all font-medium"
                  placeholder="Describe your skills, experiences, and interest in this role..."
                />
              </div>

              {/* Availability Options */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">
                  Your Availability
                </label>
                <div className="space-y-2.5">
                  {[
                    "Yes, I am available to join immediately",
                    "No, I am currently on notice period",
                    "No, I will have to serve notice period",
                    "Other",
                  ].map((option) => (
                    <label key={option} className="flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-colors group">
                      <input
                        type="radio"
                        name="availability"
                        value={option}
                        checked={availability === option}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500/25 border-slate-250 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-slate-655 group-hover:text-slate-800 transition-colors">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-55 transition-colors"
                >
                  Cancel
                </button>
                {user ? (
                  <button
                    className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 hover:shadow-lg active:scale-98 transition-all"
                    onClick={handlesubmitapplication}
                  >
                    Submit Application
                  </button>
                ) : (
                  <Link
                    href={`/`}
                    className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 hover:shadow-lg text-center transition-all"
                  >
                    Sign up to apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
