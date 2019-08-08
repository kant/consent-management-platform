let shortVendorList: ShortVendorList | undefined;
// let consentData: ConsentData | undefined;

const init = (
    cmpId: number,
    cmpVersion: number,
    cookieVersion: number,
    shortVendorListData: ShortVendorList,
): void => {
    shortVendorList = shortVendorListData;
};

export { init };
