import * as Cookies from 'js-cookie';
import { ConsentString } from 'consent-string';
import {
    IAB_CMP_ID,
    IAB_CMP_VERSION,
    IAB_CONSENT_SCREEN,
    IAB_CONSENT_LANGUAGE,
    CMP_LOGS_URL,
    isProd,
} from './config';
import { writeIabCookie, writeLegacyCookie } from './cookies';
import { updateStateOnSave } from './cmp';
import { IabPurposeState, CmpMsgData } from './types';

const DUMMY_BROWSER_ID = `No bwid available`;

export const save = ({
    iabVendorList,
    allowedPurposes,
    allowedVendors,
}: CmpMsgData): Promise<Response> => {
    const consentData = new ConsentString();
    consentData.setGlobalVendorList(iabVendorList);
    consentData.setCmpId(IAB_CMP_ID);
    consentData.setCmpVersion(IAB_CMP_VERSION);
    consentData.setConsentScreen(IAB_CONSENT_SCREEN);
    consentData.setConsentLanguage(IAB_CONSENT_LANGUAGE);
    consentData.setPurposesAllowed(allowedPurposes);
    consentData.setVendorsAllowed(allowedVendors);

    const consentStr = consentData.getConsentString();

    writeIabCookie(consentStr);

    const newIabState: IabPurposeState = {
        1: consentData.isPurposeAllowed(1),
        2: consentData.isPurposeAllowed(2),
        3: consentData.isPurposeAllowed(3),
        4: consentData.isPurposeAllowed(4),
        5: consentData.isPurposeAllowed(5),
    };

    updateStateOnSave(newIabState);

    const pAdvertising = Object.keys(newIabState).every(
        id => newIabState[parseInt(id, 10)] === true,
    );

    writeLegacyCookie(pAdvertising);

    const browserID = Cookies.get('bwid') || DUMMY_BROWSER_ID;

    if (isProd && browserID === DUMMY_BROWSER_ID) {
        throw new Error(`Error getting browserID in PROD`);
    }

    const logInfo = {
        version: '1',
        iab: consentStr,
        source: 'www',
        purposes: {
            personalisedAdvertising: pAdvertising,
        },
        browserId: browserID,
        variant: 'CmpUiIab-variant',
    };

    return fetch(CMP_LOGS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logInfo),
    });
};
