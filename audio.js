var root = this;
root.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
root.soundSource = null;
root.concertHallBuffer = null;
root.analyser = audioCtx.createAnalyser();
root.canvasCtx = document.getElementById('canvas').getContext('2d');


root.a = {};
root.v = {};
root.c = {};
root.s = {};

// audio

a.init = function () {
    console.log('a.init has fired');
    a.loadSong();
};
a.loadSong = function () {
    console.log('a.loadSong has fired');
    xhr = new XMLHttpRequest();

    xhr.open("GET", './mp3/sample.mp3', true);
    xhr.responseType = 'arraybuffer';
    
    xhr.onload = function () {
        console.log('--  xhr loaded');
        var audioData = xhr.response;
    
        audioCtx.decodeAudioData(audioData).then(function(buffer) {
            concertHallBuffer = buffer;
        }, function(e) {console.log("Error with decoding audio data: " + e.err);});
    
    }
    
    
    xhr.send();
};
a.playSong = function () {
    soundSource = audioCtx.createBufferSource();
    soundSource.buffer = concertHallBuffer;
    soundSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    soundSource.start();
    c.draw();
    s.renderChart();
}
a.stopSong = function () {
    soundSource.stop();
}

// visualizer

v.getAnalyserData = function () {
    // set default fft size
    analyser.fftSize = 2048;
    // get buffer length for array size
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    return dataArray;
};

// canvas

c.draw = function () {
    var dataArray = v.getAnalyserData();
    requestAnimationFrame(c.draw);
    canvasCtx.fillStyle = 'rgb(152, 222, 111)';
    canvasCtx.fillRect(0, 0, 300, 300);

    var barWidth = (300 / dataArray.length) * 2.5;
    var barHeight;
    var x = 0;

    for(var i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i]/2;

        canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        canvasCtx.fillRect(x,300-barHeight/2,barWidth,barHeight);

        x += barWidth + 1;
      }
}

// svg
var svgHeight = 300;
var svgWidth = 300;
var barPadding = 1;

s.createSVG = function (parent) {
    return d3.select(parent)
                .append('svg')
                .attr('height', svgHeight)
                .attr('width', svgWidth);
};

root.graph = s.createSVG('#graph');

s.drawRects = function (buffer) {
    graph.selectAll('rect')
            .data(buffer)
            .enter()
            .append('rect')
            .attr('width', svgWidth / buffer.length)
            .attr('height', function (d) {
                return d * 4;
            })
            .attr('x', function (d, i) {
                return i * (svgWidth / buffer.length);
            })
            .attr('y', function (d) {
                return svgHeight - d;
            });
};

s.drawRects(v.getAnalyserData());

s.updateRects = function (buffer) {
    graph.selectAll('rect')
            .data(buffer)
            .attr('height', function (d) {
                return d * 4;
            })
            .attr('y', function (d) {
                return svgHeight - d;
            });
}

s.renderChart = function () {
    requestAnimationFrame(s.renderChart);

    s.updateRects(v.getAnalyserData());
}
// Event Listeners

root.playButton = document.getElementById('play');
root.stopButton = document.getElementById('stop');

playButton.addEventListener("click", function () {
    a.playSong();
});

stopButton.addEventListener("click", function () {
    a.stopSong();
});


// Start program
a.init();