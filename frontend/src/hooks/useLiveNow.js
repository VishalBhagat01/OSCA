import { useSyncExternalStore } from "react";

let cachedNow = typeof Date !== "undefined" ? Date.now() : 0;
const listeners = new Set();
let intervalId = null;

function tick() {
    cachedNow = Date.now();
    listeners.forEach((listener) => {
        try {
            listener();
        } catch {
            // Ignore callback errors
        }
    });
}

function subscribe(listener) {
    listeners.add(listener);
    if (listeners.size === 1) {
        cachedNow = Date.now();
        intervalId = setInterval(tick, 1000);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
}

function getSnapshot() {
    return cachedNow;
}

function getServerSnapshot() {
    return 0;
}

export function useLiveNow(enabled = true) {
    const currentNow = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return enabled ? currentNow : 0;
}

export default useLiveNow;
