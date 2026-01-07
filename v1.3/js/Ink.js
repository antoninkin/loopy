/**********************************

LOOPY!
- with edit & play mode

TODO: smoother bezier curve?
TODO: when switch away tool, clear the Ink canvas

**********************************/

Ink.MINIMUM_RADIUS = Node.DEFAULT_RADIUS;
Ink.SNAP_TO_RADIUS = 25;

function Ink(loopy){

	var self = this;
	self.loopy = loopy;

	// Create canvas & context
	var canvas = _createCanvas();
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;

	// Stroke data!
	self.strokeData = [];

	// Drawing!
	self.drawInk = function(){

		if(self.strokeData.length < 2) return;

		// Clear and redraw all strokes with proper transformation
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Apply the same transformations as the main model canvas (like Dragger.js does)
		ctx.save();

		var canvasses = document.getElementById("canvasses");
		var CW = canvasses.clientWidth - _PADDING - _PADDING;
		var CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		var tx = loopy.offsetX*2;
		var ty = loopy.offsetY*2;
		tx -= CW+_PADDING;
		ty -= CH+_PADDING;
		var s = loopy.offsetScale;
		tx = s*tx;
		ty = s*ty;
		tx += CW+_PADDING;
		ty += CH+_PADDING;
		if(loopy.embedded){
			tx += _PADDING;
			ty += _PADDING;
		}
		ctx.setTransform(s, 0, 0, s, tx, ty);

		// Style
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 5;
		ctx.lineCap = "round";

		// Draw all stroke segments
		ctx.beginPath();
		for(var i=1; i<self.strokeData.length; i++){
			var prevPoint = self.strokeData[i-1];
			var currPoint = self.strokeData[i];
			if(i === 1){
				ctx.moveTo(prevPoint[0]*2, prevPoint[1]*2);
			}
			ctx.lineTo(currPoint[0]*2, currPoint[1]*2);
		}
		ctx.stroke();

		ctx.restore();
	};
	self.reset = function(){
		ctx.clearRect(0,0,canvas.width,canvas.height); // Clear canvas
		self.strokeData = []; // Reset stroke data
	};
	subscribe("mousedown",function(){

		// ONLY WHEN EDITING w INK
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_INK) return;

		// New stroke data
		self.strokeData.push([Mouse.x,Mouse.y]);

		// Draw to canvas!
		self.drawInk();

	});
	subscribe("mousemove",function(){

		// ONLY WHEN EDITING w INK
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_INK) return;

		// Draw ink!
		if(!Mouse.pressed) return;
    	self.strokeData.push([Mouse.x, Mouse.y]);
		self.drawInk();

	});
	subscribe("mouseup",function(){

		// ONLY WHEN EDITING w INK
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_INK) return;

		if(self.strokeData.length<2) return;
		if(!Mouse.moved) return;

		/*************************

		Detect what you drew!
		1. Started in a node?
		1a. If ended near/in a node, it's an EDGE.
		2. If not, it's a NODE. // TODO: actual circle detection?

		*************************/

		// Started in a node?
		var startPoint = self.strokeData[0];
		var startNode = loopy.model.getNodeByPoint(startPoint[0], startPoint[1]);
		if(!startNode) startNode=loopy.model.getNodeByPoint(startPoint[0], startPoint[1], 20); // try again with buffer

		// Ended in a node?
		var endPoint = self.strokeData[self.strokeData.length-1];
		var endNode = loopy.model.getNodeByPoint(endPoint[0], endPoint[1]);
		if(!endNode) endNode=loopy.model.getNodeByPoint(endPoint[0], endPoint[1], 40); // try again with buffer

		// EDGE: started AND ended in nodes
		if(startNode && endNode){

			// Config!
			var edgeConfig = {
				from: startNode.id,
				to: endNode.id
			};

			// If it's the same node...
			if(startNode==endNode){

				// TODO: clockwise or counterclockwise???
				// TODO: if the arc DOES NOT go beyond radius, don't make self-connecting edge. also min distance.

				// Find rotation first by getting average point
				var bounds = _getBounds(self.strokeData);
				var x = (bounds.left+bounds.right)/2;
				var y = (bounds.top+bounds.bottom)/2;
				var dx = x-startNode.x;
				var dy = y-startNode.y;
				var angle = Math.atan2(dy,dx);

				// Then, find arc height.
				var translated = _translatePoints(self.strokeData, -startNode.x, -startNode.y);
				var rotated = _rotatePoints(translated, -angle);
				bounds = _getBounds(rotated);

				// Arc & Rotation!
				edgeConfig.rotation = angle*(360/Math.TAU) + 90;
				edgeConfig.arc = bounds.right;

				// ACTUALLY, IF THE ARC IS *NOT* GREATER THAN THE RADIUS, DON'T DO IT.
				// (and otherwise, make sure minimum distance of radius+25)
				if(edgeConfig.arc < startNode.radius){
					edgeConfig=null;
					loopy.sidebar.edit(startNode); // you were probably trying to edit the node
				}else{
					var minimum = startNode.radius+25;
					if(edgeConfig.arc<minimum) edgeConfig.arc=minimum;
				}

			}else{

				// Otherwise, find the arc by translating & rotating
				var dx = endNode.x-startNode.x;
				var dy = endNode.y-startNode.y;
				var angle = Math.atan2(dy,dx);
				var translated = _translatePoints(self.strokeData, -startNode.x, -startNode.y);
				var rotated = _rotatePoints(translated, -angle);
				var bounds = _getBounds(rotated);

				// Arc!
				if(Math.abs(bounds.top)>Math.abs(bounds.bottom)) edgeConfig.arc = -bounds.top;
				else edgeConfig.arc = -bounds.bottom;

			}

			// Add the edge!
			if(edgeConfig){
				var newEdge = loopy.model.addEdge(edgeConfig);
				loopy.sidebar.edit(newEdge);
			}

		}

		// NODE: did NOT start in a node.
		if(!startNode){

			// Just roughly make a circle the size of the bounds of the circle
			var bounds = _getBounds(self.strokeData);
			var x = (bounds.left+bounds.right)/2;
			var y = (bounds.top+bounds.bottom)/2;
			var r = ((bounds.width/2)+(bounds.height/2))/2;

			// Circle can't be TOO smol
			if(r>15){

				// Snap to radius
				/*r = Math.round(r/Ink.SNAP_TO_RADIUS)*Ink.SNAP_TO_RADIUS;
				if(r<Ink.MINIMUM_RADIUS) r=Ink.MINIMUM_RADIUS;*/

				// LOCK TO JUST SMALLEST CIRCLE.
				r = Ink.MINIMUM_RADIUS;

				// Make that node!
				var newNode = loopy.model.addNode({
					x:x,
					y:y,
					radius:r
				});

				// Edit it immediately
				loopy.sidebar.edit(newNode);

			}

		}

		// Reset.
		self.reset();

	});
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING w INK
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_INK) return;

		// Reset
		self.reset();

	});

}
