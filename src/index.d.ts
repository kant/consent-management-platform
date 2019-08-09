type ConsentMetaData = {
    cookieVersion: number;
    cmpId: number;
    cmpVersion: number;
    vendorListVersion: number;
    created: Date;
    lastUpdated: Date;
    consentScreen: number;
    publisherPurposeVersion?: number;
};

type VendorConsentResponse = {
    metadata: ConsentMetaData;
    gdprApplies: boolean;
    hasGlobalScope: boolean;
    purposeConsents: { [key: number]: boolean };
    vendorConsents: { [key: number]: boolean };
};

type ConsentDataResponse = {
    consentData?: string;
    gdprApplies: boolean;
    hasGlobalScope: boolean;
};

type PingResponse = {
    // cmpLoaded: boolean;
    // gdprAppliesGlobally: boolean;
};

type CommandCallback = (
    res: VendorConsentResponse | ConsentDataResponse | PingResponse,
    ok?: boolean,
) => void;

type Command = {
    callId: string;
    command: string;
    parameter: string;
    callback: CommandCallback;
    event: MessageEvent;
};

type MessageData = {
    __cmpCall?: {
        callId: string;
        command: string;
        parameter: string;
    };
};

/** from frontend * */

// type ShortVendorList = {
//     version: number;
//     purposeIDs: number[];
//     purposesByVID: { [String]: number[] };
//     legIntPurposesByVID: { [String]: number[] };
//     featuresIdsByVID: { [String]: number[] };
// };
