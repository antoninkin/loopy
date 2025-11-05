/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	var self = this;
	PageUI.call(self, document.getElementById("sidebar"));

	// Edit
	self.edit = function(object){
		self.showPage(object._CLASS_);
		self.currentPage.edit(object);
	};

	// Go back to main when the thing you're editing is killed
	subscribe("kill",function(object){
		if(self.currentPage.target==object){
			self.showPage("Edit");
		}
	});

	////////////////////////////////////////////////////////////////////////////////////////////
	// ACTUAL PAGES ////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////

	// Node!
	(function(){
		var page = new SidebarPage();
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		page.addComponent("label", new ComponentInput({
			label: "<br><br>Name:"
			//label: "Name:"
		}));
		page.addComponent("active", new ComponentSlider({
			bg: "type",
			label: "Node Type:",
			options: [0,1],
			oninput: function(value){
				Node.active = value;
			}
		}));
		page.addComponent("hue", new ComponentSlider({
			bg: "colour",
			label: "Color:",
			options: [0,1,2,3,4,5,6,7,8,9],
			oninput: function(value){
				Node.defaultHue = value;
			}
		}));
		page.addComponent("init", new ComponentSlider({
			bg: "initial",
			label: "Start Amount:",
			options: [0, 0.25, 0.50, 0.75, 1],
			//options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
			oninput: function(value){
				Node.defaultValue = value;
			}
		}));
		page.addComponent("radius", new ComponentSlider({
			bg: "radius",
			label: "Node Radius:",
			options: [45, 60, 80, 110, 150],
			//options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
			oninput: function(value){
				Node.radius = value;
			}
		}));
		page.addComponent("gain", new ComponentSlider({
			bg: "gain",
			label: "Node Gain:",
			options: [0.5, 0.75, 1, 1.33, 2],
			//options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
			oninput: function(value){
				Node.gain = value;
			}
		}));
		page.addComponent("strength", new ComponentSlider({
			bg: "quantum",
			label: "Node Quantum:",
			options: [0.001, 0.01, 0.1, 0.2, 0.33],
			//options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
			oninput: function(value){
				Node.gain = value;
			}
		}));
		page.onedit = function(){

			// Set color of Slider
			var node = page.target;
			var color = loopy.model.COLOUR_NODE_LIST[node.hue];
			page.getComponent("init").setBGColor(color);
			page.getComponent("hue").setBGColor(color);
			page.getComponent("radius").setBGColor(color);
			page.getComponent("gain").setBGColor(color);
			page.getComponent("strength").setBGColor(color);
			page.getComponent("active").setBGColor(color);

			// Focus on the name field IF IT'S "" or "?"
			var name = node.label;
			if(name=="" || name=="?") page.getComponent("label").select();

		};
		page.addComponent(new ComponentButton({
			label: "delete node",
			//label: "delete circle",
			onclick: function(node){
				node.kill();
				self.showPage("Edit");
			}
		}));
		self.addPage("Node", page);
	})();

	// Edge!
	(function(){
		var page = new SidebarPage();
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		page.addComponent("direction", new ComponentSlider({
			bg: "strength",
			label: "<br><br>Relationship Type:",
			options: [1,-1],
			oninput: function(value,edge){
				edge.setDirection(value);
			}
		}));
		page.addComponent("attenuation", new ComponentSlider({
			bg: "attenuation",
			label: "<br><br>Signal Attenuation:",
			options: [1, 0.99, 0.94, 0.89, 0.79, 0.56, 0.0000001],
			oninput: function(value,edge){
				edge.setAttenuation(value);
			}
		}));
		page.addComponent("speedMultiplier", new ComponentSlider({
			bg: "speed",
			label: "<br><br>Signal Speed:",
			options: [0.5, 0.67, 0.8, 0.91, 1, 1.1, 1.25, 1.5, 2],
			oninput: function(value){
				Edge.speedMultiplier = value;
			}
		}));
		page.addComponent(new ComponentButton({
			label: "delete edge",
			onclick: function(edge){
				edge.kill();
				self.showPage("Edit");
			}
		}));
		self.addPage("Edge", page);
	})();

	// Label!
	(function(){
		var page = new SidebarPage();
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		page.addComponent("text", new ComponentInput({
			label: "<br><br>Label:",
			textarea: true
		}));
		page.onshow = function(){
			// Focus on the text field
			page.getComponent("text").select();
		};
		page.onhide = function(){

			// If you'd just edited it...
			var label = page.target;
			if(!page.target) return;

			// If text is "" or all spaces, DELETE.
			var text = label.text;
			if(/^\s*$/.test(text)){
				// that was all whitespace, KILL.
				page.target = null;
				label.kill();
			}

		};
		page.addComponent(new ComponentButton({
			label: "delete label",
			onclick: function(label){
				label.kill();
				self.showPage("Edit");
			}
		}));
		self.addPage("Label", page);
	})();

	// Edit
	(function(){
		var page = new SidebarPage();
		page.addComponent(new ComponentHTML({
			html: ""+

			"<b style='font-size:1.4em'>LOOPY</b> (v1.3)<br>a tool for thinking in systems<br><br>"+

			"<span class='mini_button' onclick='publish(\"modal\",[\"examples\"])'>see examples</span> "+
			"<span class='mini_button' onclick='publish(\"modal\",[\"howto\"])'>how to</span> "+
			"<span class='mini_button' onclick='publish(\"modal\",[\"credits\"])'>credits</span><br><br>"+

			"<hr/><br>"+

			// ZOOM INDICATOR HERE
			"<div style='text-align:center; color:black; font-size:25px'>"+
			"Zoom: <span id='zoom-level'>100%</span><br>"+
			"<span style='font-size:15px'>Ctrl+Scroll or use toolbar</span>"+
			"</div><br>"+

			"<hr/><br>"+

			"<span class='mini_button' onclick='publish(\"modal\",[\"export_dot\"])'>export as DOT</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"modal\",[\"save_link\"])'>save as link</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"export/file\")'>save as file</span> "+
			"<span class='mini_button' onclick='publish(\"import/file\")'>load from file</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"modal\",[\"embed\"])'>embed in your website</span> <br><br>"+

			"<hr/><br>"+

			"<a target='_blank' href='../'>LOOPY</a> was "+
			"made by <a target='_blank' href='http://ncase.me'>nicky case</a> and updated by <a target='_blank' href='https://people.unisa.edu.au/john.kennedy'>John Kennedy</a> and Anton Inkin"

		}));

		// Add update function for zoom display
		page.onshow = function(){
			// Update zoom level when page is shown
			var updateZoom = function(){
				var zoomElement = document.getElementById('zoom-level');
				if(zoomElement && window.loopy){
					zoomElement.innerHTML = Math.round(loopy.offsetScale * 100) + '%';
				}
			};

			// Initial update
			updateZoom();

			// Subscribe to changes
			var unsubscriber = subscribe("model/changed", updateZoom);

			// Store unsubscriber for cleanup
			page._zoomUnsubscriber = unsubscriber;
		};

		page.onhide = function(){
			// Clean up subscription when page is hidden
			if(page._zoomUnsubscriber){
				unsubscribe("model/changed", page._zoomUnsubscriber);
			}
		};

		self.addPage("Edit", page);
	})();

	// Ctrl-S to SAVE
	subscribe("key/save",function(){
		if(Key.control){ // Ctrl-S or ⌘-S
			publish("modal",["save_link"]);
		}
	});

}

