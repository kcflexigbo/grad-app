import { useState, useEffect, useRef } from 'react';

const ReadyState = {
    Connecting: 0,
    Open: 1,
    Closing: 2,
    Closed: 3,
} as const;


type ReadyState = typeof ReadyState[keyof typeof ReadyState];

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
        if (url === null) {
            return;
        }

        const socket = new WebSocket(url);
        ws.current = socket;
        setReadyState(ReadyState.Connecting);

        socket.onopen = () => {
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
            setReadyState(ReadyState.Closed);
            ws.current = null;
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setReadyState(ReadyState.Closed);
        };

        return () => {
            if (socket.readyState === ReadyState.Open) {
                socket.close();
            }
        };
    }, [url]);

    const sendMessage = (data: any) => {
        if (ws.current && ws.current.readyState === ReadyState.Open) {
            ws.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    };

    return { lastMessage, readyState, sendMessage };
};