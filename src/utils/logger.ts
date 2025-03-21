/**
 * Logger utility for consistent logging across the application
 * In production, this could be connected to a service like Sentry or LogRocket
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class Logger {
  private isProduction: boolean;
  private appVersion: string;

  constructor() {
    this.isProduction = import.meta.env.PROD || false;
    this.appVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    options?: LogOptions,
  ): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (options?.tags) {
      const tagsStr = Object.entries(options.tags)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      formattedMessage += ` [${tagsStr}]`;
    }

    return formattedMessage;
  }

  debug(message: string, options?: LogOptions): void {
    if (!this.isProduction) {
      console.debug(
        this.formatMessage("debug", message, options),
        options?.extra || "",
      );
    }
  }

  info(message: string, options?: LogOptions): void {
    console.info(
      this.formatMessage("info", message, options),
      options?.extra || "",
    );
  }

  warn(message: string, options?: LogOptions): void {
    console.warn(
      this.formatMessage("warn", message, options),
      options?.extra || "",
    );
  }

  error(message: string, error?: Error, options?: LogOptions): void {
    console.error(
      this.formatMessage("error", message, options),
      error || "",
      options?.extra || "",
    );

    // In production, you would send this to an error reporting service
    if (this.isProduction && error) {
      // Example: errorReportingService.captureException(error, { ...options, message });
    }
  }

  // Track user actions or events
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (this.isProduction) {
      // Example: analyticsService.track(eventName, properties);
    } else {
      this.debug(`EVENT: ${eventName}`, { extra: properties });
    }
  }
}

export default new Logger();
