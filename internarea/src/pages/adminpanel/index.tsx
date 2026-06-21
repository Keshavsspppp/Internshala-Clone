import React, { useEffect, useState } from 'react'
import {
  Briefcase,
  Mail,
  Send,
  Users,
  BarChart,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

const AdminPanelPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [counts, setCounts] = useState({ apps: 0, jobs: 0, internships: 0 });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/adminlogin");
      return;
    }

    Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/application`),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/job`),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/internship`)
    ])
      .then(([apps, jobs, interns]) => {
        setCounts({
          apps: apps.data.length,
          jobs: jobs.data.length,
          internships: interns.data.length
        });
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
      });
  }, [router]);

  const stats = [
    { label: t('totalApplications', 'Total Applications'), value: String(counts.apps), change: '+12%', changeType: 'positive' },
    { label: t('activeJobs', 'Active Jobs'), value: String(counts.jobs), change: '+3%', changeType: 'positive' },
    { label: t('activeInternships', 'Active Internships'), value: String(counts.internships), change: '+24%', changeType: 'positive' },
    { label: t('conversionRate', 'Conversion Rate'), value: '5.25%', change: '-1.3%', changeType: 'negative' },
  ];

  const menuItems = [
    {
      title: t('viewApplicationsTitle', 'View Applications'),
      description: t('viewApplicationsDesc', 'View and manage all applications from candidates'),
      icon: Mail,
      link: '/applications',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: t('postJobTitle', 'Post Job'),
      description: t('postJobDesc', 'Create and publish new job opportunities'),
      icon: Briefcase,
      link: '/postJob',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: t('postInternshipTitle', 'Post Internship'),
      description: t('postInternshipDesc', 'Create and manage internship positions'),
      icon: Send,
      link: '/postInternship',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: t('manageUsersTitle', 'Manage Users'),
      description: t('manageUsersDesc', 'View and manage user accounts'),
      icon: Users,
      link: '/users',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: t('analyticsTitle', 'Analytics'),
      description: t('analyticsDesc', 'View detailed reports and statistics'),
      icon: BarChart,
      link: '/analytics',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: t('settingsTitle', 'Settings'),
      description: t('settingsDesc', 'Configure system preferences'),
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">
            {t("adminDashboardHeading", "Admin Dashboard")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {t("adminDashboardDesc", "Manage jobs, internships, and candidate profiles")}
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
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${stat.changeType === 'positive'
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

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: { ...(await serverSideTranslations(locale, ["common"])) },
});

export default AdminPanelPage;