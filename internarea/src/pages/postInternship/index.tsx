import { User, Lock } from "lucide-react";
import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  Tags,
  Info,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "react-toastify";
const index = () => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    category: "",
    aboutCompany: "",
    aboutInternship: "",
    whoCanApply: "",
    perks: "",
    numberOfOpening: "",
    stipend: "",
    startDate: "",
    additionalInfo: "",
  });
  const router = useRouter();
  const [isloading, setisloading] = useState(false);
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handlesubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasemptyfields = Object.values(formData).some((val) => !val.trim());
    if (hasemptyfields) {
      toast.error("Please fill in all detials");
      return;
    }
    try {
      setisloading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/internship`, formData);
      toast.success("job posted successfuly");
      router.push("/adminpanel");
    } catch (error) {
      console.log(error);
      toast.error("error posting job");
    } finally {
      setisloading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50/30 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-10">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">
              Post New Internship
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Create a new internship opportunity for students
            </p>
          </div>

          <form className="space-y-6" onSubmit={handlesubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>Title*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                    placeholder="e.g. Frontend Developer Intern"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Company Name*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                    placeholder="e.g. Tech Solutions Inc"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Location*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                    placeholder="e.g. Mumbai, India"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tags className="h-3.5 w-3.5 text-slate-400" />
                    <span>Category*</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                    placeholder="e.g. Software Development"
                  />
                </div>
              </div>
            </div>

            {/* Company & Internship Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span>About Company*</span>
                </label>
                <textarea
                  name="aboutCompany"
                  value={formData.aboutCompany}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="Describe your company..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>About Internship*</span>
                </label>
                <textarea
                  name="aboutInternship"
                  value={formData.aboutInternship}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="Describe the internship role..."
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Who Can Apply*</span>
                </label>
                <textarea
                  name="whoCanApply"
                  value={formData.whoCanApply}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="Eligibility criteria..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span>Perks*</span>
                </label>
                <textarea
                  name="perks"
                  value={formData.perks}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="List the perks..."
                />
              </div>
            </div>

            {/* Final Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Number of Openings*</span>
                </label>
                <input
                  type="number"
                  name="numberOfOpening"
                  value={formData.numberOfOpening}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span>Stipend*</span>
                </label>
                <input
                  type="text"
                  name="stipend"
                  value={formData.stipend}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="e.g. ₹15,000/month"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Start Date*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span>Additional Information*</span>
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  placeholder="Any additional details..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isloading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isloading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 text-white"></div>
                    Posting Internship...
                  </div>
                ) : (
                  "Post Internship"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default index;
