import { useState, useEffect, useRef } from "react";
import { getDashboardSummary } from "../api/stats";
import { DashboardSummary } from "../types/api";

const POLL_INTERVAL = 30000; // 30 seconds

export const useDashboard = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = async () => {
        try {
            const result = await getDashboardSummary();
            setData(result);
            setError(null);
        } catch {
            setError("Failed to fetch stats summary.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    return { data, loading, error, refresh: fetchData };
};