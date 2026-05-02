import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ── Main Grid - Area Quadrada ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Hero */}
          <div className="animate-fade-in-up">
            {/* Logo */}
            <div className="w-14 h-14 mb-4 rounded-xl bg-linear-to-br from-neural-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-neural-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Leitor{" "}
              <span className="bg-linear-to-r from-neural-400 to-accent-cyan bg-clip-text text-transparent">
                Neural
              </span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Transforme qualquer artigo, PDF ou texto em uma experiência de leitura
              em voz alta com vozes neurais e tradução automática.
            </p>

            {/* Features */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Vozes neurais naturais
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tradução automática
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Acompanhamento visual
              </div>
            </div>
          </div>

          {/* Right: Cards - Alinhado com topo */}
          <div className="space-y-3">
            {/* Card: URL */}
            <Link
              href="/read"
              className="group block bg-surface rounded-xl p-4 border border-neural-500/10 
                         hover:border-neural-500/30 transition-all duration-200 hover:-translate-y-0.5
                         hover:shadow-lg hover:shadow-neural-500/10"
            >
              <div className="w-9 h-9 rounded-lg bg-neural-500/15 flex items-center justify-center mb-2 group-hover:bg-neural-500/25 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neural-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Ler URL</h3>
              <p className="text-xs text-gray-500">
                Cole uma URL e extraia o conteúdo.
              </p>
            </Link>

            {/* Card: Text */}
            <Link
              href="/paste"
              className="group block bg-surface rounded-xl p-4 border border-neural-500/10 
                         hover:border-purple-500/30 transition-all duration-200 hover:-translate-y-0.5
                         hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center mb-2 group-hover:bg-purple-500/25 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Colar Texto</h3>
              <p className="text-xs text-gray-500">
                Cole ou digite qualquer texto.
              </p>
            </Link>

            {/* Card: PDF */}
            <Link
              href="/pdf"
              className="group block bg-surface rounded-xl p-4 border border-neural-500/10 
                         hover:border-accent-cyan/30 transition-all duration-200 hover:-translate-y-0.5
                         hover:shadow-lg hover:shadow-accent-cyan/10"
            >
              <div className="w-9 h-9 rounded-lg bg-accent-cyan/15 flex items-center justify-center mb-2 group-hover:bg-accent-cyan/25 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Ler PDF</h3>
              <p className="text-xs text-gray-500">
                Faça upload de um PDF.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}