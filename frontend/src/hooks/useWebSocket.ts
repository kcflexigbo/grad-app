import { useState, useEffect, useRef } from 'react';

// Ready state constants for WebSocket connections
enum ReadyState {
    Connecting = 0,
    Open = 1,
    Closing = 2,
    Closed = 3,
}

// The hook's return type
interface WebSocketHook<T> {
    lastMessage: T | null;
    readyState: ReadyState;
    sendMessage: (data: any) => void;
}

export const useWebSocket = <T,>(url: string | null): WebSocketHook<T> => {
    const [lastMessage, setLastMessage] = useState<T | null>(null);
    const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Don't connect if the URL is null (e.g., waiting for an ID)
        if (url === null) {
            return;
        }

        // Create a new WebSocket connection
        const socket = new WebSocket(url);
        ws.current = socket;
        setReadyState(ReadyState.Connecting);

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            setReadyState(ReadyState.Open);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as T;
                setLastMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            setReadyState(ReadyState.Closed);
            ws.current = null;
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setReadyState(ReadyState.Closed); // Often closes after an error
        };

        // Crucial cleanup function: close the socket when the component unmounts
        return () => {
            if (socket.readyState === ReadyState.Open) {
                socket.close();
            }
        };
    }, [url]); // Re-run the effect if the URL changes

    const sendMessage = (data: any) => {
        if (ws.current && ws.current.readyState === ReadyState.Open) {
            ws.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    };

    return { lastMessage, readyState, sendMessage };
};