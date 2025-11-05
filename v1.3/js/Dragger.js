/**********************************

DRAGGER

**********************************/

function Dragger(loopy){

	var self = this;
	self.loopy = loopy;

	// Dragging anything?
	self.dragging = null;
	self.offsetX = 0;
	self.offsetY = 0;

	// Multi-select
	self.selectedItems = [];
	self.isBoxSelecting = false;
	self.boxStartX = 0;
	self.boxStartY = 0;
	self.boxEndX = 0;
	self.boxEndY = 0;

	// Selection box canvas
	var canvas = _createCanvas();
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;

	subscribe("mousedown",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// Check if clicking on any existing item
		var dragNode = loopy.model.getNodeByPoint(Mouse.x, Mouse.y);
		var dragLabel = loopy.model.getLabelByPoint(Mouse.x, Mouse.y);
		var dragEdge = loopy.model.getEdgeByPoint(Mouse.x, Mouse.y);

		if(dragNode || dragLabel || dragEdge){
			// Single item or multi-item drag
			var clickedItem = dragNode || dragLabel || dragEdge;

			// If clicked item is in selection, drag all selected
			if(self.selectedItems.indexOf(clickedItem) !== -1){
				self.dragging = self.selectedItems;
				self.offsetX = Mouse.x;
				self.offsetY = Mouse.y;
			} else {
				// Single item drag (clear selection)
				self.selectedItems = [];
				self.dragging = clickedItem;
				self.offsetX = Mouse.x - clickedItem.x;
				self.offsetY = Mouse.y - clickedItem.y;
				loopy.sidebar.edit(clickedItem);
			}
		} else {
			// Start box selection
			self.isBoxSelecting = true;
			self.boxStartX = Mouse.x;
			self.boxStartY = Mouse.y;
			self.boxEndX = Mouse.x;
			self.boxEndY = Mouse.y;
			self.selectedItems = [];
		}
	});

	subscribe("mousemove",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// Box selecting
		if(self.isBoxSelecting){
			self.boxEndX = Mouse.x;
			self.boxEndY = Mouse.y;

			// Update selection
			self.updateSelection();

			// Draw selection box
			self.drawSelectionBox();

			// Model changed for visual update
			publish("model/changed");
			return;
		}

		// Multi-item dragging
		if(self.dragging && Array.isArray(self.dragging)){
			// Model's been changed!
			publish("model/changed");

			var dx = Mouse.x - self.offsetX;
			var dy = Mouse.y - self.offsetY;

			// Move all selected items
			for(var i=0; i<self.dragging.length; i++){
				var item = self.dragging[i];
				if(item._CLASS_=="Node" || item._CLASS_=="Label"){
					item.x += dx;
					item.y += dy;
				}
			}

			self.offsetX = Mouse.x;
			self.offsetY = Mouse.y;

			// update coz visual glitches
			loopy.model.update();
			return;
		}

		// Single NODE dragging
		if(self.dragging && self.dragging._CLASS_=="Node"){
			// Model's been changed!
			publish("model/changed");

			var node = self.dragging;
			node.x = Mouse.x - self.offsetX;
			node.y = Mouse.y - self.offsetY;

			// update coz visual glitches
			loopy.model.update();
		}

		// Single EDGE dragging
		if(self.dragging && self.dragging._CLASS_=="Edge"){
			// Model's been changed!
			publish("model/changed");

			var edge = self.dragging;
			var labelX = Mouse.x - self.offsetX;
			var labelY = Mouse.y - self.offsetY;

			if(edge.from!=edge.to){
				// The Arc: whatever label *Y* is, relative to angle & first node's pos
				var fx=edge.from.x, fy=edge.from.y, tx=edge.to.x, ty=edge.to.y;
				var dx=tx-fx, dy=ty-fy;
				var a = Math.atan2(dy,dx);

				// Calculate arc
				var points = [[labelX,labelY]];
				var translated = _translatePoints(points, -fx, -fy);
				var rotated = _rotatePoints(translated, -a);
				var newLabelPoint = rotated[0];

				// ooookay.
				edge.arc = -newLabelPoint[1]; // WHY NEGATIVE? I DON'T KNOW.
			}else{
				// For SELF-ARROWS: just get angle & mag for label.
				var dx = labelX - edge.from.x,
					dy = labelY - edge.from.y;
				var a = Math.atan2(dy,dx);
				var mag = Math.sqrt(dx*dx + dy*dy);

				// Minimum mag
				var minimum = edge.from.radius+25;
				if(mag<minimum) mag=minimum;

				// Update edge
				edge.arc = mag;
				edge.rotation = a*(360/Math.TAU)+90;
			}

			// update coz visual glitches
			loopy.model.update();
		}

		// Single LABEL dragging
		if(self.dragging && self.dragging._CLASS_=="Label"){
			// Model's been changed!
			publish("model/changed");

			var label = self.dragging;
			label.x = Mouse.x - self.offsetX;
			label.y = Mouse.y - self.offsetY;

			// update coz visual glitches
			loopy.model.update();
		}
	});

	subscribe("mouseup",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// Stop box selecting
		if(self.isBoxSelecting){
			self.isBoxSelecting = false;
			self.clearSelectionBox();
		}

		// Let go!
		self.dragging = null;
		self.offsetX = 0;
		self.offsetY = 0;
	});

	// Update what's selected in the box
	self.updateSelection = function(){
		self.selectedItems = [];

		var left = Math.min(self.boxStartX, self.boxEndX);
		var right = Math.max(self.boxStartX, self.boxEndX);
		var top = Math.min(self.boxStartY, self.boxEndY);
		var bottom = Math.max(self.boxStartY, self.boxEndY);

		// Check nodes
		for(var i=0; i<loopy.model.nodes.length; i++){
			var node = loopy.model.nodes[i];
			if(node.x >= left && node.x <= right && node.y >= top && node.y <= bottom){
				self.selectedItems.push(node);
			}
		}

		// Check labels
		for(var i=0; i<loopy.model.labels.length; i++){
			var label = loopy.model.labels[i];
			if(label.x >= left && label.x <= right && label.y >= top && label.y <= bottom){
				self.selectedItems.push(label);
			}
		}
	};

	// Draw selection box
	self.drawSelectionBox = function(){
		var ctx = self.context;
		ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

		if(!self.isBoxSelecting) return;

		// Apply the same transformations as the main model canvas
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

		// Calculate box dimensions in model space
		var x = Math.min(self.boxStartX, self.boxEndX) * 2;
		var y = Math.min(self.boxStartY, self.boxEndY) * 2;
		var w = Math.abs(self.boxEndX - self.boxStartX) * 2;
		var h = Math.abs(self.boxEndY - self.boxStartY) * 2;

		// Draw selection rectangle
		ctx.strokeStyle = "rgba(0, 120, 250, 0.8)";
		ctx.fillStyle = "rgba(0, 120, 250, 0.1)";
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, w, h);
		ctx.fillRect(x, y, w, h);

		ctx.restore();
	};

	// Clear selection box
	self.clearSelectionBox = function(){
		var ctx = self.context;
		ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
	};

	// Draw selection highlights
	subscribe("model/draw", function(){
		if(self.selectedItems.length > 0 && !self.isBoxSelecting){
			var ctx = loopy.model.context;
			ctx.save();

			for(var i=0; i<self.selectedItems.length; i++){
				var item = self.selectedItems[i];

				if(item._CLASS_=="Node"){
					ctx.beginPath();
					ctx.arc(item.x*2, item.y*2, item.radius*2 + 10, 0, Math.TAU, false);
					ctx.strokeStyle = "rgba(0, 120, 250, 0.5)";
					ctx.lineWidth = 3;
					ctx.stroke();
				}

				if(item._CLASS_=="Label"){
					var bounds = item.getBounds();
					ctx.strokeStyle = "rgba(0, 120, 250, 0.5)";
					ctx.lineWidth = 3;
					ctx.strokeRect(bounds.x*2, bounds.y*2, bounds.width*2, bounds.height*2);
				}
			}

			ctx.restore();
		}
	});
}
