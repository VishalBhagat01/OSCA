import { useCallback, useEffect, useState, useRef } from "react";
import runService from "../services/runService";

export const useRun = (runId) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const runRef = useRef(null);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    if (!runId) return;

    let active = true;

    runService
      .getRun(runId)
      .then((runData) => {
        if (!active) return;
        setRun(runData);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        console.error("[useRun] Initial fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch run details."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [runId]);

  const refetch = useCallback(
    async (options = {}) => {
      if (!runId) return;
      const silent = options.silent ?? true;

      if (!silent && !runRef.current) {
        setLoading(true);
      }
      setIsFetching(true);

      try {
        const runData = await runService.getRun(runId);
        setRun(runData);
        setError("");
      } catch (err) {
        console.error("[useRun] Refetch error:", err);
        if (!runRef.current) {
          setError(
            err.response?.data?.message || "Failed to update run details."
          );
        }
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [runId]
  );

  return {
    run,
    loading,
    isFetching,
    error,
    refetch,
    setRun,
  };
};

export default useRun;