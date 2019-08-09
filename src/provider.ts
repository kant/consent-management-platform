// import { shortVendorList as shortVendorListData } from './vendor-list/short-vendor-list';

const CMP_GLOBAL_NAME = '__cmp';
const CMP_ID = 112;
const CMP_VERSION = 1.1;
const COOKIE_VERSION = 1.1; // TODO: Verify this
const COOKIE_NAME = 'euconsent';
const COOKIE_MAX_AGE = 33696000;

const defaultConfig = {
    storeConsentGlobally: false,
    storePublisherData: false,
    logging: false,
    gdprApplies: true,
};
const commandQueue: Command[] = [];
const eventListeners: { [s: string]: ((obj: {}) => void)[] } = {};
let isLoaded = false;
let cmpReady = false;

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
    addEventListener: (event: string, callback: (res: {}) => void): void => {
        const eventSet = eventListeners[event] || [];
        eventSet.push(callback);
        eventListeners[event] = eventSet;

        if (event === 'isLoaded' && isLoaded) {
            callback({ event });
        } else if (event === 'cmpReady' && cmpReady) {
            callback({ event });
        }
    },
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
    commandQueue.reverse();

    let i = commandQueue.length - 1;

    while (i >= 0) {
        const {
            callId,
            command,
            parameter,
            callback,
            event,
        } = commandQueue.splice(i, 1)[0];

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

        i -= 1;
    }
};

// TODO: TEST THIS
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

// TODO: TEST THIS
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

        isLoaded = true;
        notify('isLoaded');

        // Execute previously queued command
        processCommandQueue();

        cmpReady = true;
        notify('cmpReady');
    }
};
