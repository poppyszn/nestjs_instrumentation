import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  SpanProcessor,
  Span,
  SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'nojic-jqs-backend',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),
);

// Custom Span Processor to filter out non-error spans
class ErrorSpanProcessor implements SpanProcessor {
  constructor(private _exporter: SpanExporter) {}

  onStart(span: Span): void {
    // No-op
  }

  onEnd(span: Span): void {
    if (span.status.code !== 0) {
      // Only export spans with non-OK status
      this._exporter.export([span], () => {});
    }
  }

  shutdown(): Promise<void> {
    return this._exporter.shutdown();
  }

  forceFlush(): Promise<void> {
    return this._exporter.forceFlush();
  }
}

// Configure tracing
const traceProvider = new NodeTracerProvider({
  resource: resource,
});
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // replace with your OTEL collector URL // add it as an ENV Varible
});
traceProvider.addSpanProcessor(new ErrorSpanProcessor(traceExporter));
traceProvider.register();

// Configure metrics
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4318/v1/metrics', // replace with your OTEL collector URL // add it as an ENV Varible
});
const meterProvider = new MeterProvider({
  resource: resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000, // adjust the interval as needed
    }),
  ],
});

// Register instrumentations
registerInstrumentations({
  tracerProvider: traceProvider,
  meterProvider: meterProvider,
  instrumentations: [new HttpInstrumentation(), new NestInstrumentation()],
});

console.log('Tracing and Metrics initialized');
