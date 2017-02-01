const socket = new WebSocket("ws://nuclear.t.javascript.ninja");

socket.onopen = function () {
    setTitle("Deactivating power station");
};

socket.onclose = function () {
    // setTitle("DISCONNECTED");
};

socket.onmessage = function (payload) {
    printMessage(payload.data);
};


const statesTried = [];
const nuclear = [null, null, null, null];
let inversion = null;
let leverKnow = 0;
socket.addEventListener('message', (event) => {

    let eventData = JSON.parse(event.data);
    if (eventData.error) {
        console.error(eventData);
        return;
    }

    console.log(`Response event ${JSON.stringify(eventData)}`);


    // Toggle the lever state when pulled
    if ("pulled" in eventData) {
        if ( nuclear[eventData.pulled] !== null) {
            nuclear[eventData.pulled] = ! nuclear[eventData.pulled];
        }
    }


    if ("same" in eventData) {

        if (eventData.same) {
            console.info("Same true");

            if (nuclear[leverKnow] !== null ) {
                nuclear[eventData.lever2] = nuclear[leverKnow];
            } else {
                //First time around, levers 0 and 1 become TRUE
                nuclear[eventData.lever1] = true;
                nuclear[eventData.lever2] = true;
            }

        } else {

            if (nuclear[leverKnow] !== null ) {
                nuclear[eventData.lever2] = ! nuclear[leverKnow];
            }
        }

    } else {
        console.time(`Pulling new state for ID -- ${eventData.stateId}`);

    }

    if(eventData.token) {
        setTitle("Station deactivated");
        console.warn("Station deactivated");
        console.log(eventData.token);
        socket.close();
    }

    if (eventData.newState == "poweredOn") {
        console.warn("Woops, but this time I'll get ya!");
        inversion = nuclear[0];
    }


    // Poweroff Action Watcher
    if (nuclear[3] !== null ) {
        let resultFlag = true;
        let firstValue = nuclear[0];
        for (let i = 1; i < nuclear.length; i++) {
            if (nuclear[i] !== firstValue) {
                resultFlag = false;
                break;
            }
        }

        if ( (resultFlag && inversion === null) || (resultFlag && firstValue !== inversion) ) {

            if ( ! eventData.token ) {
                let powerOffAction = {
                    action: "powerOff",
                    stateId: eventData.stateId
                };

                socket.send(JSON.stringify(powerOffAction));

            }
        }
    }


    //Get an index of the lever to be checked
    let leverCheck = leverKnow;
    for (let i = 1; i < nuclear.length; i++){
        if (nuclear[i] === null ) {
            leverCheck = i;
            break;
        }
    }


    const action = {
        action: "check",
        "lever1": leverKnow,
        "lever2": leverCheck,
        stateId: eventData.stateId
    };


    if (eventData.pulled && ! eventData.token) {
        console.info("Action");
        console.log(action);

        socket.send(JSON.stringify(action));

        statesTried.push(eventData.stateId);
    }

    console.log(`Got through ${statesTried.length} events`);

    console.info("NUCLEAR");
    console.log(nuclear);
})




function setTitle(title) {
    document.querySelector('h1').innerHTML = title;
}

function printMessage(message) {
    var p = document.createElement('p');
    p.innerText = message;
    document.querySelector('div.messages').appendChild(p);
}
