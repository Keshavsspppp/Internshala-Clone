import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
// export const internships = [
//   {
//     _id: "1",
//     title: "Frontend Developer Intern",
//     company: "Tech Innovators",
//     location: "Remote",
//     stipend: "$500/month",
//     Duration: "3 Months",
//     StartDate: "March 15, 2025",
//     aboutCompany:
//       "Tech Innovators is a leading software development company specializing in modern web applications.",
//     aboutJob:
//       "As a Frontend Developer Intern, you will work on real-world projects using React.js and Tailwind CSS.",
//     Whocanapply:
//       "Students and fresh graduates with knowledge of HTML, CSS, JavaScript, and React.js.",
//     perks: "Certificate, Letter of Recommendation, Flexible Work Hours",
//     AdditionalInfo: "This is a remote internship with flexible working hours.",
//     numberOfopning: "2",
//   },
//   {
//     _id: "2",
//     title: "Backend Developer Intern",
//     company: "Cloud Systems",
//     location: "San Francisco",
//     stipend: "$800/month",
//     Duration: "4 Months",
//     StartDate: "April 1, 2025",
//     aboutCompany:
//       "Cloud Systems focuses on scalable backend solutions and cloud-based applications.",
//     aboutJob:
//       "As a Backend Developer Intern, you will work with Node.js, Express, and MongoDB.",
//     Whocanapply:
//       "Students with experience in backend technologies and databases.",
//     perks: "Certificate, Networking Opportunities, Paid Internship",
//     AdditionalInfo: "A strong foundation in databases is required.",
//     numberOfopning: "3",
//   },
//   {
//     _id: "3",
//     title: "UI/UX Designer Intern",
//     company: "Creative Minds",
//     location: "New York",
//     stipend: "$600/month",
//     Duration: "6 Months",
//     StartDate: "May 10, 2025",
//     aboutCompany:
//       "Creative Minds is a design agency focused on user experience and interface design.",
//     aboutJob:
//       "As a UI/UX Designer Intern, you will work with Figma, Adobe XD, and design systems.",
//     Whocanapply:
//       "Students passionate about designing intuitive user experiences.",
//     perks: "Mentorship, Hands-on Projects, Letter of Recommendation",
//     AdditionalInfo: "A portfolio is required for application.",
//     numberOfopning: "1",
//   },
// ];

const InternshipDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setloading] = useState(true);
  const [internshipData, setinternship] = useState<any>(null);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        setloading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/internship/${id}`
        );
        setinternship(res.data);
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
  const user = useSelector(selectuser);
  if (loading || !internshipData || Object.keys(internshipData).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  const handlesubmitapplication=async()=>{
    if(!coverLetter.trim()){
      toast.error("please write a cover letter")
      return
    }
    if(!availability){
      toast.error("please select your availability")
      return
    }
    try {
      const applicationdata={
        category:internshipData.category,
        company:internshipData.company,
        coverLetter:coverLetter,
        user:user,
        Application:id,
        availability
      }
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/application`,applicationdata)
      toast.success("Application submit successfully")
      router.push('/internship')
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit application")
    }
  }
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
              {internshipData.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-semibold mb-8">{internshipData.company}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Location</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{internshipData.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Stipend</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{internshipData.stipend}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Start Date</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{internshipData.startDate || "Immediate"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center space-x-2 bg-emerald-50/50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <Clock className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span className="text-emerald-700 text-xs font-bold">
                Posted on {new Date(internshipData.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Company Details */}
          <div className="p-8 sm:p-10 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 font-heading">
              About {internshipData.company}
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
              {internshipData.aboutCompany}
            </p>
          </div>

          {/* Internship Details */}
          <div className="p-8 sm:p-10 space-y-8 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3 font-heading">
                About the Internship
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {internshipData.aboutInternship}
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Who can apply
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                  {internshipData.whoCanApply}
                </p>
              </div>

              {internshipData.perks && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Perks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(internshipData.perks)
                      ? internshipData.perks
                      : String(internshipData.perks).split(",")
                    ).map((perk: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium shadow-sm">
                        {perk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {internshipData.additionalInfo && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Additional Information
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-650 font-medium">
                    {internshipData.additionalInfo}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 text-slate-600">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Number of Openings:</span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-750 font-bold rounded-md text-xs">
                {internshipData.numberOfOpening || "1"}
              </span>
            </div>
          </div>

          {/* Apply Button Footer */}
          <div className="p-8 bg-slate-50/50 flex justify-center">
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please sign in to apply for this internship.");
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
                    Apply to {internshipData.company}
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
                <p className="text-xs text-slate-450 mb-3">
                  Why should the hiring team select you for this internship opportunity?
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
                      <span className="text-xs sm:text-sm font-semibold text-slate-650 group-hover:text-slate-800 transition-colors">{option}</span>
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

export default InternshipDetailPage;
