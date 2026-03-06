import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 pt-16 pb-12">
        <div className="text-center animate-fade-in-up">
          {/* Logo Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-neural-500 to-accent-cyan flex items-center justify-center shadow-2xl shadow-neural-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-white"
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

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Leitor{" "}
            <span className="bg-linear-to-r from-neural-400 to-accent-cyan bg-clip-text text-transparent">
              Neural
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Transforme qualquer artigo, PDF ou texto em uma experiência de leitura
            em voz alta com{" "}
            <span className="text-neural-300">vozes neurais</span>,{" "}
            <span className="text-accent-cyan">tradução automática</span> e{" "}
            acompanhamento visual.
          </p>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card: URL */}
          <Link
            href="/read"
            className="group relative bg-surface rounded-2xl p-6 border border-neural-500/10 
                       hover:border-neural-500/30 transition-all duration-300 hover:-translate-y-1
                       hover:shadow-xl hover:shadow-neural-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-neural-500/15 flex items-center justify-center mb-4 group-hover:bg-neural-500/25 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-neural-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Ler URL</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cole uma URL e extraia o conteúdo limpo para leitura.
            </p>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-neural-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-neural-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card: Text */}
          <Link
            href="/paste"
            className="group relative bg-surface rounded-2xl p-6 border border-neural-500/10 
                       hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1
                       hover:shadow-xl hover:shadow-purple-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4 group-hover:bg-purple-500/25 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Colar Texto</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cole ou digite qualquer texto para ouvir a leitura.
            </p>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card: PDF */}
          <Link
            href="/pdf"
            className="group relative bg-surface rounded-2xl p-6 border border-neural-500/10 
                       hover:border-accent-cyan/30 transition-all duration-300 hover:-translate-y-1
                       hover:shadow-xl hover:shadow-accent-cyan/10"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/15 flex items-center justify-center mb-4 group-hover:bg-accent-cyan/25 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Ler PDF</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Faça upload de um PDF e ouça o conteúdo.
            </p>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent-cyan/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 pb-16">
        <div className="bg-surface rounded-2xl border border-neural-500/10 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Recursos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🎙️",
                title: "Audio Online",
                desc: "Vozes naturais geradas no servidor para funcionar no navegador e no celular.",
              },
              {
                icon: "🌐",
                title: "Tradução Automática",
                desc: "Traduz textos estrangeiros para português com um serviço online configurável.",
              },
              {
                icon: "🎤",
                title: "Efeito Karaokê",
                desc: "Acompanhamento visual sincronizado com a leitura.",
              },
              {
                icon: "⚡",
                title: "Extração Limpa",
                desc: "Remove anúncios, menus e lixo visual automaticamente.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Extensão Chrome ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 pb-16">
        <div className="bg-surface rounded-2xl border border-neural-500/10 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Extensão para Chrome / Edge</h2>
              <p className="text-sm text-gray-400 mt-1">Capture qualquer página web diretamente do navegador.</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {[
              {
                step: "1",
                title: "Baixe a extensão",
                desc: (
                  <>
                    Acesse o{" "}
                    <a
                      href="https://github.com/adalbaesc/leitor-neural-pessoal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neural-400 underline hover:text-neural-300 transition-colors"
                    >
                      repositório no GitHub
                    </a>{" "}
                    e baixe a pasta <code className="text-xs bg-neural-500/20 px-1.5 py-0.5 rounded">chrome-extension/</code>
                  </>
                ),
              },
              {
                step: "2",
                title: "Ative o modo desenvolvedor",
                desc: (
                  <>
                    Acesse{" "}
                    <code className="text-xs bg-neural-500/20 px-1.5 py-0.5 rounded">chrome://extensions/</code>{" "}
                    e ative o toggle {'"'}Modo do desenvolvedor{'"'}
                  </>
                ),
              },
              {
                step: "3",
                title: "Carregue a extensão",
                desc: (
                  <>
                    Clique em {'"'}Carregar sem compactação{'"'} e selecione a pasta{" "}
                    <code className="text-xs bg-neural-500/20 px-1.5 py-0.5 rounded">chrome-extension/</code>
                  </>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-neural-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-neural-400">{item.step}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://github.com/adalbaesc/leitor-neural-pessoal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-neural text-sm rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Acessar no GitHub
          </a>
        </div>
      </section>
    </main>
  );
}
