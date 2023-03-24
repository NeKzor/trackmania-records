const campaignMenu = {
    tmnforever: [
        { name: 'TMNF' },
    ],
    united: [
        { name: 'Bay' },
        { name: 'Coast' },
        { name: 'Desert' },
        { name: 'Island' },
        { name: 'Platform' },
        { name: 'Puzzle' },
        { name: 'Rally' },
        { name: 'Snow' },
        { name: 'Stadium' },
        { name: 'TMF' },
        { name: 'TMN' },
        { name: 'TMO Beta' },
        { name: 'TMO Demo' },
        { name: 'TMO' },
        { name: 'TMS' },
        { name: 'TMSB' },
        { name: 'TMU Stunt' },
    ],
    nations: [
        { name: 'Nations' },
        { name: 'Bonus' },
        { name: 'Pro' },
    ],
    sunrise: [
        { name: 'Sunrise' },
    ],
    original: [
        { name: 'Race' },
        { name: 'Puzzle' },
        { name: 'Platform' },
        { name: 'Stunts' },
        { name: 'Survival' },
        { name: 'TMO Demo' },
        { name: 'Demo' },
        { name: 'Beta' },
    ],
    tm2: [
        { name: 'Canyon' },
        { name: 'Stadium' },
        { name: 'Valley' },
        { name: 'Lagoon' },
        { name: 'Platform' },
    ],
};

const getInitialCampaignValue = (gameName) => campaignMenu[gameName].at(0)?.name ?? '';

export { campaignMenu, getInitialCampaignValue };