function SidebarPage(){

	// TODO: be able to focus on next component with an "Enter".

	var self = this;
	self.target = null;

	// DOM
	self.dom = document.createElement("div");
	self.show = function(){ self.dom.style.display="block"; self.onshow(); };
	self.hide = function(){ self.dom.style.display="none"; self.onhide(); };

	// Components
	self.components = [];
	self.componentsByID = {};
	self.addComponent = function(propName, component){

		// One or two args
		if(!component){
			component = propName;
			propName = "";
		}

		component.page = self; // tie to self
		component.propName = propName; // tie to propName
		self.dom.appendChild(component.dom); // add to DOM

		// remember component
		self.components.push(component);
		self.componentsByID[propName] = component;

		// return!
		return component;

	};
	self.getComponent = function(propName){
		return self.componentsByID[propName];
	};

	// Edit
	self.edit = function(object){

		// New target to edit!
		self.target = object;

		// Show each property with its component
		for(var i=0;i<self.components.length;i++){
			self.components[i].show();
		}

		// Callback!
		self.onedit();

	};

	// TO IMPLEMENT: callbacks
	self.onedit = function(){};
	self.onshow = function(){};
	self.onhide = function(){};

	// Start hiding!
	self.hide();

}



/////////////////////////////////////////////////////////////////////////////////////////////
// COMPONENTS ///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

