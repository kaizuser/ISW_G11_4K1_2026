import { useEffect, useState } from 'react';
import { ApiError } from './api';

/** Loads `load(id)` when the page opens (or the id changes) and exposes the result or its error. */
export function useResource<T>(load: (id: string) => Promise<T>, id: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let current = true;
    async function run() {
      try {
        const result = await load(id);
        if (current) setData(result);
      } catch (caught) {
        if (current) {
          setError(caught instanceof ApiError ? caught.message : 'Algo salió mal. Intenta nuevamente.');
        }
      }
    }
    void run();
    return () => {
      current = false;
    };
  }, [load, id]);

  return { data, error };
}
