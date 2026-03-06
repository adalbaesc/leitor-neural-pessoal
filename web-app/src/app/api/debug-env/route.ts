import { NextRequest, NextResponse } from "next/server";
import { hasRateLimitConfig } from "@/lib/rateLimit";
import {
    describeTranslationEndpoint,
    getSpeechServiceConfig,
    getTranslationServiceConfig,
} from "@/lib/cloudServices";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getHeader(request: NextRequest, name: string) {
    return request.headers.get(name) ?? null;
}

export async function GET(request: NextRequest) {
    const translationConfig = getTranslationServiceConfig();
    const speechConfig = getSpeechServiceConfig();

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
            translation: {
                present: Boolean(translationConfig),
                provider: translationConfig?.provider ?? null,
                endpoint: describeTranslationEndpoint(translationConfig?.baseUrl ?? null),
                apiKeyPresent: Boolean(translationConfig?.apiKey),
                defaultTargetLang: translationConfig?.defaultTargetLang ?? "pt",
            },
            speech: {
                present: true,
                provider: speechConfig.provider,
                defaultVoiceId: speechConfig.defaultVoiceId,
                timeoutMs: speechConfig.timeoutMs,
            },
            ratelimit: {
                present: hasRateLimitConfig(),
                urlPresent: Boolean(process.env.UPSTASH_REDIS_REST_URL),
                tokenPresent: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
            },
            legacy: {
                deeplPresent: Boolean(process.env.DEEPL_API_KEY),
                azureTranslatorPresent: Boolean(process.env.AZURE_TRANSLATOR_KEY),
                azureSpeechPresent: Boolean(process.env.AZURE_SPEECH_KEY),
            },
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        }
    );
}
