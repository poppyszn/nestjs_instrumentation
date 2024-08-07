# nestjs_instrumentation
## Modules Required
- "@opentelemetry/auto-instrumentations-node"
- "@opentelemetry/exporter-metrics-otlp-grpc"
- "@opentelemetry/exporter-metrics-otlp-proto"
- "@opentelemetry/exporter-trace-otlp-proto"
- "@opentelemetry/instrumentation-nestjs-core"
- "@opentelemetry/sdk-node"

After installing the necessary modules, import the file in your `main.ts` using `import './instrumentation';`
