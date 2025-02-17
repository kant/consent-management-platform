import { readIabCookie } from './cookies';
import { save } from './consent-storage';
import {
    CMP_DOMAIN,
    CMP_READY_MSG,
    CMP_CLOSE_MSG,
    CMP_SAVED_MSG,
} from './config';

type Callback = (error?: Error) => void;

export const setupMessageHandlers = (
    onReadyCmp: Callback,
    onCloseCmp: Callback,
    onErrorCmp: Callback,
): void => {
    const receiveMessage = (event: MessageEvent): void => {
        const withErrorHandling = (callback: Callback): void => {
            try {
                callback();
            } catch (e) {
                onErrorCmp(e);
            }
        };

        const { origin, data } = event;

        if (origin !== CMP_DOMAIN) {
            return;
        }

        const { msgType, msgData } = data;

        switch (msgType) {
            case CMP_READY_MSG:
                withErrorHandling(onReadyCmp);
                break;
            case CMP_CLOSE_MSG:
                withErrorHandling(onCloseCmp);
                break;
            case CMP_SAVED_MSG:
                save(msgData)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(
                                `Error posting to consent logs: ${response.status} | ${response.statusText}`,
                            );
                        }
                    })
                    .catch(error => {
                        onErrorCmp(error);
                    });
                break;
            default:
                break;
        }
    };

    window.addEventListener('message', receiveMessage, false);
};

export const canShow = (): boolean => !readIabCookie(); // TODO: Restore readGuCookie check once we start saving GU cookie
