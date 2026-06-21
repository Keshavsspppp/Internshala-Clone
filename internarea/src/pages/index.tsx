import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";

export default function SvgSlider() {
  const { t } = useTranslation("common");

  const categories = [
    "Big Brands",
    "Work From Home",
    "Part-time",
    "MBA",
    "Engineering",
    "Media",
    "Design",
    "Data Science",
  ];

  const getLocalizedCategory = (cat: string) => {
    const key = "category" + cat.replace(/\s+/g, "");
    return t(key, cat);
  };

  const slides = [
    {
      pattern: "pattern-1",
      title: t("slide1Title"),
      bgColor: "bg-indigo-600",
    },
    {
      pattern: "pattern-2",
      title: t("slide2Title"),
      bgColor: "bg-blue-600",
    },
    {
      pattern: "pattern-3",
      title: t("slide3Title"),
      bgColor: "bg-purple-600",
    },
    {
      pattern: "pattern-4",
      title: t("slide4Title"),
      bgColor: "bg-teal-600",
    },
  ];

  const stats = [
    { number: "300K+", label: t("companiesHiring") },
    { number: "10K+", label: t("newOpeningsEveryday") },
    { number: "21Mn+", label: t("activeStudents") },
    { number: "600K+", label: t("learners") },
  ];

  const [internships, setinternship] = useState<any>([]);
  const [jobs, setjob] = useState<any>([]);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const [internshipres, jobres] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/internship`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/job`),
        ]);
        setinternship(internshipres.data);
        setjob(jobres.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("");
  const filteredInternships = internships.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );
  const filteredJobs = jobs.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );

  const makeDreamRealityText = t("makeDreamReality", { dreamCareer: "@@DREAM_CAREER@@" });
  const parts = makeDreamRealityText.split("@@DREAM_CAREER@@");

  return (
    <div className="bg-slate-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-slide-up">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="px-3 py-1 bg-blue-50 pointer-events-none text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wider">
            {t("trending")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4 tracking-tight leading-tight">
            {parts[0]}
            {parts.length > 1 && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("dreamCareer")}
              </span>
            )}
            {parts[1]}
          </h1>
          <p className="text-lg text-slate-500 mt-4 font-normal">
            {t("applyVerified")}
          </p>
        </div>

        {/* Swiper Slider Section */}
        <div className="mb-20 rounded-3xl overflow-hidden shadow-xl shadow-slate-100 border border-slate-100 bg-white p-2">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            className="rounded-2xl overflow-hidden"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className={`relative h-[380px] ${slide.bgColor} flex items-center px-8 sm:px-16 overflow-hidden`}>
                  {/* SVG Pattern Overlay */}
                  <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <pattern id={`pattern-${index}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                        <circle cx="15" cy="15" r="2.5" fill="white" />
                      </pattern>
                      <rect x="0" y="0" width="100%" height="100%" fill={`url(#pattern-${index})`} />
                    </svg>
                  </div>
                  
                  {/* Slide Content */}
                  <div className="relative z-10 max-w-xl text-white">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">
                      {slide.title}
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                      {t("slideDesc")}
                    </p>
                    <button className="mt-8 px-6 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-md hover:bg-slate-50 transition-colors">
                      {t("exploreOpenings")}
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Popular Categories */}
        <div className="mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            {t("latestOpportunities")}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </h2>
          <div className="flex flex-wrap gap-2.5 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              {t("filterByStream")}
            </span>
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t("allCategory")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {getLocalizedCategory(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Internship Listings */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t("latestInternships")}</h2>
              <p className="text-xs text-slate-400 mt-1">{t("recommendedInternships")}</p>
            </div>
            <Link href="/internship" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {t("viewAllInternships")} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.length > 0 ? (
              filteredInternships.map((internship: any, index: any) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-4 bg-blue-50/50 w-fit px-3 py-1 rounded-full border border-blue-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>{t("activelyHiring")}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-snug">
                      {internship.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-5 font-medium">{internship.company}</p>
                    
                    <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <MapPin size={14} />
                        </div>
                        <span>{internship.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <Banknote size={14} />
                        </div>
                        <span>{internship.stipend}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <Calendar size={14} />
                        </div>
                        <span>{internship.duration || "6 Months"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-50">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {t("internship")}
                    </span>
                    <Link
                      href={`/detailiternship/${internship._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group"
                    >
                      <span>{t("viewDetails")}</span>
                      <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-500 text-sm">
                {t("noInternshipsFound")}
              </div>
            )}
          </div>
        </div>

        {/* Jobs Listings */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t("latestJobs")}</h2>
              <p className="text-xs text-slate-400 mt-1">{t("fullTimeOpportunities")}</p>
            </div>
            <Link href="/job" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {t("viewAllJobs")} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job: any, index: any) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-4 bg-blue-50/50 w-fit px-3 py-1 rounded-full border border-blue-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>{t("activelyHiring")}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-snug">
                      {job.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-5 font-medium">{job.company}</p>
                    
                    <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <MapPin size={14} />
                        </div>
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <Banknote size={14} />
                        </div>
                        <span>{job.CTC}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                          <Calendar size={14} />
                        </div>
                        <span>{job.Experience}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-50">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {t("job")}
                    </span>
                    <Link
                      href={`/detailjob/${job._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group"
                    >
                      <span>{t("viewDetails")}</span>
                      <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-500 text-sm">
                {t("noJobsFound")}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          {/* Subtle decoration grids */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-2 font-heading">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});
