"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="glass sticky top-0 z-50 px-4 sm:px-8 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                {/* ── Logo ── */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-neural-500 to-accent-cyan flex items-center justify-center transition-transform group-hover:scale-105">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    </div>
                    <div>
                        <span className="text-base font-bold bg-linear-to-r from-neural-300 to-accent-cyan bg-clip-text text-transparent">
                            Leitor Neural
                        </span>
                        <span className="block text-[10px] text-gray-500 -mt-0.5">
                            Produtividade Pessoal
                        </span>
                    </div>
                </Link>

                {/* ── Nav Links ── */}
                <div className="flex items-center gap-1">
                    <Link
                        href="/read"
                        className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-neural-500/10 transition-all"
                    >
                        URL
                    </Link>
                    <Link
                        href="/paste"
                        className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-neural-500/10 transition-all"
                    >
                        Texto
                    </Link>
                    <Link
                        href="/pdf"
                        className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-neural-500/10 transition-all"
                    >
                        PDF
                    </Link>
                </div>
            </div>
        </nav>
    );
}
