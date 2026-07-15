import { Facebook, Twitter, Instagram } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import Link from "next/link";

export default function Footer() {
  const { t } = useTranslation("common");
  const sections = [
    {
      title: t("footerInternshipsByLocation"),
      items: [t("workFromHome"), "Delhi NCR", "Bangalore", "Mumbai", "Hyderabad", "Pune"],
    },
    {
      title: t("footerInternshipsByStream"),
      items: [t("computerScience"), t("marketing"), t("finance"), t("graphicDesign"), t("dataScience"), t("contentWriting")],
    },
    {
      title: t("footerJobsByStream"),
      items: [t("fullStackDeveloper"), t("softwareEngineer"), t("businessDevelopment"), t("uxUiDesigner"), t("dataAnalyst"), t("productManager")],
      links: true,
    },
    {
      title: t("footerAboutInternArea"),
      items: [t("aboutUs"), t("wereHiring"), t("hireInterns"), t("postAJob"), t("contactUs"), t("helpCenter")],
      links: true,
    },
  ];
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-8">
          {sections.map((section) => <FooterSection key={section.title} {...section} />)}
        </div>

        <hr className="my-10 border-slate-800" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 border border-slate-700 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-all duration-200">
            <span className="text-sm font-semibold">{t("getMobileApp")}</span>
          </div>
          
          <div className="flex space-x-6">
            <Facebook className="w-5 h-5 hover:text-blue-500 cursor-pointer transition-colors duration-200" />
            <Twitter className="w-5 h-5 hover:text-sky-400 cursor-pointer transition-colors duration-200" />
            <Instagram className="w-5 h-5 hover:text-pink-500 cursor-pointer transition-colors duration-200" />
          </div>
          
          <p className="text-xs text-slate-500">{t("copyrightText")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({ title, items, links }: any) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      <div className="flex flex-col items-start mt-4 space-y-2.5">
        {items.map((item: any, index: any) =>
          links ? (
            <Link key={index} href="/" className="text-sm text-slate-400 hover:text-blue-500 transition-colors duration-200">
              {item}
            </Link>
          ) : (
            <p key={index} className="text-sm text-slate-400 hover:text-blue-500 cursor-pointer transition-colors duration-200">
              {item}
            </p>
          )
        )}
      </div>
    </div>
  );
}
