import type { NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

const copy: Record<string, { title: string; home: string }> = {
  en: { title: "Something went wrong", home: "Back to home" },
  es: { title: "Algo salió mal", home: "Volver al inicio" },
  hi: { title: "कुछ गलत हो गया", home: "होम पर वापस जाएँ" },
  pt: { title: "Algo deu errado", home: "Voltar ao início" },
  zh: { title: "出现错误", home: "返回首页" },
  fr: { title: "Une erreur s'est produite", home: "Retour à l'accueil" },
};

const ErrorPage = ({ statusCode }: { statusCode?: number }) => {
  const router = useRouter();
  const text = copy[router.locale || "en"] || copy.en;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20 text-center">
      <p className="text-sm font-bold text-blue-600">{statusCode || 500}</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900">{text.title}</h1>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">
        {text.home}
      </Link>
    </main>
  );
};

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => ({
  statusCode: res?.statusCode || err?.statusCode || 500,
});

export default ErrorPage;
