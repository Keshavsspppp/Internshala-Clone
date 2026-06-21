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
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";

const JobsPage = () => {
  const { t } = useTranslation("common");
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
            {t("findJobs")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("browsePremiumRoles")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block w-72 bg-white border border-slate-100 rounded-2xl p-6 h-fit shadow-sm shadow-slate-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm font-heading">{t("filters")}</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t("clearAll")}
              </button>
            </div>
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("category")}
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
                  {t("location")}
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
                  {t("experience")}
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
                    {t("workFromHome")}
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
                    {t("partTime")}
                  </span>
                </label>
              </div>

              {/* Salary Range */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("annualSalary")}
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
                <span>{t("filters")}</span>
              </button>
            </div>

            {/* Results count banner */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm shadow-slate-100 mb-6 flex justify-between items-center px-6">
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                {t("searchResults")}
              </p>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                {filteredjob.length} {t("found")}
              </span>
            </div>

            {/* Listings Grid */}
            <div className="space-y-4">
              {filteredjob.length > 0 ? (
                filteredjob.map((job: any) => (
                  <div
                    key={job._id}
                    className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 w-fit px-2.5 py-1 rounded-full border border-blue-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="uppercase tracking-wider">{t("activelyHiring")}</span>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("category")}</p>
                            <p className="text-xs font-semibold text-slate-700">{job.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                            <Pin size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("location")}</p>
                            <p className="text-xs font-semibold text-slate-700">{job.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                            <DollarSign size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("ctc")}</p>
                            <p className="text-xs font-semibold text-slate-700">{job.CTC}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-655 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {t("job")}
                        </span>
                        <div className="flex items-center space-x-1 text-emerald-650 bg-emerald-50/50 px-2 py-0.5 rounded-lg border border-emerald-50">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-bold">{t("postedRecently")}</span>
                        </div>
                      </div>
                      <Link
                        href={`/detailjob/${job._id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group transition-colors"
                      >
                        <span>{t("viewDetails")}</span>
                        <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-sm">
                  {t("noJobsFoundFilters")}
                </div>
              )}
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
                <h2 className="text-lg font-bold text-slate-800 font-heading">{t("filters")}</h2>
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
                    {t("category")}
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
                    {t("location")}
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
                    {t("experience")}
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
                      {t("workFromHome")}
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
                      {t("partTime")}
                    </span>
                  </label>
                </div>

                {/* Salary Range */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("annualSalary")}
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
                {t("reset")}
              </button>
              <button
                onClick={() => setisFiltervisible(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default JobsPage;
