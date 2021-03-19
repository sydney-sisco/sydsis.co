(function() {
	"use strict";

	var canvas = document.querySelector("#tv"),
	    context = canvas.getContext("gl") || canvas.getContext("2d"),
		scaleFactor = 2.5, // Noise size
		samples = [],
		sampleIndex = 0,
		scanOffsetY = 0,
		scanSize = 0,
		FPS = 60,
		scanSpeed = FPS * 15, // 15 seconds from top to bottom
		SAMPLE_COUNT = 10;

	window.onresize = function() {
		canvas.width = canvas.offsetWidth / scaleFactor;
		canvas.height = canvas.width / (canvas.offsetWidth / canvas.offsetHeight);
		scanSize = (canvas.offsetHeight / scaleFactor) / 3;

		samples = []
		for(var i = 0; i < SAMPLE_COUNT; i++)
			samples.push(generateRandomSample(context, canvas.width, canvas.height));
	};

	function interpolate(x, x0, y0, x1, y1) {
		return y0 + (y1 - y0)*((x - x0)/(x1 - x0));
	}


	function generateRandomSample(context, w, h) {	
		var intensity = [];
		var random = 0;
		var factor = h / 50;
		var trans = 1 - Math.random() * 0.05;

		var intensityCurve = [];
		for(var i = 0; i < Math.floor(h / factor) + factor; i++)
			intensityCurve.push(Math.floor(Math.random() * 15));

		for(var i = 0; i < h; i++) {
			var value = interpolate((i/factor), Math.floor(i / factor), intensityCurve[Math.floor(i / factor)], Math.floor(i / factor) + 1, intensityCurve[Math.floor(i / factor) + 1]);
			intensity.push(value);
		}

		var imageData = context.createImageData(w, h);
		for(var i = 0; i < (w * h); i++) {
			var k = i * 4;
			var color = Math.floor(36 * Math.random());
			// Optional: add an intensity curve to try to simulate scan lines
			color += intensity[Math.floor(i / w)];
			imageData.data[k] = imageData.data[k + 1] = imageData.data[k + 2] = color;
			imageData.data[k + 3] = Math.round(255 * trans);
		}
		return imageData;
	} 

	function render() {
		context.putImageData(samples[Math.floor(sampleIndex)], 0, 0);

		sampleIndex += 20 / FPS; // 1/FPS == 1 second
		if(sampleIndex >= samples.length) sampleIndex = 0;

		var grd = context.createLinearGradient(0, scanOffsetY, 0, scanSize + scanOffsetY);

		grd.addColorStop(0, 'rgba(255,255,255,0)');
		grd.addColorStop(0.1, 'rgba(255,255,255,0)');
		grd.addColorStop(0.2, 'rgba(255,255,255,0.2)');
		grd.addColorStop(0.3, 'rgba(255,255,255,0.0)');
		grd.addColorStop(0.45, 'rgba(255,255,255,0.1)');
		grd.addColorStop(0.5, 'rgba(255,255,255,1.0)');
		grd.addColorStop(0.55, 'rgba(255,255,255,0.55)');
		grd.addColorStop(0.6, 'rgba(255,255,255,0.25)');
		//grd.addColorStop(0.8, 'rgba(255,255,255,0.15)');
		grd.addColorStop(1, 'rgba(255,255,255,0)');

		context.fillStyle = grd;
		context.fillRect(0, scanOffsetY, canvas.width, scanSize + scanOffsetY);
		context.globalCompositeOperation = "lighter";

		scanOffsetY += (canvas.height / scanSpeed);
		if(scanOffsetY > canvas.height) scanOffsetY = -(scanSize / 2);

		window.requestAnimationFrame(render);
	}
	window.onresize();
	window.requestAnimationFrame(render);
})();


(function() {
    var nodes, current;
    
    function Animation(element) {
        this.element = element;
        this.stepMul = 10;
        this.stepTo = 4;
        this.element.style.visibility = "visible";
        this.canvas = document.createElement("canvas");
        this.canvas.style.visibility = "hidden";
        this.canvas.style.position = "absolute";
        this.canvas.style.width = this.element.offsetWidth + "px";
        this.canvas.style.height = this.element.offsetHeight + "px";
        this.canvas.style.top = this.element.offsetTop + "px";
        this.canvas.style.left = this.element.offsetLeft + "px";
        this.canvas.style.zIndex = "auto";
        
        this.context = this.canvas.getContext('2d');
        
        this.element.parentElement.appendChild(this.canvas);
    };
    Animation.prototype.loadCanvas = function(callback) {
        var self = this;
        html2canvas(this.element, {
            onrendered: function(canvas) { 
                self.image = new Image();
                self.image.src = canvas.toDataURL();
                
                self.canvas.style.visibility = "visible";
                self.element.style.visibility = "hidden"; 
                callback && callback();
            }
        });
    };
    Animation.prototype.hide = function() {
        this.step = 0;
        this.showing = false;
        this.loadCanvas(this.render.bind(this));
    };
    Animation.prototype.show = function() {
        this.step = 0;
        this.showing = true;
        this.loadCanvas(this.render.bind(this));
    };
    Animation.prototype.destroy = function() {
        this.canvas && this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas);
    };
    Animation.prototype.render = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        var inc = this.step / this.stepTo;
        this.showing && (inc = 1 - inc);
        for(var i = Math.floor(inc * this.stepMul) + 1, j = 0; j < i ; j++) {
            var x = Math.random() * (this.canvas.width /2),
                y = Math.random() * this.canvas.height,
                w = this.canvas.width - x,
                h = 30 * Math.random() + 2;
            this.context.clearRect(x, y, w, h);
            this.context.clearRect(w, y, x, h);
            this.context.drawImage(this.image, 0, y, w, h, x, y, w, h);
            this.context.drawImage(this.image, w, y, x, h, 0, y, x, h);
        }
        
        if(this.step < this.stepTo) {
            this.step++;
            setTimeout(this.render.bind(this), Math.random() * 250);
        } else { 
            this.destroy();
            this.onComplete && this.onComplete();
        }
    }

    function next() {
        var nodeFrom = current,
            nodeTo = current._next;
        
        current = current._next;
        nodeFrom.style.display = "block";
        var a = new Animation(nodeFrom),
            b;
        a.onComplete = function() {
            nodeFrom.style.display = "none";
            nodeTo.style.display = "block";
            b = new Animation(nodeTo);
            b.onComplete = next;
            b.show();
        };
        setTimeout(function() { a.hide() }, 3000);
    }
    function init() {
        nodes = Array.prototype.slice.call(document.querySelectorAll(".item"));
        nodes.forEach(function(value, index) {
            if(index == nodes.length - 1)
                nodes[index]._next = nodes[0];
            else
                nodes[index]._next = nodes[index+1];
        });
        
        current = nodes[0];
        
        next();
    } 
    
    document.addEventListener('DOMContentLoaded', function() { init(); });
})();
