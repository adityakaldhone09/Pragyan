import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (!isMainThread) {
  const raw = String(workerData ?? '');

  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const result = JSON.parse(cleaned);
    parentPort?.postMessage({ ok: true, result });
  } catch (error) {
    parentPort?.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      raw,
    });
  }
}

interface WorkerSuccess<T> {
  ok: true;
  result: T;
}

interface WorkerFailure {
  ok: false;
  error: string;
  raw: string;
}

type WorkerMessage<T> = WorkerSuccess<T> | WorkerFailure;

export function parseJsonAsync<T = unknown>(data: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const worker = new Worker(__filename, { workerData: data });

    worker.once('message', (message: WorkerMessage<T>) => {
      void worker.terminate();
      if (message.ok) {
        settle(() => resolve(message.result));
        return;
      }

      settle(() =>
        reject(
          new Error(
            `parseJsonAsync: JSON parse failed - ${message.error}\n` +
              `Raw (first 300 chars): ${message.raw.slice(0, 300)}`
          )
        )
      );
    });

    worker.once('error', (error) => {
      void worker.terminate();
      settle(() => reject(new Error(`parseJsonAsync: worker failed - ${error.message}`)));
    });

    worker.once('exit', (code) => {
      if (code !== 0) {
        settle(() => reject(new Error(`parseJsonAsync: worker exited with code ${code}`)));
      }
    });
  });
}
