const protocol = (game) => (['nations', 'sunrise', 'original'].includes(game) ? 'http' : 'https');

export default (game) =>
    game === 'tm2'
        ? {
              trackUrl: (id) => `https://tm.mania-exchange.com/tracks/${id}`,
              imageUrl: (id) => `https://tm.mania-exchange.com/tracks/screenshot/normal/${id}`,
              replayUrl: (id) => `https://tm.mania-exchange.com/replays/download/${id}`,
              userUrl: (id) => `https://tm.mania-exchange.com/user/profile/${id}`,
          }
        : game === 'tmwii'
        ? {
              trackUrl: (id) => `https://speedrun.com/tmwii/${id}`,
              imageUrl: (id) => undefined,
              replayUrl: (id) => undefined,
              userUrl: (id) => `https://www.speedrun.com/user/${id}`,
          }
        : (() => ({
              trackUrl: (id) => `${protocol(game)}://${game}.tm-exchange.com/main.aspx?action=trackshow&id=${id}`,
              imageUrl: (id) =>
                  `${protocol(game)}://${game}.tm-exchange.com/getclean.aspx?action=trackscreenscreens&id=${id}`,
              replayUrl: (id) => `${protocol(game)}://${game}.tm-exchange.com/get.aspx?action=recordgbx&id=${id}`,
              userUrl: (id) => `${protocol(game)}://${game}.tm-exchange.com/main.aspx?action=usershow&id=${id}`,
          }))();
