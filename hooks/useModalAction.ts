import { useRef } from "react";
import { Platform } from "react-native";

const ANDROID_DISMISS_MS = 300;

export function useModalAction() {
    const pending = useRef<(() => void) | null>(null);

    const close = (action: () => void, setVisible: (v: boolean) => void) => {
        pending.current = action;
        setVisible(false);
        if (Platform.OS === "android") {
            setTimeout(() => {
                pending.current?.();
                pending.current = null;
            }, ANDROID_DISMISS_MS);
        }
    };
    const modalProperty = {
        onDismiss: () => {
            if (Platform.OS === "ios") {
                pending.current?.();
                pending.current = null;
            }
        },
    };
    return { close, modalProperty };
}