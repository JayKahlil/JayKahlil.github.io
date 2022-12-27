let sounds = {
    nineoneone: 2,
    anemone: 0,
    avrilwilson: 0,
    beef: 0,
    bone: 2,
    chicken: 0,
    chickens: 0,
    depression: 0,
    dropthebeef: 2,
    egg: 0,
    freshavacado: 0,
    freshsponge: 0,
    fungus: 0,
    holt: 0,
    imgay: 0,
    lovinit: 0,
    mayo: 0,
    niceron: 12,
    nugg: 0,
    timetostop: 0,
    trainhorn: 7,
    whereyourparents: 2,
    disgusting: 0,
    yes: 0,
    scream: 0,
    outmecar: 0,
    car: 0,
    madworld: 0,
    cheesoid: 3,
    petril: 2,
    lonely: 0,
    cheese: 3,
    help: 0,
    getsomehelp: 0,
    bigstorm: 0,
    pbbaby: 0,
    xgames: 0,
    tryyourbest: 0,
    halloween: 0,
    whyareyourunning: 2,
    chickenstrips: 2,
    notmydad: 0,
    ninki: 0,
    numberwang: 10,
    nyan: 0,
    freerealestate: 0,
    adultvirgin: 0,
    stopjumpin: 0,
    letmegame: 0,
    violation: 3,
}

var sound = new Audio();
var soundDone;

sound.addEventListener("timeupdate", function(){
    var currentTime = sound.currentTime;
    var duration = sound.duration;
    var timeLeft = parseFloat(duration - currentTime).toFixed(2);
    
    if(soundDone){
        document.getElementById("timer").textContent="";
    } else{
        document.getElementById("timer").textContent=timeLeft;

    }
});

sound.addEventListener("ended", function(){
    soundDone = true;
    document.getElementById("mystery").className = "";
    sound.currentTime = 0;
    document.getElementById("timer").textContent="";
});

document.getElementById("mystery").addEventListener("click", randomSound, false)

function randomSound() {
    let keyArray = Object.keys(sounds)
    let soundName = keyArray[Math.floor(Math.random() * keyArray.length)]
    let altNumber = sounds[soundName]
    console.log(soundName)
    console.log(altNumber)

    playIt(soundName, altNumber)
}


function playIt(name, altNumber){
    var fileName
    if (altNumber > 0) {
        chosenAlt = Math.floor((Math.random() * altNum) + 1)
        fileName = name + chosenAlt
    } else {
        fileName = name
    }

    soundDone = false; //Used for removing the timer when the sound has finished.
    
    document.getElementById("mystery").classList.add('rainbowpulse');
    
    sound.src = "./audio/" + fileName + ".wav";
    sound.play();
}