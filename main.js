const { webSocket } = rxjs.webSocket;
const { fromEvent, Subject, of, merge, throwError } = rxjs;
const { groupBy, mergeMap, scan, throttleTime, switchMap, delay, map, filter, catchError, retry, tap, retryWhen } = rxjs.operators;
import { getUser, register } from './service.js';

const ws$ = webSocket('wss://demo-game.debugger.pl');
const rank$ = new Subject();

function initLeaderboard() {

}
rank$
    .pipe(
        groupBy((value) => value.username),
        tap(val => console.log(val)),
        mergeMap((g) => g.pipe(
            filter((val) => val.score !== undefined),
            map((val) => ({ [g.key]: val.score }))
        )),
        scan((acc, item) => ({ ...acc, ...item }), {}),
        map((val) => Object.entries(val).sort((a, b) => b[1] - a[1]))
    )
    .subscribe((val) => {
        els.rank.innerHTML = `${val.map((item) => `<div>${item[0]}: ${item[1]}</div>`).join('')}`
    })

const els = {
    box: document.querySelector('.box'),
    count: document.querySelector('.count > span'),
    rank: document.querySelector('.rank')
}

function init() {
    ws$.subscribe(message => {
        updateUser(message);
        els.count.innerText = message.size;
        rank$.next(message);
    });

    fromEvent(document, 'mousemove').pipe(
        throttleTime(15),
        map((ev) => ({ clientX: ev.clientX, clientY: ev.clientY }))
    ).subscribe(cords => {
        ws$.next(cords);
    });

    fromEvent(document, 'click').pipe(
        filter(ev => ev.target.id === 'gift'),
    ).subscribe(ev => {
        ws$.next({ type: 'hit' });
    });
}


function createUser(username) {
    const el = document.createElement('div');
    el.classList.add('el');
    el.id = username;
    els.box.appendChild(el);
    return el;
}

function updateUser({ type, username, clientX, clientY, score }) {
    let el = document.querySelector(`#${username}`);
    if (type === 'remove') {
        el && el.remove();
        return;
    }

    el = el || createUser(username);
    el.innerHTML = `${username} <br> ${(score || '0')}`
    el.style.left = clientX - el.offsetWidth / 2 + "px";
    el.style.top = clientY - el.offsetHeight / 2 + "px";
}



function userNotFound() {
    of('your name').pipe(
        map((txt) => prompt(txt)),
        filter((val) => !!val),
        switchMap(val => register(val)),
        catchError((err) => {
            alert(JSON.stringify(err.response.error));
            return throwError(err);
        }),
        retry(3)
    )
        .subscribe({
            next: ({ username }) => {
                init();
            },
            error: (err) => {
                console.error(err);
                alert('Too many attempts or another error occured.');
            }
        });
}



getUser().subscribe(
    init,
    (err) => {
        userNotFound();
    }
);


ws$.subscribe(message => {
    updateUser(message)
});