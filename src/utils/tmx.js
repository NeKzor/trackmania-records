const tmx2 = {
    trackUrl: (id) => `https://tm.mania-exchange.com/tracks/${id}`,
    imageUrl: (id) => `https://tm.mania-exchange.com/tracks/screenshot/normal/${id}`,
    replayUrl: (id) => `https://tm.mania-exchange.com/replays/download/${id}`,
    userUrl: (id) => `https://tm.mania-exchange.com/user/profile/${id}`,
};
const tmx = {
    trackUrl: (id, gameName) => `https://${gameName}.tm-exchange.com/main.aspx?action=trackshow&id=${id}`,
    imageUrl: (id, gameName) => `https://${gameName}.tm-exchange.com/getclean.aspx?action=trackscreenscreens&id=${id}`,
    replayUrl: (id, gameName) => `https://${gameName}.tm-exchange.com/get.aspx?action=recordgbx&id=${id}`,
    userUrl: (id, gameName) => `https://${gameName}.tm-exchange.com/main.aspx?action=usershow&id=${id}`,
};

export default (tm2) => tm2 ? tmx2 : tmx;
