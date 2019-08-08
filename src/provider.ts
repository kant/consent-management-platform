// import { shortVendorList as shortVendorListData } from './vendor-list/short-vendor-list';

const defaultConfig = {
    storeConsentGlobally: false,
    storePublisherData: false,
    logging: false,
    gdprApplies: true,
};
const CMP_GLOBAL_NAME = '__cmp';
const CMP_ID = 112;
const CMP_VERSION = 1.1;
const COOKIE_VERSION = 1.1; // TODO: Verify this
const COOKIE_NAME = 'euconsent';
const COOKIE_MAX_AGE = 33696000;

let commandQueue: Command[] = [];

const getMetadata = () => {};

const getPurposeConsentsObj = (): { [key: number]: boolean } => {};

const getVendorConsentsObj = (
    vendorIds: number[],
): { [key: number]: boolean } => {};

const getVendorConsents = (vendorIds: number[]): VendorConsentResponse => {
    return {
        metadata: getMetadata(),
        gdprApplies: defaultConfig.gdprApplies,
        hasGlobalScope: defaultConfig.storeConsentGlobally,
        purposeConsents: getPurposeConsentsObj(),
        vendorConsents: getVendorConsentsObj(vendorIds),
    };
};

const commands = {
    getVendorConsents: (
        vendorIds: number[],
        callback: CommandCallback = () => {},
    ): void => {
        const vendorConsents = getVendorConsents(vendorIds);
        callback(vendorConsents, true);
    },
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
    if (typeof commands[command] !== 'function') {
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
                    processCommand(command, parameter, (returnValue): void => {
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
                    });
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

            const commandCallback: CommandCallback = (returnValue): void => {
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

export const init = (): void => {
    // Only run our CmpService if prepareCmp has added the CMP stub
    if (window[CMP_GLOBAL_NAME]) {
        const queuedCommands: Command[] =
            window[CMP_GLOBAL_NAME].commandQueue || [];

        // Push queuedCommands from the CMP stub into the commandQueue
        queuedCommands.forEach((command: Command): void => {
            commandQueue.push(command);
        });

        // Expose `processCommand` as the CMP implementation
        window[CMP_GLOBAL_NAME] = processCommand;

        // Expose `receiveMessage` on the CMP implementation
        window[CMP_GLOBAL_NAME].receiveMessage = receiveMessage;

        notify('isLoaded');

        // Execute previously queued command
        processCommandQueue();

        notify('cmpReady');
    }
};
