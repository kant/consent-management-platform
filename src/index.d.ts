type ShortVendorList = {
    version: number;
    purposeIDs: number[];
    purposesByVID: { [String]: number[] };
    legIntPurposesByVID: { [String]: number[] };
    featuresIdsByVID: { [String]: number[] };
};

type ConsentData = {
    cookieVersion: number;
    cmpId: number;
    cmpVersion: number;
    vendorListVersion: number;
    created: Date;
    lastUpdated: Date;
    consentScreen: number;
    consentLanguage: string;
};

type Provider = {};

type CommandCallback = (
    res: VendorConsentResponse | ConsentDataResponse | PingResponse,
    ok?: boolean,
) => void;

type VendorConsentResponse = ConsentData & {
    maxVendorId: number;
    purposeConsents: { [String]: number };
    vendorConsents: { [String]: number };
};

type PingResponse = {
    cmpLoaded: boolean;
    gdprAppliesGlobally: boolean;
};

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
