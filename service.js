const { ajax } = rxjs.ajax;

export function register(username) {
    return ajax({
        url: '//demo-game.debugger.pl/register',
        method: 'POST',
        body: JSON.stringify({ username }),
        headers: { 'content-type': 'application/json' },
        crossDomain: true,
        withCredentials: true
    })
}

export function getUser() {
    return ajax({
        url: '//demo-game.debugger.pl/get-user',
        method: 'GET',
        crossDomain: true,
        withCredentials: true
    });
}
