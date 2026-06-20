import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Pin,
  PlayCircle,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const index = () => {
  // const filteredJobs = [
  //   {
  //     _id: "101",
  //     title: "Frontend Developer",
  //     company: "Amazon",
  //     location: "Seattle",
  //     CTC: "$100K/year",
  //     Experience: "2+ years",
  //     category: "Engineering",
  //     StartDate: "April 1, 2025",
  //     aboutCompany:
  //       "Amazon is a global leader in e-commerce and cloud computing, providing cutting-edge technology solutions.",
  //     aboutJob:
  //       "Seeking a skilled Frontend Developer proficient in React.js, JavaScript, and UI development.",
  //     Whocanapply:
  //       "Developers with experience in JavaScript, React.js, and modern frontend frameworks.",
  //     perks:
  //       "Remote work, stock options, health insurance, learning resources.",
  //     AdditionalInfo: "This role is hybrid with occasional onsite meetings.",
  //     numberOfopning: "3",
  //   },
  //   {
  //     _id: "102",
  //     title: "Data Analyst",
  //     company: "Microsoft",
  //     location: "Remote",
  //     CTC: "$90K/year",
  //     Experience: "1+ years",
  //     category: "Data Science",
  //     StartDate: "March 15, 2025",
  //     aboutCompany:
  //       "Microsoft is a technology company specializing in software development, cloud computing, and AI.",
  //     aboutJob:
  //       "Looking for a Data Analyst with expertise in SQL, Python, and data visualization tools.",
  //     Whocanapply:
  //       "Candidates with experience in data analytics, SQL, Python, and Tableau/Power BI.",
  //     perks: "Flexible hours, remote work, upskilling programs, bonuses.",
  //     AdditionalInfo: "This is a fully remote role.",
  //     numberOfopning: "2",
  //   },
  //   {
  //     _id: "103",
  //     title: "UX Designer",
  //     company: "Apple",
  //     location: "California",
  //     CTC: "$110K/year",
  //     Experience: "3+ years",
  //     category: "Design",
  //     StartDate: "March 30, 2025",
  //     aboutCompany:
  //       "Apple is a leader in consumer electronics and software, focusing on design and innovation.",
  //     aboutJob:
  //       "Seeking a UX Designer to craft intuitive user experiences for our next-generation products.",
  //     Whocanapply:
  //       "Designers with experience in Figma, Adobe XD, user research, and usability testing.",
  //     perks:
  //       "Creative environment, free lunches, fitness perks, flexible hours.",
  //     AdditionalInfo: "Office-based with occasional remote work options.",
  //     numberOfopning: "1",
  //   },
  //   {
  //     _id: "104",
  //     title: "Backend Developer",
  //     company: "NextGen Solutions",
  //     location: "Austin, TX",
  //     CTC: "$90,000 - $110,000",
  //     Experience: "3-5 years",
  //     category: "Engineering",
  //     StartDate: "March 20, 2025",
  //     aboutCompany:
  //       "NextGen Solutions specializes in building scalable backend systems and APIs for high-performance applications.",
  //     aboutJob:
  //       "Looking for a Backend Developer skilled in Node.js, Express.js, and database management.",
  //     Whocanapply:
  //       "Developers with experience in server-side programming, databases (SQL, NoSQL), and RESTful APIs.",
  //     perks: "Stock options, remote work, gym membership, yearly bonuses.",
  //     AdditionalInfo: "Hybrid role with 2 days of in-office meetings per week.",
  //     numberOfopning: "3",
  //   },
  //   {
  //     _id: "105",
  //     title: "UI/UX Designer",
  //     company: "Design Pro",
  //     location: "San Francisco, CA",
  //     CTC: "$70,000 - $85,000",
  //     Experience: "2+ years",
  //     category: "Design",
  //     StartDate: "March 25, 2025",
  //     aboutCompany:
  //       "Design Pro is an award-winning UI/UX design agency focusing on innovative user experiences.",
  //     aboutJob:
  //       "We need a UI/UX Designer who can create user-friendly interfaces and improve the user experience of our applications.",
  //     Whocanapply:
  //       "Designers with proficiency in Figma, Adobe XD, and user research methodologies.",
  //     perks:
  //       "Creative workspace, wellness programs, free team lunches, flexible hours.",
  //     AdditionalInfo: "Office-based with flexible working hours.",
  //     numberOfopning: "1",
  //   },
  // ];
  const [filteredjob, setfilteredjobs] = useState<any>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    salary: 50,
    experience: "",
  });
  const [filteredJobs,setjob]=useState<any>([])
  useEffect(()=>{
    const fetchdata=async()=>{
      try {
        const res=await axios.get( `${process.env.NEXT_PUBLIC_API_URL}/api/job`)     
        setjob(res.data)
        setfilteredjobs(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchdata()
  },[])
  useEffect(() => {
    const filtered = filteredJobs.filter((job:any) => {
      const matchesCategory = job.category
        .toLowerCase()
        .includes(filter.category.toLowerCase());
      const matchesLocation = job.location
        .toLowerCase()
        .includes(filter.location.toLowerCase());
      return matchesCategory && matchesLocation;
    });
    setfilteredjobs(filtered);
  }, [filter, filteredJobs]);
  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const clearFilters = () => {
    setfilters({
      category: "",
      location: "",
      workFromHome: false,
      partTime: false,
      salary: 50,
      experience: "",
    });
  };
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-slide-up">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Find Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse premium full-time roles with competitive packages from top companies.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block w-72 bg-white border border-slate-100 rounded-2xl p-6 h-fit shadow-sm shadow-slate-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm font-heading">Filters</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={filter.category}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                  placeholder="e.g. Engineering"
                />
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                  placeholder="e.g. Bangalore / Remote"
                />
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Experience
                </label>
                <input
                  type="text"
                  name="experience"
                  value={filter.experience}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                  placeholder="e.g. 2+ years"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-4.5 w-4.5 rounded border-slate-250 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-650 group-hover:text-slate-900 transition-colors">
                    Work from home
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-4.5 w-4.5 rounded border-slate-250 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-650 group-hover:text-slate-900 transition-colors">
                    Part-time
                  </span>
                </label>
              </div>

              {/* Salary Range */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Annual Salary (₹ in Lakhs)
                </label>
                <input
                  type="range"
                  name="salary"
                  min="0"
                  max="100"
                  value={filter.salary}
                  onChange={handlefilterchange}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>₹0L</span>
                  <span>₹50L</span>
                  <span>₹100L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Container */}
          <div className="flex-1">
            {/* Filter Toggle Mobile */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setisFiltervisible(!isFiltervisible)}
                className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm text-slate-700 font-semibold text-xs active:bg-slate-50 transition-colors"
              >
                <Filter className="h-4 w-4 text-slate-500" />
                <span>Filters</span>
              </button>
            </div>

            {/* Results count banner */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm shadow-slate-100 mb-6 flex justify-between items-center px-6">
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                Search Results
              </p>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold animate-pulse-glow">
                {filteredjob.length} found
              </span>
            </div>

            {/* Listings Grid */}
            <div className="space-y-4">
              {filteredjob.map((job: any) => (
                <div
                  key={job._id}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 w-fit px-2.5 py-1 rounded-full border border-blue-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="uppercase tracking-wider">Actively Hiring</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        ID: {job._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-800 mb-1 hover:text-blue-600 transition-colors font-heading leading-snug">
                      {job.title}
                    </h2>
                    <p className="text-xs text-slate-500 mb-5 font-semibold">{job.company}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <PlayCircle size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                          <p className="text-xs font-semibold text-slate-700">{job.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <Pin size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                          <p className="text-xs font-semibold text-slate-700">{job.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <DollarSign size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CTC</p>
                          <p className="text-xs font-semibold text-slate-700">{job.CTC}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-655 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Job
                      </span>
                      <div className="flex items-center space-x-1 text-emerald-650 bg-emerald-50/50 px-2 py-0.5 rounded-lg border border-emerald-50">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold">Posted recently</span>
                      </div>
                    </div>
                    <Link
                      href={`/detailjob/${job._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group transition-colors"
                    >
                      <span>View details</span>
                      <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {isFiltervisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden animate-fade-in flex justify-end">
          <div className="bg-white h-full w-full max-w-sm p-6 overflow-y-auto shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 font-heading">Filters</h2>
                <button
                  onClick={() => setisFiltervisible(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={filter.category}
                    onChange={handlefilterchange}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                    placeholder="e.g. Engineering"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={filter.location}
                    onChange={handlefilterchange}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                    placeholder="e.g. Bangalore / Remote"
                  />
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={filter.experience}
                    onChange={handlefilterchange}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-medium"
                    placeholder="e.g. 2+ years"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="workFromHome"
                      checked={filter.workFromHome}
                      onChange={handlefilterchange}
                      className="h-4.5 w-4.5 rounded border-slate-250 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-650 transition-colors">
                      Work from home
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="partTime"
                      checked={filter.partTime}
                      onChange={handlefilterchange}
                      className="h-4.5 w-4.5 rounded border-slate-250 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-650 transition-colors">
                      Part-time
                    </span>
                  </label>
                </div>

                {/* Salary Range */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Annual Salary (₹ in Lakhs)
                  </label>
                  <input
                    type="range"
                    name="salary"
                    min="0"
                    max="100"
                    value={filter.salary}
                    onChange={handlefilterchange}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                    <span>₹0L</span>
                    <span>₹50L</span>
                    <span>₹100L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setisFiltervisible(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
