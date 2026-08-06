import type { Logger } from './logger.js';
import { silentLogger } from './logger.js';

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/** Token bucket algorithm for rate limiting. */
export class TokenBucket {
  readonly capacity: number;
  readonly refillRate: number;
  private tokens: number;
  private lastRefillTime: number;
  private readonly logger: Logger;

  /**
   * @param capacity   Maximum number of tokens the bucket can hold.
   * @param refillRate Number of tokens added per second.
   */
  constructor(capacity: number, refillRate: number, logger: Logger = silentLogger) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefillTime = Date.now() / 1000;
    this.logger = logger;
  }

  /** Refill tokens based on elapsed time. */
  private refill(): void {
    const now = Date.now() / 1000;
    const elapsed = now - this.lastRefillTime;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
      this.lastRefillTime = now;
    }
  }

  /**
   * Consume tokens from the bucket.
   *
   * @param tokens Number of tokens to consume.
   * @param block  Whether to wait until tokens are available.
   * @returns `true` when the tokens were consumed, `false` when `block` is
   *          `false` and the bucket is short.
   */
  async consume(tokens = 1, block = true): Promise<boolean> {
    for (;;) {
      this.refill();

      if (this.tokens >= tokens) {
        this.tokens -= tokens;
        return true;
      }

      if (!block) {
        return false;
      }

      const tokensNeeded = tokens - this.tokens;
      const waitTime = tokensNeeded / this.refillRate;
      this.logger.debug(
        `Rate limiting: waiting ${waitTime.toFixed(2)} seconds for ${tokensNeeded} tokens...`,
      );
      await sleep(waitTime);
    }
  }
}

/** Rate limiter for API requests. */
export class RateLimiter {
  private readonly tokenBucket: TokenBucket;

  /**
   * @param capacity   Maximum number of tokens the bucket can hold.
   * @param refillRate Number of tokens added per second. The default of 66.67
   *                   matches 20,000 requests per 5 minutes.
   */
  constructor(capacity = 20000, refillRate = 66.67, logger: Logger = silentLogger) {
    this.tokenBucket = new TokenBucket(capacity, refillRate, logger);
  }

  /** Acquire tokens for `requests` API calls. */
  async acquire(requests = 1): Promise<boolean> {
    return this.tokenBucket.consume(requests);
  }
}
