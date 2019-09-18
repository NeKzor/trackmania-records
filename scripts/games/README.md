# Scripts

## TM

```js
{
    let tracks = [];
    for (let track of document.querySelector('#ctl03_Windowrow3, #_ctl3_Windowrow3').children[0].children[0].children) {
        if (track.children[0].children[1]) {
            let id = track.children[0].children[1].getAttribute('href').slice(30, -5);
            let name = track.children[0].children[2].textContent;
            tracks.push({ id, name });
        }
    }
    copy(tracks.map((t) => "'" + t.id + "', // " + t.name).join('\n'));
}
```

## MP

```js
{
    let tracks = [];
    for (let track of document.querySelector('#searchResults').children[0].children[0].children) {
        if (track.children[0].children[1]) {
            let id = track.children[0].children[1].getAttribute('href').slice(23);
            let name = track.children[0].children[2].textContent;
            tracks.push({ id, name });
        }
    }
    copy(tracks.map((t) => "'" + t.id + "', // " + t.name).join('\n'));
}
```
