import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

type RateLimitName = "translate" | "tts";

interface RateLimitResult {
    allowed: boolean;
    enabled: boolean;
    limit: number | null;
    remaining: number | null;
    reset: number | null;
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRateLimitEnv = Boolean(redisUrl && redisToken);

const redis = hasRateLimitEnv ? Redis.fromEnv() : null;

const rateLimiters = redis
    ? {
          translate: new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(8, "15 m"),
              analytics: false,
              prefix: "leitor:translate",
          }),
          tts: new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(40, "15 m"),
              analytics: false,
              prefix: "leitor:tts",
          }),
      }
    : null;

export function hasRateLimitConfig() {
    return hasRateLimitEnv;
}

export function getRequestIdentifier(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const host = request.headers.get("host") ?? "unknown-host";
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

    return `${host}:${ip}`;
}

export async function enforceRateLimit(name: RateLimitName, request: NextRequest): Promise<RateLimitResult> {
    if (!rateLimiters) {
        return {
            allowed: true,
            enabled: false,
            limit: null,
            remaining: null,
            reset: null,
        };
    }

    const limiter = rateLimiters[name];
    const result = await limiter.limit(getRequestIdentifier(request));

    return {
        allowed: result.success,
        enabled: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}
