/**********************************

NODE!

**********************************/

Node.defaultValue = 0.5;
Node.defaultHue = 0;

function Node(model, config){

	var self = this;
	self._CLASS_ = "Node";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	_configureProperties(self, config, {
		id: Node._getUID,
		x: 0,
		y: 0,
		init: Node.defaultValue, // initial value!
		label: "?",
		hue: Node.defaultHue,
		radius: model.DEFAULT_NODE_RADIUS,
		gain: model.DEFAULT_NODE_GAIN,
		strength: model.DEFAULT_SIGNAL_SIZE,
		active: 0, // 0=inactive, 1=active, 2=split
		topLabel: undefined,      // Split node top label
		bottomLabel: undefined   // Split node bottom label
	});

	// Value: from 0 to 1
	self.value = self.init;
	// TODO: ACTUALLY VISUALIZE AN INFINITE RANGE
	self.bound = function(){ // bound ONLY when changing value.
		/*var buffer = 1.2;
		if(self.value<-buffer) self.value=-buffer;
		if(self.value>1+buffer) self.value=1+buffer;*/
	};

	// MOUSE.
	var _controlsVisible = false;
	var _controlsAlpha = 0;
	var _controlsDirection = 0;
	var _controlsSelected = false;
	var _controlsPressed = false;
	var _listenerMouseMove = subscribe("mousemove", function(){

		// ONLY WHEN PLAYING
		if(self.loopy.mode!=Loopy.MODE_PLAY) return;

		// Split nodes (active=2) don't have controls
		if(self.active === 2) return;

		// If moused over this, show it, or not.
		_controlsSelected = self.isPointInNode(Mouse.x, Mouse.y);
		if(_controlsSelected){
			_controlsVisible = true;
			self.loopy.showPlayTutorial = false;
			_controlsDirection = (Mouse.y<self.y) ? 1 : -1;
		}else{
			_controlsVisible = false;
			_controlsDirection = 0;
		}

	});
	var _listenerMouseDown = subscribe("mousedown",function(){

		if(self.loopy.mode!=Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		if(self.active>0){
			if(_controlsSelected) _controlsPressed = true;
		}
		// IF YOU CLICKED ME...
		if(_controlsPressed){
			// Change my value
			var delta = _controlsDirection*self.strength;
			self.value += delta;

			// And also PROPAGATE THE DELTA
			self.sendSignal({
				delta: delta
			});
		}
	});

	var _listenerMouseUp = subscribe("mouseup",function(){
		if(self.loopy.mode!=Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		_controlsPressed = false;
	});
	var _listenerReset = subscribe("model/reset", function(){
		self.value = self.init;
	});

	//////////////////////////////////////
	// SIGNALS ///////////////////////////
	//////////////////////////////////////

	var shiftIndex = 0;
	self.sendSignal = function(signal){
		var myEdges = self.model.getEdgesByStartNode(self);
		myEdges = _shiftArray(myEdges, shiftIndex);
		shiftIndex = (shiftIndex+1)%myEdges.length;
		for(var i=0; i<myEdges.length; i++){
			myEdges[i].addSignal(signal);
		}
	};

	self.takeSignal = function(signal){

		// Change value
		self.value += signal.delta;

		// Propagate signal
		signal.delta = signal.delta * self.gain;
		self.sendSignal(signal);

		// Animation
		// _offsetVel += 0.08 * (signal.delta/Math.abs(signal.delta));
		_offsetVel -= 6 * (signal.delta/Math.abs(signal.delta));

	};


	//////////////////////////////////////
	// UPDATE & DRAW /////////////////////
	//////////////////////////////////////

	// Update!
	var _offset = 0;
	var _offsetGoto = 0;
	var _offsetVel = 0;
	var _offsetAcc = 0;
	var _offsetDamp = 0.3;
	var _offsetHookes = 0.8;
	self.update = function(speed){

		// When actually playing the simulation...
		var _isPlaying = (self.loopy.mode==Loopy.MODE_PLAY);

		// Otherwise, value = initValue exactly
		if(self.loopy.mode==Loopy.MODE_EDIT){
			self.value = self.init;
		}

		// Cursor!
		if(_controlsSelected) Mouse.showCursor("pointer");

		// Keep value within bounds!
		self.bound();

		// Visually & vertically bump the node
		var gotoAlpha = (_controlsVisible || self.loopy.showPlayTutorial) ? 1 : 0;
		_controlsAlpha = _controlsAlpha*0.5 + gotoAlpha*0.5;
		if(_isPlaying && _controlsPressed){
			_offsetGoto = -_controlsDirection*20; // by 20 pixels
			// _offsetGoto = _controlsDirection*0.2; // by scale +/- 0.1
		}else{
			_offsetGoto = 0;
		}
		_offset += _offsetVel;
		if(_offset>40) _offset=40
		if(_offset<-40) _offset=-40;
		_offsetVel += _offsetAcc;
		_offsetVel *= _offsetDamp;
		_offsetAcc = (_offsetGoto-_offset)*_offsetHookes;

	};

	// Draw
	var _circleRadius = 0;
	self.draw = function(ctx){

		// Retina
		var x = self.x*2;
		var y = self.y*2;
		var r = self.radius*2;
		var color = model.COLOUR_NODE_LIST[self.hue];

		// Translate!
		ctx.save();
		ctx.translate(x,y+_offset);

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target == self){
			ctx.beginPath();
			ctx.arc(0, 0, r+40, 0, Math.TAU, false);
			ctx.fillStyle = HIGHLIGHT_COLOR;
			ctx.fill();
		}

		// White-gray bubble with colored border
		ctx.beginPath();
		ctx.arc(0, 0, r-2, 0, Math.TAU, false);
		ctx.fillStyle = model.COLOUR_NODE_EMPTY;
		ctx.fill();
		ctx.lineWidth = 6;
		ctx.strokeStyle = color;
		ctx.stroke();

		// Circle radius
		// var _circleRadiusGoto = r*(self.value+1);
		// _circleRadius = _circleRadius*0.75 + _circleRadiusGoto*0.25;

		// RADIUS IS (ATAN) of VALUE?!?!?!
		var _r = Math.atan(self.value*5);
		_r = _r/(Math.PI/2);
		_r = (_r+1)/2;

		// INFINITE RANGE FOR RADIUS
		// linear from 0 to 1, asymptotic otherwise.
		var _value;
		if(self.value>=0 && self.value<=1){
			// (0,1) -> (0.1, 0.9)
			_value = 0.1 + 0.8*self.value;
		}else{
			if(self.value<0){
				// asymptotically approach 0, starting at 0.1
				_value = (1/(Math.abs(self.value)+1))*0.1;
			}
			if(self.value>1){
				// asymptotically approach 1, starting at 0.9
				_value = 1 - (1/self.value)*0.1;
			}
		}

		// Colored bubble
		ctx.beginPath();
		var _circleRadiusGoto = r*_value; // radius
		_circleRadius = _circleRadius*0.8 + _circleRadiusGoto*0.2;
		ctx.arc(0, 0, _circleRadius, 0, Math.TAU, false);
		ctx.fillStyle = color;
		ctx.fill();

		// Text rendering - check for split node first
        if (SplitNodeRenderer.isSplitNode(self)) {
            // Split node: render dual labels
            SplitNodeRenderer.renderLabels(ctx, self, r);
        } else {
            // Normal node: existing text rendering code
            var fontsize = 38;
            ctx.font = "normal "+fontsize+"px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";

            var maxWidth = r*2 - 30;

            function wrapText(text, maxWidth) {
                var words = text.split(' ');
                var lines = [];
                var currentLine = '';

                for(var i = 0; i < words.length; i++) {
                    var word = words[i];
                    var testLine = currentLine + (currentLine ? ' ' : '') + word;
                    var testWidth = ctx.measureText(testLine).width;

                    if(testWidth > maxWidth && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if(currentLine) {
                    lines.push(currentLine);
                }

                if(lines.length === 1 && ctx.measureText(lines[0]).width > maxWidth) {
                    var longWord = lines[0];
                    lines = [];
                    var currentChunk = '';

                    for(var j = 0; j < longWord.length; j++) {
                        var testChunk = currentChunk + longWord[j];
                        if(ctx.measureText(testChunk).width > maxWidth && currentChunk) {
                            lines.push(currentChunk);
                            currentChunk = longWord[j];
                        } else {
                            currentChunk = testChunk;
                        }
                    }
                    if(currentChunk) lines.push(currentChunk);
                }

                return lines;
            }

            var lines = wrapText(self.label, maxWidth);
            var lineHeight = fontsize * 1.2;
            var totalHeight = lines.length * lineHeight;
            var maxLines = Math.floor((r*2 - 20) / lineHeight);

            while(totalHeight > r*2 - 20 && fontsize > 16) {
                fontsize -= 2;
                ctx.font = "normal "+fontsize+"px sans-serif";
                lineHeight = fontsize * 1.2;
                lines = wrapText(self.label, maxWidth);
                totalHeight = lines.length * lineHeight;
            }

            if(lines.length > maxLines && maxLines > 0) {
                lines = lines.slice(0, maxLines);
                if(maxLines > 1) {
                    lines[maxLines - 1] = lines[maxLines - 1].substring(0, lines[maxLines - 1].length - 3) + '...';
                }
            }

            var startY = -(lines.length - 1) * lineHeight / 2;
            for(var i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], 0, startY + i * lineHeight);
            }
        }

		// SPLIT NODE DIVIDER (active=2)
        if (SplitNodeRenderer.isSplitNode(self)) {
            SplitNodeRenderer.renderDivider(ctx, r, color);
        }

		// WOBBLE CONTROLS
		var cl = 40;
		var cy = 0;
		if(self.active>0){
			if(self.loopy.showPlayTutorial && self.loopy.wobbleControls>0){
			var wobble = self.loopy.wobbleControls*(Math.TAU/30);
			cy = Math.abs(Math.sin(wobble))*10;
			}


			// Controls!
			ctx.globalAlpha = _controlsAlpha;
			ctx.strokeStyle = model.COLOUR_CONTROL_ARROWS;
			// top arrow
			ctx.beginPath();
			ctx.moveTo(-cl,-cy-cl);
			ctx.lineTo(0,-cy-cl*2);
			ctx.lineTo(cl,-cy-cl);
			ctx.lineWidth = (_controlsDirection>0) ? 10: 3;
			if(self.loopy.showPlayTutorial) ctx.lineWidth=6;
			ctx.stroke();
			// bottom arrow
			ctx.beginPath();
			ctx.moveTo(-cl,cy+cl);
			ctx.lineTo(0,cy+cl*2);
			ctx.lineTo(cl,cy+cl);
			ctx.lineWidth = (_controlsDirection<0) ? 10: 3;
			if(self.loopy.showPlayTutorial) ctx.lineWidth=6;
			ctx.stroke();
		}

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL NODE /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Kill Listeners!
		unsubscribe("mousemove",_listenerMouseMove);
		unsubscribe("mousedown",_listenerMouseDown);
		unsubscribe("mouseup",_listenerMouseUp);
		unsubscribe("model/reset",_listenerReset);

		// Remove from parent!
		model.removeNode(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.isPointInNode = function(x, y, buffer){
		buffer = buffer || 0;
		return _isPointInCircle(x, y, self.x, self.y, self.radius+buffer);
	};

	self.getBoundingBox = function(){
		return {
			left: self.x - self.radius,
			top: self.y - self.radius,
			right: self.x + self.radius,
			bottom: self.y + self.radius
		};
	};

}

////////////////////////////
// Unique ID identifiers! //
////////////////////////////

Node._UID = 0;
Node._getUID = function(){
	Node._UID++;
	return Node._UID;
};
