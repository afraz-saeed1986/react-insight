import { Runtime } from "./runtime";
import { loggerPlugin } from "./plugins";

async function bootstrap() {
  const runtime = new Runtime();

  await runtime.registerPlugin(loggerPlugin());

  await runtime.unregisterPlugin("logger");
}

void bootstrap();