function Component(){
	var self = this;
	self.dom = null;
	self.page = null;
	self.propName = null;
	self.show = function(){
		// TO IMPLEMENT
	};
	self.getValue = function(){
		return self.page.target[self.propName];
	};
	self.setValue = function(value){

		// Model's been changed!
		publish("model/changed");

		// Edit the value!
		self.page.target[self.propName] = value;
		self.page.onedit(); // callback!

	};
}

function ComponentInput(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: label + text input
	self.dom = document.createElement("div");
	var label = _createLabel(config.label);
	var className = config.textarea ? "component_textarea" : "component_input";
	var input = _createInput(className, config.textarea);
	input.oninput = function(event){
		self.setValue(input.value);
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		input.value = self.getValue();
	};

	// Select
	self.select = function(){
		setTimeout(function(){ input.select(); },10);
	};

}

function ComponentSlider(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// TODO: control with + / -, alt keys??

	// DOM: label + slider
	self.dom = document.createElement("div");
	var label = _createLabel(config.label);
	self.dom.appendChild(label);
	var sliderDOM = document.createElement("div");
	sliderDOM.setAttribute("class","component_slider");
	self.dom.appendChild(sliderDOM);

	// Slider DOM: graphic + pointer
	var slider = new Image();
	slider.draggable = true;
	slider.src = "css/sliders/"+config.bg+".png";
	slider.setAttribute("class","component_slider_graphic");
	var pointer = new Image();
	pointer.draggable = false;
	pointer.src = "css/sliders/slider_pointer.png";
	pointer.setAttribute("class","component_slider_pointer");
	sliderDOM.appendChild(slider);
	sliderDOM.appendChild(pointer);
	var movePointer = function(){
		var value = self.getValue();
		var optionIndex = config.options.indexOf(value);
		var x = (optionIndex+0.5) * (250/config.options.length);
		pointer.style.left = (x-7.5)+"px";
	};

	// On click... (or on drag)
	var isDragging = false;
	var onmousedown = function(event){
		isDragging = true;
		sliderInput(event);
	};
	var onmouseup = function(){
		isDragging = false;
	};
	var onmousemove = function(event){
		if(isDragging) sliderInput(event);
	};
	var sliderInput = function(event){

		// What's the option?
		var index = event.x/250;
		var optionIndex = Math.floor(index*config.options.length);
		var option = config.options[optionIndex];
		if(option===undefined) return;
		self.setValue(option);

		// Callback! (if any)
		if(config.oninput){
			config.oninput(option,self.page.target);
		}

		// Move pointer there.
		movePointer();

	};
	_addMouseEvents(slider, onmousedown, onmousemove, onmouseup);

	// Show
	self.show = function(){
		movePointer();
	};

	// BG Color!
	self.setBGColor = function(color){
		slider.style.background = color;
	};

}

function ComponentButton(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: just a button
	self.dom = document.createElement("div");
	var button = _createButton(config.label, function(){
		config.onclick(self.page.target);
	});
	self.dom.appendChild(button);

	// Unless it's a HEADER button!
	if(config.header){
		button.setAttribute("header","yes");
	}

}

function ComponentHTML(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// just a div
	self.dom = document.createElement("div");
	self.dom.innerHTML = config.html;

}

function ComponentOutput(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: just a readonly input that selects all when clicked
	self.dom = _createInput("component_output");
	self.dom.setAttribute("readonly", "true");
	self.dom.onclick = function(){
		self.dom.select();
	};

	// Output the string!
	self.output = function(string){
		self.dom.value = string;
	};

}
