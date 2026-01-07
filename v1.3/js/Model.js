/**********************************

MODEL!

**********************************/

function Model(loopy){

	var self = this;
	self.loopy = loopy;

	// SET SOME DEFAULT Properties
	self.speed = 0.05;
	self.DEFAULT_SIGNAL_SIZE = 0.1; //Sets size of quantum transferred by one click and size of arrow
	self.DEFAULT_NODE_RADIUS = 70; // Sets size of bubbles
	self.DEFAULT_NODE_GAIN = 1; //Gain multiplier for signal at each node
	self.MAX_SIGNAL_AGE = 5; //Maximum number of nodes a signal can traverse
	self.SIGNAL_SCALE_FACTOR = 100; //sets a scaling factor for the arrows
	self.DEFAULT_EDGE_STRENGTH = 0.75;
	self.MAX_SIGNALS = 200;
	self.MAX_SIGNALS_PER_EDGE = 25;

	//DEFINE CORE COLOURS
	self.COLOUR_CONTROL_ARROWS = "rgba(0,0,0,0.8)";
	self.COLOUR_NODE_TEXT = "rgba(0,0,0,0.8)";
	self.COLOUR_NODE_EMPTY = "rgba(255,255,255,0.3)";
	self.COLOUR_NODE_LIST = {
		0: "#F01E20", // Firebrick1
		1: "#F46F2C", // Sienna1
		2: "#F9B801", // Goldenrod1
		3: "#83FFC5", // Aquamarine1
		4: "#43EBEA", // Cyan2
		5: "#6A4EFF", // Slateblue1
		6: "#E299F0", // Plum2
		7: "#D4D4D4", // Gainsboro
		8: "#E8D8BE", // Antiquewhite2
		9: "#EEFFFF"  // Azure
		};
	self.COLOUR_EDGE_TEXT = "rgba(102,102,102,1)";
	self.COLOUR_EDGE = "rgba(102,102,102,1)";
	self.COLOUR_EDGE_FAST = "rgba(51,171,95,1)";
	self.COLOUR_EDGE_SLOW = "rgba(178,34,34,1)";

	// Create canvas & context
	var canvas = _createCanvas();
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;

	///////////////////
	// NODES //////////
	///////////////////

	// Nodes
	self.nodes = [];
	self.nodeByID = {};
	self.getNode = function(id){
		return self.nodeByID[id];
	};

	// Remove Node
	self.addNode = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add Node
		var node = new Node(self,config);
		self.nodeByID[node.id] = node;
		self.nodes.push(node);
		self.update();
		return node;

	};

	// Remove Node
	self.removeNode = function(node){

		// Model's been changed!
		publish("model/changed");

		// Remove from array
		self.nodes.splice(self.nodes.indexOf(node),1);

		// Remove from object
		delete self.nodeByID[node.id];

		// Remove all associated TO and FROM edges
		for(var i=0; i<self.edges.length; i++){
			var edge = self.edges[i];
			if(edge.to==node || edge.from==node){
				edge.kill();
				i--; // move index back, coz it's been killed
			}
		}

	};


	///////////////////
	// EDGES //////////
	///////////////////

	// Edges
	self.edges = [];

	// Remove edge
	self.addEdge = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add Edge
		var edge = new Edge(self,config);
		self.edges.push(edge);
		self.update();
		return edge;
	};

	// Remove edge
	self.removeEdge = function(edge){

		// Model's been changed!
		publish("model/changed");

		// Remove edge
		self.edges.splice(self.edges.indexOf(edge),1);

	};

	// Get all edges with start node
	self.getEdgesByStartNode = function(startNode){
		return self.edges.filter(function(edge){
			return(edge.from==startNode);
		});
	};




	///////////////////
	// LABELS /////////
	///////////////////

	// Labels
	self.labels = [];

	// Remove label
	self.addLabel = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add label
		var label = new Label(self,config);
		self.labels.push(label);
		self.update();
		return label;
	};

	// Remove label
	self.removeLabel = function(label){

		// Model's been changed!
		publish("model/changed");

		// Remove label
		self.labels.splice(self.labels.indexOf(label),1);

	};



	///////////////////
	// UPDATE & DRAW //
	///////////////////

	var _canvasDirty = false;

	self.update = function(){

		// Update edges THEN nodes
		for(var i=0;i<self.edges.length;i++) self.edges[i].update(self.speed);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].update(self.speed);

		// Dirty!
		_canvasDirty = true;

	};

	// SHOULD WE DRAW?
	var drawCountdownFull = 60; // two-second buffer!
	var drawCountdown = drawCountdownFull;

	// ONLY IF MOUSE MOVE / CLICK
	subscribe("mousemove", function(){ drawCountdown=drawCountdownFull; });
	subscribe("mousedown", function(){ drawCountdown=drawCountdownFull; });

	// OR INFO CHANGED
	subscribe("model/changed", function(){
		if(self.loopy.mode==Loopy.MODE_EDIT) drawCountdown=drawCountdownFull;
	});

	// OR RESIZE or RESET
	subscribe("resize",function(){ drawCountdown=drawCountdownFull; });
	subscribe("model/reset",function(){ drawCountdown=drawCountdownFull; });
	subscribe("loopy/mode",function(){
		if(loopy.mode==Loopy.MODE_PLAY){
			drawCountdown=drawCountdownFull*2;
		}else{
			drawCountdown=drawCountdownFull;
		}
	});

	self.draw = function(){

		// SHOULD WE DRAW?
		// ONLY IF ARROW-SIGNALS ARE MOVING
		for(var i=0;i<self.edges.length;i++){
			if(self.edges[i].signals.length>0){
				drawCountdown = drawCountdownFull;
				break;
			}
		}

		// DRAW???????
		drawCountdown--;
		if(drawCountdown<=0) return;

		// Also only draw if last updated...
		if(!_canvasDirty) return;
		_canvasDirty = false;

		// Clear!
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

		// Translate
		ctx.save();

		// Translate to center, (translate, scale, translate) to expand to size
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
			tx += _PADDING; // dunno why but this is needed
			ty += _PADDING; // dunno why but this is needed
		}
		ctx.setTransform(s, 0, 0, s, tx, ty);

		// Draw labels THEN edges THEN nodes
		for(var i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);
		for(var i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

		// Restore
		ctx.restore();

	};




	//////////////////////////////
	// SERIALIZE & DE-SERIALIZE //
	//////////////////////////////

	self.serialize = function(){

		var data = [];
		// 0 - nodes
		// 1 - edges
		// 2 - labels
		// 3 - Simulation Settings
		// 4 - UID


		// Nodes
		var nodes = [];
		for(var i=0;i<self.nodes.length;i++){
			var node = self.nodes[i];
			// 0 - id
			// 1 - x
			// 2 - y
			// 3 - init value
			// 4 - label
			// 5 - hue
			// 6 - radius
			// 7 - gain
			// 8 - strength
			// 9 - active
			nodes.push([
				node.id,
				Math.round(node.x),
				Math.round(node.y),
				node.init,
				encodeURIComponent(node.label),
				node.hue,
				node.radius,
				node.gain,
				node.strength,
				node.active,
				// Add split node labels (indices 10, 11)
				node.topLabel !== undefined ? encodeURIComponent(node.topLabel) : "",
				node.bottomLabel !== undefined ? encodeURIComponent(node.bottomLabel) : ""
			]);
		}
		data.push(nodes);

		// Edges
		var edges = [];
		for(var i=0;i<self.edges.length;i++){
			var edge = self.edges[i];
			// 0 - from
			// 1 - to
			// 2 - arc
			// 3 - strength
			// 4 - speedMultiplier
			// 5 - rotation (optional)
			// 6 - showLabel (optional)
			var dataEdge = [
				edge.from.id,
				edge.to.id,
				Math.round(edge.arc),
				edge.strength,
				edge.speedMultiplier
			];
			if(dataEdge.f==dataEdge.t){
				dataEdge.push(Math.round(edge.rotation));
			}
			// Always add showLabel as last element (default false)
			dataEdge.push(edge.showLabel ? 1 : 0);
			edges.push(dataEdge);
		}
		data.push(edges);

		// Labels
		var labels = [];
		for(var i=0;i<self.labels.length;i++){
			var label = self.labels[i];
			// 0 - x
			// 1 - y
			// 2 - text
			labels.push([
				Math.round(label.x),
				Math.round(label.y),
				encodeURIComponent(label.text)
			]);
		}
		data.push(labels);

		// Simulation Settings
		var settings = [
			self.MAX_SIGNAL_AGE,
			self.MAX_SIGNALS_PER_EDGE,
			self.MAX_SIGNALS
		];

		data.push(settings);

		// META.
		data.push(Node._UID);

		// Return as string!
		var dataString = JSON.stringify(data);
		dataString = encodeURIComponent(dataString);
		// dataString = dataString.replace(/"/gi, "%22"); // and ONLY URIENCODE THE QUOTES
		// dataString = dataString.substr(0, dataString.length-1) + "%5D";// also replace THE LAST CHARACTER
		return dataString;

	};

	self.deserialize = function(dataString){

		self.clear();

		let data;
		try {
			data = JSON.parse(decodeURIComponent(dataString));
		} catch(e) {
			console.error("Failed to parse JSON:", e, dataString);
			return;
		}

		const [nodes, edges, labels, settings, UID] = data;

		// Nodes
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			self.addNode({
				id: node[0],
				x: node[1],
				y: node[2],
				init: node[3],
				label: decodeURIComponent(node[4]),
				hue: node[5],
				radius: node[6],
				gain: node[7],
				strength: node[8],
				active: node[9],
				// Restore split node labels
				topLabel: node[10] ? decodeURIComponent(node[10]) : undefined,
				bottomLabel: node[11] ? decodeURIComponent(node[11]) : undefined
			});
		}

		// Edges
		for(var i=0;i<edges.length;i++){
			var edge = edges[i];
			var edgeConfig = {
				from: edge[0],
				to: edge[1],
				arc: edge[2],
				strength: edge[3],
				direction: Math.sign(edge[3]),
				attenuation: Math.abs(edge[3]),
				speedMultiplier: edge[4]
			};
			if(edge[5]) edgeConfig.rotation=edge[5];
			// showLabel: check last element, default to false
			var lastIdx = edge.length - 1;
			edgeConfig.showLabel = (edge[lastIdx] === 1);
			self.addEdge(edgeConfig);
		}

		// Labels
		for(var i=0;i<labels.length;i++){
			var label = labels[i];
			self.addLabel({
				x: label[0],
				y: label[1],
				text: decodeURIComponent(label[2])
			});
		}
		// Settings
		self.MAX_SIGNAL_AGE = settings[0];
		self.MAX_SIGNALS_PER_EDGE = settings[1];
		self.MAX_SIGNALS = settings[2];

		// META.
		Node._UID = UID;

		// Validation patch: remove edges referencing missing nodes
		self.edges = self.edges.filter(edge => {
			const fromNode = self.getNode(edge.from?.id || edge.from);
			const toNode = self.getNode(edge.to?.id || edge.to);
			if (!fromNode || !toNode) {
				console.warn("Removed invalid edge referencing missing node:", edge);
				return false;
			}
			// Repair references if theyÃ¢â‚¬â„¢re numeric
			edge.from = fromNode;
			edge.to = toNode;
			return true;
		});
	};

	self.clear = function(){

		// Just kill ALL nodes.
		while(self.nodes.length>0){
			self.nodes[0].kill();
		}

		// Just kill ALL labels.
		while(self.labels.length>0){
			self.labels[0].kill();
		}

		// Clear any signals
		Edge.allSignals = [];

		// Force canvas clear and redraw
		ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
		_canvasDirty = true;
		drawCountdown = drawCountdownFull;
	};

	/////////////////////////
	// DOT Export Function //
	/////////////////////////
	self.exportToDOT = function(includePositions) {

		var dot = "digraph SystemModel {\n";
		dot += "  rankdir=LR;\n";
		dot += "  node [shape=circle, style=filled, fillcolor=lightgray];\n\n";

		// Export nodes
		if(self.nodes && self.nodes.length > 0) {
			dot += "  // Nodes\n";
			for(var i=0; i<self.nodes.length; i++){
				var node = self.nodes[i];
				if(!node) continue;

				// Safe label extraction - escape quotes and special chars
				var nodeLabel = (node.label || "?").toString()
					.replace(/"/g, '\\"')
					.replace(/\\/g, '\\\\');
				dot += '  n' + node.id + ' [label="' + nodeLabel + '"';

				// Add color
				var nodeHue = (node.hue !== undefined) ? node.hue : 0;
				var colorMap = {
					0: "#EA3E3E", // red
					1: "#EA9D51", // orange
					2: "#FEEE43", // yellow
					3: "#BFEE3F", // green
					4: "#7FD4FF", // blue
					5: "#A97FFF"  // purple
				};
				var color = colorMap[nodeHue] || "#EA3E3E";
				dot += ', fillcolor="' + color + '", fontcolor="black"';

				// Add position if requested
				if(includePositions && node.x !== undefined && node.y !== undefined){
					var x = (node.x / 100).toFixed(2);
					var y = (node.y / 100).toFixed(2);
					dot += ', pos="' + x + ',' + y + '!"';
				}

				dot += '];\n';
			}
		}

		// Export edges
		if(self.edges && self.edges.length > 0) {
			dot += "\n  // Edges\n";
			for(var i=0; i<self.edges.length; i++){
				var edge = self.edges[i];
				if(!edge || !edge.from || !edge.to) continue;

				var fromID = 'n' + edge.from.id;
				var toID = 'n' + edge.to.id;

				// Edge style based on strength
				var edgeStyle = 'solid';
				var edgeLabel = '';
				var edgeColor = '#666666';

				if(edge.strength !== undefined) {
					if(edge.strength > 0) {
						edgeStyle = 'solid';
						edgeLabel = '+';
						edgeColor = '#4CAF50';
					} else if(edge.strength < 0) {
						edgeStyle = 'dashed';
						edgeLabel = '-'; // Use regular hyphen instead of em dash
						edgeColor = '#F44336';
					} else {
						edgeStyle = 'dotted';
						edgeLabel = '?';
						edgeColor = '#9E9E9E';
					}
				}

				dot += '  ' + fromID + ' -> ' + toID;
				dot += ' [label="' + edgeLabel + '", style="' + edgeStyle + '", color="' + edgeColor + '"';

				// Handle self-loops
				if(edge.from === edge.to) {
					dot += ', constraint=false';
				}

				dot += '];\n';
			}
		}

		// Add labels - clean them for DOT format
		if(self.labels && self.labels.length > 0) {
			dot += "\n  // Text Labels\n";
			for(var i=0; i<self.labels.length; i++){
				var label = self.labels[i];
				if(!label || !label.text) continue;

				// Clean text for comment - remove special Unicode characters
				var labelText = label.text
					.replace(/[Ã£Æ’Â»]/g, '*')  // Replace bullet points with asterisks
					.replace(/[""]/g, '"')  // Replace smart quotes with regular quotes
					.replace(/['']/g, "'")  // Replace smart apostrophes
					.replace(/[Ã¢â‚¬â€Ã¢â‚¬â€œ]/g, '-')  // Replace em/en dashes with hyphens
					.replace(/[^\x00-\x7F]/g, '')  // Remove other non-ASCII characters
					.replace(/\n/g, ' ')    // Replace newlines with spaces
					.replace(/\s+/g, ' ')   // Collapse multiple spaces
					.trim();

				// Only add comment if there's text left after cleaning
				if(labelText.length > 0) {
					// Split long comments into multiple lines for readability
					var maxLength = 80;
					if(labelText.length > maxLength) {
						var words = labelText.split(' ');
						var currentLine = '';
						for(var j = 0; j < words.length; j++) {
							if(currentLine.length + words[j].length + 1 > maxLength) {
								if(currentLine.length > 0) {
									dot += '  // ' + currentLine + '\n';
									currentLine = words[j];
								}
							} else {
								currentLine += (currentLine.length > 0 ? ' ' : '') + words[j];
							}
						}
						if(currentLine.length > 0) {
							dot += '  // ' + currentLine + '\n';
						}
					} else {
						dot += '  // ' + labelText + '\n';
					}
				}

				// Add as actual node if positions included
				if(includePositions) {
					var cleanText = label.text
						.replace(/[Ã£Æ’Â»]/g, '*')
						.replace(/[""]/g, '"')
						.replace(/['']/g, "'")
						.replace(/[Ã¢â‚¬â€Ã¢â‚¬â€œ]/g, '-')
						.replace(/[^\x00-\x7F]/g, '')
						.replace(/"/g, '\\"')
						.replace(/\n/g, '\\n');

					dot += '  label' + i + ' [shape=plaintext, label="' + cleanText + '"';
					if(label.x !== undefined && label.y !== undefined) {
						var x = (label.x / 100).toFixed(2);
						var y = (label.y / 100).toFixed(2);
						dot += ', pos="' + x + ',' + y + '!"';
					}
					dot += '];\n';
				}
			}
		}

		dot += "}\n";
		return dot;
	};

	////////////////////
	// HELPER METHODS //
	////////////////////

	self.getNodeByPoint = function(x,y,buffer){
		var result;
		for(var i=self.nodes.length-1; i>=0; i--){ // top-down
			var node = self.nodes[i];
			if(node.isPointInNode(x,y,buffer)) return node;
		}
		return null;
	};

	self.getEdgeByPoint = function(x, y, wholeArrow){
		// TODO: wholeArrow option?
		var result;
		for(var i=self.edges.length-1; i>=0; i--){ // top-down
			var edge = self.edges[i];
			if(edge.isPointOnLabel(x,y)) return edge;
		}
		return null;
	};

	self.getLabelByPoint = function(x, y){
		var result;
		for(var i=self.labels.length-1; i>=0; i--){ // top-down
			var label = self.labels[i];
			if(label.isPointInLabel(x,y)) return label;
		}
		return null;
	};

	// Click to edit!
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING (and NOT erase)
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool==Loopy.TOOL_ERASE) return;

		// Did you click on a node? If so, edit THAT node.
		var clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
		if(clickedNode){
			loopy.sidebar.edit(clickedNode);
			return;
		}

		// Did you click on a label? If so, edit THAT label.
		var clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
		if(clickedLabel){
			loopy.sidebar.edit(clickedLabel);
			return;
		}

		// Did you click on an edge label? If so, edit THAT edge.
		var clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
		if(clickedEdge){
			loopy.sidebar.edit(clickedEdge);
			return;
		}

		// If the tool LABEL? If so, TRY TO CREATE LABEL.
		if(self.loopy.tool==Loopy.TOOL_LABEL){
			loopy.label.tryMakingLabel();
			return;
		}

		// Otherwise, go to main Edit page.
		loopy.sidebar.showPage("Edit");

	});

	// Centering & Scaling
	self.getBounds = function(){

		// If no nodes & no labels, forget it.
		if(self.nodes.length==0 && self.labels.length==0) return;

		// Get bounds of ALL objects...
		var left = Infinity;
		var top = Infinity;
		var right = -Infinity;
		var bottom = -Infinity;
		var _testObjects = function(objects){
			for(var i=0; i<objects.length; i++){
				var obj = objects[i];
				var bounds = obj.getBoundingBox();
				if(left>bounds.left) left=bounds.left;
				if(top>bounds.top) top=bounds.top;
				if(right<bounds.right) right=bounds.right;
				if(bottom<bounds.bottom) bottom=bounds.bottom;
			}
		};
		_testObjects(self.nodes);
		_testObjects(self.edges);
		_testObjects(self.labels);

		// Return
		return {
			left:left,
			top:top,
			right:right,
			bottom:bottom
		};

	};
	self.center = function(andScale){

		// If no nodes & no labels, forget it.
		if(self.nodes.length==0 && self.labels.length==0) return;

		// Get bounds of ALL objects...
		var bounds = self.getBounds();
		var left = bounds.left;
		var top = bounds.top;
		var right = bounds.right;
		var bottom = bounds.bottom;

		// Re-center!
		var canvasses = document.getElementById("canvasses");
		var fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
		var fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		var cx = (left+right)/2;
		var cy = (top+bottom)/2;
		loopy.offsetX = (_PADDING+fitWidth)/2 - cx;
		loopy.offsetY = (_PADDING+fitHeight)/2 - cy;

		// SCALE.
		if(andScale){

			var w = right-left;
			var h = bottom-top;

			// Wider or taller than screen?
			var modelRatio = w/h;
			var screenRatio = fitWidth/fitHeight;
			var scaleRatio;
			if(modelRatio > screenRatio){
				// wider...
				scaleRatio = fitWidth/w;
			}else{
				// taller...
				scaleRatio = fitHeight/h;
			}

			// Loopy, then!
			loopy.offsetScale = scaleRatio;

		}

	};

}
