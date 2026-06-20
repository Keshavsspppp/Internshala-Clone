import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  Tag,
  User,
  Search,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { selectuser } from "@/Feature/Userslice";
import { useSelector } from "react-redux";
const getStatusClasses = (status: any) => {
  switch ((status || "").toLowerCase()) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100/50";
    case "rejected":
      return "bg-rose-50 text-rose-700 border border-rose-100/50";
    default:
      return "bg-amber-50 text-amber-700 border border-amber-100/50";
  }
};
const UserApplicationsPage = () => {
  const [searchTerm, setsearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const user=useSelector(selectuser)
  // const [user, setuser] = useState<any>({
  //   name: "Rahul",
  //   email: "xyz@gmail.com",
  //   photo:
  //     "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces",
  // });

  const [data, setdata] = useState<any>([]);
  useEffect(() => {
    const fetchdata = async () => {
      if (!user?.uid && !user?.email) {
        setdata([]);
        return;
      }
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/application`, {
          params: {
            uid: user?.uid,
            email: user?.email,
          }
        });
        setdata(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, [user?.uid, user?.email]);

  const userapplication = data.filter(
    (app: any) =>
      app.user?.uid === user?.uid ||
      (app.user?.email && user?.email && app.user.email.toLowerCase() === user.email.toLowerCase())
  );
  const filteredapplications = userapplication.filter((application: any) => {
    const searchmatch =
      application.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return searchmatch;
    return searchmatch && application.status.toLowerCase() === filter;
  });
  return (
    <div className="min-h-screen bg-slate-50/30 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">
              My Applications
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Track and manage your job and internship applications
            </p>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setsearchTerm(e.target.value)}
                    placeholder="Search by company or category..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs font-semibold"
                  />
                  <Search className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                {["all", "pending", "accepted", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      filter === status
                        ? status === "accepted"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : status === "rejected"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications List */}
          {filteredapplications.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Company & Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Applicant
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Applied Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredapplications.map((application: any) => (
                      <tr key={application._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-50 rounded-xl">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-800">
                                {application.company}
                              </div>
                              <div className="flex items-center text-xs text-slate-500 font-semibold mt-0.5">
                                <Tag className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                {application.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl">
                              <User className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-800">
                                {application.user.name}
                              </div>
                              <div className="text-xs text-slate-450 font-medium">
                                {application.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-xs font-semibold text-slate-600">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {new Date(application.createdAt).toISOString().split("T")[0]}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getStatusClasses(
                              application.status
                            )}`}
                          >
                            {application.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-slate-100 bg-white">
                {filteredapplications.map((application: any) => (
                  <div key={application._id} className="p-5 space-y-4 hover:bg-slate-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm leading-snug">{application.company}</h3>
                          <div className="flex items-center text-xs text-slate-500 font-semibold mt-0.5">
                            <Tag className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {application.category}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getStatusClasses(application.status)}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-55">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicant</span>
                        <div className="text-xs font-bold text-slate-700 truncate">{application.user.name}</div>
                        <div className="text-[10px] text-slate-450 font-medium truncate">{application.user.email}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied On</span>
                        <div className="flex items-center text-xs font-semibold text-slate-600 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          {new Date(application.createdAt).toISOString().split("T")[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm bg-white font-medium">
              No applications found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserApplicationsPage;
