//ws://nuclear.t.javascript.ninja
const socket = new WebSocket("ws://nuclear.t.javascript.ninja");

socket.onopen = function () {
    setTitle("Deactivate Power Station");
};

socket.onclose = function () {
    setTitle("DISCONNECTED");
};

socket.onmessage = function (payload) {
    // console.log(payload.data);
    printMessage(payload.data);
};


const statesTried = [];
const sameTrue = [];
const historyLog = [];
let same = false;
let lastPulled;
const nuclear = [null, null, null, null];
let inversion = null;
let checkedLever = 0;
socket.addEventListener('message', (event) => {
    // console.log('Event data');
    let logObj = {};

    let eventData = JSON.parse(event.data);
    if (eventData.error) {
        console.error(eventData);
        //console.log(statesTried);
        return;
    }

    console.log(`Response event ${JSON.stringify(eventData)}`);

    logObj.stateId = eventData.stateId;

    // Если pulled один из ры
    if ("pulled" in eventData) {
        if ( nuclear[eventData.pulled] !== null) {
            nuclear[eventData.pulled] = ! nuclear[eventData.pulled];
        }
    }

    if ("same" in eventData) {
        logObj.same = eventData.same;
        logObj.pulled = lastPulled;
        logObj.lever1 = eventData.lever1;
        logObj.lever2 = eventData.lever2;
        historyLog.push(logObj);

        if (eventData.same) {
            console.info("Same true");

            if (nuclear[checkedLever] !== null ) {
                nuclear[eventData.lever1] = nuclear[checkedLever];
                nuclear[eventData.lever2] = nuclear[checkedLever];
            } else {
                nuclear[eventData.lever1] = true;
                nuclear[eventData.lever2] = true;
            }

            same = true;
        } else {
            same = false;

        }
    } else {
        console.time(`Pulling new state for ID -- ${eventData.stateId}`);

    }

    if(eventData.token) {
        setTitle("Station deactivated");
        console.log(eventData.token);
        socket.close();
    }

    if (eventData.newState == "poweredOn") {
        inversion = nuclear[0];
    }


    if (nuclear[0] !== null ) {
        let resultFlag = true;
        let firstValue = nuclear[0];
        for (let i = 0; i < nuclear.length; i++) {

            if (nuclear[i] !== firstValue) {
                resultFlag = false;
                break;
            }
        }

        if ( (resultFlag && inversion === null) || (resultFlag && firstValue !== inversion) ) {
            let powerOffAction = {
                action: "powerOff",
                stateId: "some-state-id"
            };

            powerOffAction.stateId = eventData.stateId;

            if (! eventData.token ) {
                console.warn("Station deactivated");
                console.warn(eventData.stateId);
                socket.send(JSON.stringify(powerOffAction));

            }
        }
    }




//nuclear.find((i) => {
//    return i === ture;
//});
    let leverKnow = false;
    for (let i = 0; i < nuclear.length; i++){
        if (nuclear[i] === true) {
            leverKnow = i;
            break;
        }
    }

    if (leverKnow === false) {
        leverKnow = 0;
    }
    //shifting lever being checked?
    checkedLever = leverKnow;

    let leverCheck = false;
    for (let i = 0; i < nuclear.length; i++){
        if (nuclear[i] === null && leverKnow != i ) {
            leverCheck = i;
            break;
        }
    }

    if (leverCheck === false) {
        for (let i = 0; i < nuclear.length; i++){
            if (nuclear[i] !== true && leverKnow != i ) {
                leverCheck = i;
                break;
            }
        }

        if (leverCheck === false ) {
            leverCheck = leverKnow;
        }
    }


// console.log(statesTried.includes(eventData.stateId));
    const action = {
        action: "check",
        "lever1": leverKnow,
        "lever2": leverCheck,
        stateId: eventData.stateId
    };



    if (eventData.pulled && ! eventData.token) {

        lastPulled = eventData.pulled;

        console.info("Action");
        console.log(action);

        socket.send(JSON.stringify(action));

        statesTried.push(eventData.stateId);

    }

    console.log(`Got through ${statesTried.length} events`);

    console.info("NUCLEAR");
    console.log(nuclear);
})


document.forms[0].onsubmit = function () {
    var input = document.getElementById('message');
    socket.send(input.value);
    input.value = '';
};

function setTitle(title) {
    document.querySelector('h1').innerHTML = title;
}

function printMessage(message) {
    var p = document.createElement('p');
    p.innerText = message;
    document.querySelector('div.messages').appendChild(p);
}
