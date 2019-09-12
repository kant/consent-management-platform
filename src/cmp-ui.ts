import { readGuCookie, readIabCookie } from './cookies';
import { CMP_DOMAIN, CMP_READY_MSG, CMP_CLOSE_MSG } from './config';

type Callback = () => void;

export const setupMessageHandlers = (
    onReadyCmp: Callback,
    onCloseCmp: Callback,
): void => {
    const receiveMessage = (event: MessageEvent): void => {
        const { origin, data } = event;

        if (origin !== CMP_DOMAIN) {
            return;
        }

        switch (data) {
            case CMP_READY_MSG:
                onReadyCmp();
                break;
            case CMP_CLOSE_MSG:
                onCloseCmp();
                break;
            default:
                break;
        }
    };

    window.addEventListener('message', receiveMessage, false);
};

export const canShow = (): boolean => !readGuCookie() || !readIabCookie();
