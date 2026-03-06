import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getHeader(request: NextRequest, name: string) {
    return request.headers.get(name) ?? null;
}

function describeDeepLKey(apiKey: string | undefined) {
    if (!apiKey) {
        return {
            present: false,
            length: 0,
            tierHint: null,
            suffix: null,
        };
    }

    const suffix = apiKey.includes(":") ? apiKey.slice(apiKey.lastIndexOf(":")) : null;
    const tierHint = suffix === ":fx" ? "free" : suffix === ":pro" ? "pro" : "unknown";

    return {
        present: true,
        length: apiKey.length,
        tierHint,
        suffix,
    };
}

export async function GET(request: NextRequest) {
    const deepL = describeDeepLKey(process.env.DEEPL_API_KEY);

    return NextResponse.json(
        {
            ok: true,
            timestamp: new Date().toISOString(),
            runtime: "nodejs",
            nodeEnv: process.env.NODE_ENV ?? null,
            vercel: {
                env: process.env.VERCEL_ENV ?? null,
                url: process.env.VERCEL_URL ?? null,
                region: process.env.VERCEL_REGION ?? null,
                projectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
                branchUrl: process.env.VERCEL_BRANCH_URL ?? null,
                gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
                gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
            },
            request: {
                url: request.url,
                host: getHeader(request, "host"),
                origin: getHeader(request, "origin"),
                referer: getHeader(request, "referer"),
                userAgent: getHeader(request, "user-agent"),
                forwardedHost: getHeader(request, "x-forwarded-host"),
                forwardedProto: getHeader(request, "x-forwarded-proto"),
                forwardedFor: getHeader(request, "x-forwarded-for"),
                realIp: getHeader(request, "x-real-ip"),
            },
            deepl: deepL,
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        }
    );
}
