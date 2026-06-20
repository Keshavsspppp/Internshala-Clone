import React from 'react'
import { 
  Briefcase, 
  Mail, 
  Send,
  Users,
  BarChart,
  Settings
} from 'lucide-react';
import Link from 'next/link';
const AdminPanelPage = () => {
    const stats = [
        { label: 'Total Applications', value: '2,345', change: '+12%', changeType: 'positive' },
        { label: 'Active Jobs', value: '45', change: '+3%', changeType: 'positive' },
        { label: 'Active Internships', value: '89', change: '+24%', changeType: 'positive' },
        { label: 'Conversion Rate', value: '5.25%', change: '-1.3%', changeType: 'negative' },
      ];
    
      const menuItems = [
        {
          title: 'View Applications',
          description: 'View and manage all applications from candidates',
          icon: Mail,
          link: '/applications',
          color: 'bg-blue-50 text-blue-600 border-blue-100',
        },
        {
          title: 'Post Job',
          description: 'Create and publish new job opportunities',
          icon: Briefcase,
          link: '/postJob',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        },
        {
          title: 'Post Internship',
          description: 'Create and manage internship positions',
          icon: Send,
          link: '/postInternship',
          color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        },
        {
          title: 'Manage Users',
          description: 'View and manage user accounts',
          icon: Users,
          link: '/users',
          color: 'bg-amber-50 text-amber-600 border-amber-100',
        },
        {
          title: 'Analytics',
          description: 'View detailed reports and statistics',
          icon: BarChart,
          link: '/analytics',
          color: 'bg-rose-50 text-rose-600 border-rose-100',
        },
        {
          title: 'Settings',
          description: 'Configure system preferences',
          icon: Settings,
          link: '/settings',
          color: 'bg-slate-100 text-slate-600 border-slate-200',
        },
      ];
  return (
    <div className="min-h-screen bg-slate-50/30 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Manage jobs, internships, and candidate profiles
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-slate-800 font-heading">
                    {stat.value}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                  stat.changeType === 'positive' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                } border`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="group block bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`${item.color} p-3 rounded-xl border flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 font-heading group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminPanelPage;