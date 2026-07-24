import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const useRun = (runId) => {
    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRun = useCallback(async () => {
        if (!runId) return;

        try {
            setLoading(true);
            setError("");

            const { data } = await api.get(`/runs/${runId}`);

            setRun(data.run || data);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to fetch run."
            );
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        fetchRun();
    }, [fetchRun]);

    return {
        run,
        loading,
        error,
        refetch: fetchRun,
        setRun,
    };
};

export default useRun;