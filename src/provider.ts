import { init as initStore } from './store';
import { shortVendorList as shortVendorListData } from './vendor-list/short-vendor-list';

const CMP_GLOBAL_NAME = '__cmp';
const CMP_ID = 112;
const CMP_VERSION = 1.1;
const COOKIE_VERSION = 1.1; // TODO: Verify this
// const COOKIE_NAME = 'euconsent';
// const COOKIE_MAX_AGE = 33696000;

const createProvider = (): Provider => {
    // Pull queued commands from the CMP stub
    let { commandQueue = [] }: { commandQueue: Command[] } =
        window[CMP_GLOBAL_NAME] || {};

    // const store = initStore(
    //     CMP_ID,
    //     CMP_VERSION,
    //     COOKIE_VERSION,
    //     shortVendorListData,
    // );

    const commands = {
        getVendorConsents: (): void => {},
        getConsentData: (): void => {},
        getVendorList: (): void => {},
        ping: (): void => {},
        addEventListener: (): void => {},
    };

    const processCommand = (
        command: string,
        parameter: string | null,
        callback: CommandCallback = (): void => {},
    ): void => {
        if (typeof this.commands[command] !== 'function') {
            // log.error(`Invalid CMP command "${command}"`);
        } else {
            // log.info(
            //     `Proccess command: ${command}, parameter: ${parameter ||
            //         'unknown'}`,
            // );
            commands[command](parameter, callback);
        }
    };

    const processCommandQueue = (): void => {
        const queue = [...commandQueue];

        if (queue.length) {
            // log.info(`Process ${queue.length} queued commands`);
            commandQueue = [];

            queue.forEach(
                ({ callId, command, parameter, callback, event }): void => {
                    if (event) {
                        processCommand(
                            command,
                            parameter,
                            (returnValue): void => {
                                event.source.postMessage(
                                    {
                                        __cmpReturn: {
                                            callId,
                                            command,
                                            returnValue,
                                        },
                                    },
                                    event.origin,
                                );
                            },
                        );
                    } else {
                        processCommand(command, parameter, callback);
                    }
                },
            );
        }
    };

    const receiveMessage = ({ data, origin, source }: MessageEvent): void => {
        if (data instanceof Object) {
            const { __cmpCall: cmp }: MessageData = data;

            if (cmp) {
                // log.info(`Message from: ${origin}`);
                const { callId, command, parameter } = cmp;

                const commandCallback: CommandCallback = (
                    returnValue,
                ): void => {
                    source.postMessage(
                        { __cmpReturn: { callId, command, returnValue } },
                        origin,
                    );
                };

                if (source && source.postMessage) {
                    processCommand(command, parameter, commandCallback);
                } else {
                    // log.debug(
                    //     `Missing source: Unable to process command from ${origin}`,
                    // );
                }
            }
        }
    };

    processCommand.receiveMessage = receiveMessage;

    const eventListeners: { [s: string]: ((obj: {}) => void)[] } = {};

    const notify = (event: string, data?: MessageData): void => {
        // log.info(`Notify event: ${event}`);
        const eventSet = eventListeners[event] || [];

        eventSet.forEach((listener): void => {
            listener({ event, data });
        });

        // Process any queued commands that were waiting for consent data
        if (event === 'onSubmit') {
            processCommandQueue();
        }
    };

    return {
        processCommand,
        processCommandQueue,
        notify,
    };
};

export const init = (): void => {
    // Only run our CmpService if prepareCmp has added the CMP stub
    if (window[CMP_GLOBAL_NAME]) {
        const provider = createProvider();
        // Expose `processCommand` as the CMP implementation
        window[CMP_GLOBAL_NAME] = provider.processCommand;
        // provider.isLoaded = true;
        provider.notify('isLoaded');
        // Execute any previously queued command
        provider.processCommandQueue();
        // provider.cmpReady = true;
        provider.notify('cmpReady');
    }
};
