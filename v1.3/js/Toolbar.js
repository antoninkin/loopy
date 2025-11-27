/**********************************

TOOLBAR CODE

**********************************/

function Toolbar(loopy){

	var self = this;

	// Tools & Buttons
	var buttons = [];
	var buttonsByID = {};
	self.dom = document.getElementById("toolbar");
	self.addButton = function(options){

		var id = options.id;
		var tooltip = options.tooltip;
		var callback = options.callback;
		var isActionButton = options.isActionButton || false; // For undo/redo buttons

		// Add the button
		var button = new ToolbarButton(self,{
			id: id,
			icon: "css/icons/"+id+".png",
			tooltip: tooltip,
			callback: callback
		});
		self.dom.appendChild(button.dom);
		buttons.push(button);
		buttonsByID[id] = button;

		// Keyboard shortcut!
		if(!isActionButton){
			(function(id){
				subscribe("key/"+id,function(){
					loopy.ink.reset(); // also CLEAR INK CANVAS
					buttonsByID[id].callback();
				});
			})(id);
		}
	};

	// Add separator
	var separator = document.createElement("div");
	separator.style.height = "1px";
	separator.style.backgroundColor = "#ddd";
	separator.style.margin = "10px 5px";
	self.dom.appendChild(separator);

	// Add zoom controls
	var zoomLabel = document.createElement("div");
	zoomLabel.style.fontSize = "10px";
	zoomLabel.style.color = "#666";
	zoomLabel.style.textAlign = "center";
	zoomLabel.style.marginBottom = "5px";
	zoomLabel.innerHTML = "ZOOM";
	self.dom.appendChild(zoomLabel);

	// Zoom In button
	var zoomInBtn = document.createElement("div");
	zoomInBtn.className = "toolbar_button";
	zoomInBtn.style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI3IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI4IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjExIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxMSIgeTE9IjgiIHgyPSIxMSIgeTI9IjE0IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxNi41IiB5MT0iMTYuNSIgeDI9IjIxIiB5Mj0iMjEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')";
	zoomInBtn.style.backgroundSize = "contain";
	zoomInBtn.setAttribute("data-balloon", "Zoom In (Ctrl +)");
	zoomInBtn.setAttribute("data-balloon-pos", "right");
	zoomInBtn.onclick = function(){ loopy.zoomIn(); };
	self.dom.appendChild(zoomInBtn);

	// Zoom Out button
	var zoomOutBtn = document.createElement("div");
	zoomOutBtn.className = "toolbar_button";
	zoomOutBtn.style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI3IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI4IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjExIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxNi41IiB5MT0iMTYuNSIgeDI9IjIxIiB5Mj0iMjEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')";
	zoomOutBtn.style.backgroundSize = "contain";
	zoomOutBtn.setAttribute("data-balloon", "Zoom Out (Ctrl -)");
	zoomOutBtn.setAttribute("data-balloon-pos", "right");
	zoomOutBtn.onclick = function(){ loopy.zoomOut(); };
	self.dom.appendChild(zoomOutBtn);

	// Zoom Reset button
	var zoomResetBtn = document.createElement("div");
	zoomResetBtn.className = "toolbar_button";
	zoomResetBtn.innerHTML = "100%";
	zoomResetBtn.style.fontSize = "18px";
	zoomResetBtn.style.fontWeight = "bold";
	zoomResetBtn.style.lineHeight = "55px";
	zoomResetBtn.style.textAlign = "center";
	zoomResetBtn.style.color = "#000";
	zoomResetBtn.setAttribute("data-balloon", "Reset Zoom (Ctrl 0)");
	zoomResetBtn.setAttribute("data-balloon-pos", "right");
	zoomResetBtn.onclick = function(){ loopy.zoomReset(); };
	self.dom.appendChild(zoomResetBtn);

	// Zoom to Fit button
	var zoomFitBtn = document.createElement("div");
	zoomFitBtn.className = "toolbar_button";
	zoomFitBtn.innerHTML = "FIT";
	zoomFitBtn.style.fontSize = "20px";
	zoomFitBtn.style.fontWeight = "bold";
	zoomFitBtn.style.lineHeight = "40px";
	zoomFitBtn.style.textAlign = "center";
	zoomFitBtn.style.color = "#000";
	zoomFitBtn.setAttribute("data-balloon", "Zoom to Fit");
	zoomFitBtn.setAttribute("data-balloon-pos", "right");
	zoomFitBtn.onclick = function(){ loopy.zoomToFit(); };
	self.dom.appendChild(zoomFitBtn);

	// Select button
	self.selectButton = function(button){
		for(var i=0;i<buttons.length;i++){
			buttons[i].deselect();
		}
		button.select();
	};

	// Set Tool
	self.currentTool = "ink";
	self.setTool = function(tool){
		self.currentTool = tool;
		var name = "TOOL_"+tool.toUpperCase();
		loopy.tool = Loopy[name];
		document.getElementById("canvasses").setAttribute("cursor",tool);
	};

	// Populate those buttons!
	self.addButton({
		id: "ink",
		tooltip: "PE(N)CIL",
		callback: function(){
			self.setTool("ink");
		}
	});
	self.addButton({
		id: "label",
		tooltip: "(T)EXT",
		callback: function(){
			self.setTool("label");
		}
	});
	self.addButton({
		id: "drag",
		tooltip: "MO(V)E",
		callback: function(){
			self.setTool("drag");
		}
	});
	self.addButton({
		id: "erase",
		tooltip: "(E)RASE",
		callback: function(){
			self.setTool("erase");
		}
	});

	// Undo button
	self.addButton({
		id: "undo",
		tooltip: isMacLike ? "UNDO (⌘-Z)" : "UNDO (CTRL-Z)",
		isActionButton: true,
		callback: () => loopy.history.undo()
	});

	// Redo button
	self.addButton({
		id: "redo",
		tooltip: isMacLike ? "REDO (⌘-Y)" : "REDO (CTRL-Y)",
		isActionButton: true,
		callback: () => loopy.history.redo()
	});

	// Select default tool/button
	buttonsByID.ink.callback();

	// Hide & Show

}

function ToolbarButton(toolbar, config){

	var self = this;
	self.id = config.id;

	// Icon
	self.dom = document.createElement("div");
	self.dom.setAttribute("class", "toolbar_button");
	self.dom.style.backgroundImage = "url('"+config.icon+"')";

	// Tooltip!
	self.dom.setAttribute("data-balloon", config.tooltip);
	self.dom.setAttribute("data-balloon-pos", "right");

	// Selected?
	self.select = function(){
		self.dom.setAttribute("selected", "yes");
	};
	self.deselect = function(){
		self.dom.setAttribute("selected", "no");
	};

	// On Click
	self.callback = function(){
		config.callback();
		toolbar.selectButton(self);
	};
	self.dom.onclick = self.callback;

}
