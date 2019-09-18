export default (game) =>
    game === 'tm2'
        ? {
              trackUrl: (id) => `https://tm.mania-exchange.com/tracks/${id}`,
              imageUrl: (id) => `https://tm.mania-exchange.com/tracks/screenshot/normal/${id}`,
              replayUrl: (id) => `https://tm.mania-exchange.com/replays/download/${id}`,
              userUrl: (id) => `https://tm.mania-exchange.com/user/profile/${id}`,
          }
        : (() => ({
              trackUrl: (id) => `https://${game}.tm-exchange.com/main.aspx?action=trackshow&id=${id}`,
              imageUrl: (id) => `https://${game}.tm-exchange.com/getclean.aspx?action=trackscreenscreens&id=${id}`,
              replayUrl: (id) => `https://${game}.tm-exchange.com/get.aspx?action=recordgbx&id=${id}`,
              userUrl: (id) => `https://${game}.tm-exchange.com/main.aspx?action=usershow&id=${id}`,
          }))();
