import Link from "next/link";
import { useRouter } from "next/router";

const copy: Record<string, { title: string; description: string; home: string }> = {
  en: { title: "Page not found", description: "The page you requested does not exist or may have moved.", home: "Back to home" },
  es: { title: "Página no encontrada", description: "La página solicitada no existe o puede haberse movido.", home: "Volver al inicio" },
  hi: { title: "पेज नहीं मिला", description: "आपके द्वारा माँगा गया पेज मौजूद नहीं है या स्थानांतरित हो गया है।", home: "होम पर वापस जाएँ" },
  pt: { title: "Página não encontrada", description: "A página solicitada não existe ou pode ter sido movida.", home: "Voltar ao início" },
  zh: { title: "找不到页面", description: "您请求的页面不存在或可能已被移动。", home: "返回首页" },
  fr: { title: "Page introuvable", description: "La page demandée n'existe pas ou a peut-être été déplacée.", home: "Retour à l'accueil" },
};

const NotFoundPage = () => {
  const router = useRouter();
  const text = copy[router.locale || "en"] || copy.en;

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-600">404</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900">{text.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">{text.description}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
      >
        {text.home}
      </Link>
    </main>
  );
};

export default NotFoundPage;
