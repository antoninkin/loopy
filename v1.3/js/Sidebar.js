/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	var self = this;
	PageUI.call(self, document.getElementById("sidebar"));

	// Edit
    self.edit = function(object){
        self.showPage(object._CLASS_);
        // Set flag so onedit knows this is initial edit (not typing)
        if(self.currentPage && self.currentPage._isInitialEdit !== undefined){
            self.currentPage._isInitialEdit = true;
        }
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

        // Standard label (shown when NOT split)
        page.addComponent("label", new ComponentInput({
            label: "<br><br>Name:"
        }));

        // Split node labels (shown when split)
        page.addComponent("topLabel", new ComponentInput({
            label: "<br><br>Top Name:"
        }));
        page.addComponent("bottomLabel", new ComponentInput({
            label: "Bottom Name:"
        }));

        page.addComponent("active", new ComponentSlider({
            bg: "type",
            label: "Node Type:",
            options: [0,1,2],
            oninput: function(value){
                Node.active = value;
                // Toggle label visibility based on type
                page.updateLabelVisibility();
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
            oninput: function(value){
                Node.defaultValue = value;
            }
        }));
        page.addComponent("radius", new ComponentSlider({
            bg: "radius",
            label: "Node Radius:",
            options: [45, 60, 80, 110, 150],
            oninput: function(value){
                Node.radius = value;
            }
        }));
        page.addComponent("gain", new ComponentSlider({
            bg: "gain",
            label: "Node Gain:",
            options: [0.5, 0.75, 1, 1.33, 2],
            oninput: function(value){
                Node.gain = value;
            }
        }));
        page.addComponent("strength", new ComponentSlider({
            bg: "quantum",
            label: "Node Quantum:",
            options: [0.001, 0.01, 0.1, 0.2, 0.33],
            oninput: function(value){
                // Check if this should be Node.strength = value;
				Node.gain = value;
            }
        }));

        // Method to toggle label visibility
        page.updateLabelVisibility = function(){
            var node = page.target;
            if(!node) return;

            var isSplit = (node.active === 2);
            var labelComp = page.getComponent("label");
            var topComp = page.getComponent("topLabel");
            var bottomComp = page.getComponent("bottomLabel");

            if(labelComp && labelComp.dom){
                labelComp.dom.style.display = isSplit ? "none" : "block";
            }
            if(topComp && topComp.dom){
                topComp.dom.style.display = isSplit ? "block" : "none";
            }
            if(bottomComp && bottomComp.dom){
                bottomComp.dom.style.display = isSplit ? "block" : "none";
            }
        };

        // Track if this is initial edit vs typing update
        page._isInitialEdit = false;

        page.onedit = function(){
            var node = page.target;
            var color = loopy.model.COLOUR_NODE_LIST[node.hue];
            page.getComponent("init").setBGColor(color);
            page.getComponent("hue").setBGColor(color);
            page.getComponent("radius").setBGColor(color);
            page.getComponent("gain").setBGColor(color);
            page.getComponent("strength").setBGColor(color);
            page.getComponent("active").setBGColor(color);

            // Initialize split labels if needed
            if(node.active === 2){
                if(node.topLabel === undefined) node.topLabel = node.label || "?";
                if(node.bottomLabel === undefined) node.bottomLabel = "?";
            }

            // Update visibility
            page.updateLabelVisibility();

            // ONLY auto-focus on INITIAL edit, not on every keystroke
            if(page._isInitialEdit){
                page._isInitialEdit = false;
                var name = node.label;
                if(name=="" || name=="?"){
                    if(node.active === 2){
                        page.getComponent("topLabel").select();
                    } else {
                        page.getComponent("label").select();
                    }
                }
            }
        };

        page.addComponent(new ComponentButton({
            label: "delete node",
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
		page.addComponent("showLabel", new ComponentToggle({
			label: "Show +/- Label:",
			oninput: function(value, edge){
				edge.showLabel = value;
				publish("model/changed");
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
			"<span class='mini_button' onclick='publish(\"modal\",[\"credits\"])'>credits</span><br>"+

			"<hr/>"+

			// ZOOM INDICATOR HERE
			"<div style='text-align:left; color:black; font-size:20px'>"+
			"Zoom: <span id='zoom-level'>100%</span><br>"+
			"<span style='font-size:13px'>Ctrl+Scroll, Ctril+ +/- or use toolbar</span>"+
			"</div>"+

			"<hr/><br>"+

			"<span class='mini_button' onclick='loopy.sidebar.showPage(\"History\")'>history manager</span><br><br>"+

			"<span class='mini_button' onclick='publish(\"modal\",[\"export_dot\"])'>export as DOT</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"modal\",[\"save_link\"])'>save as link</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"export/file\")'>save as file</span> "+
			"<span class='mini_button' onclick='publish(\"import/file\")'>load from file</span> <br><br>"+
			"<span class='mini_button' onclick='publish(\"modal\",[\"embed\"])'>embed in your website</span> <br><br>"+

			"<hr/><br>"+

			"<a target='_blank' href='../'>LOOPY</a> was "+
			"made by <a target='_blank' href='http://ncase.me'>nicky case</a><br> and updated by <a target='_blank' href='https://people.unisa.edu.au/john.kennedy'>John Kennedy</a><br> and Anton Inkin"

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
		if(Key.control){ // Ctrl-S or Ã¢Å’Ëœ-S
			publish("modal",["save_link"]);
		}
	});

	// History Manager Page
	(function(){
		var page = new SidebarPage();

		// Back button
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));

		// Title
		page.addComponent(new ComponentHTML({
			html: "<br><br><b style='font-size:1.2em'>History Manager</b><br>"
		}));

		// Current status
		var statusDiv = document.createElement("div");
		statusDiv.id = "history_status";
		statusDiv.style.padding = "10px";
		statusDiv.style.background = "#f0f0f0";
		statusDiv.style.borderRadius = "5px";
		statusDiv.style.marginBottom = "5px";
		statusDiv.style.fontSize = "18px";
		page.dom.appendChild(statusDiv);

		// Recent actions list
		var actionsDiv = document.createElement("div");
		actionsDiv.id = "history_actions";
		actionsDiv.style.padding = "10px";
		actionsDiv.style.background = "#e8e8e8";
		actionsDiv.style.borderRadius = "5px";
		actionsDiv.style.marginBottom = "10px";
		actionsDiv.style.fontSize = "12px";
		actionsDiv.style.maxHeight = "150px";
		actionsDiv.style.overflowY = "auto";
		page.dom.appendChild(actionsDiv);

		// Update status function
		var updateStatus = function(){
			if(!loopy.history) return;

			var session = loopy.history.exportSession();
			var memory = session.memory;

			var html = "<b>Session:</b> " + session.states + " states, " + memory.kilobytes + " KB";
			if(loopy.history.enablePersistence){
				html += " <span style='color:green'>Auto-save</span>";
			}
			statusDiv.innerHTML = html;

			// Update recent actions
			var actionsHtml = "<b>Recent Actions:</b><br>";
			var actions = session.actions || [];
			if(actions.length === 0){
				actionsHtml += "<i style='color:#888'>No actions yet</i>";
			} else {
				for(var i = actions.length - 1; i >= 0; i--){
					var action = actions[i];
					var desc = action.description || 'Unknown';
					var time = action.timestamp || '';
					// Highlight current position
					var isCurrent = (loopy.history.currentIndex === loopy.history.states.length - actions.length + i);
					var style = isCurrent ? 'background:#fff; padding:2px 4px; border-radius:3px;' : '';
					actionsHtml += '<div style="margin:3px 0; ' + style + '">';
					actionsHtml += '<span style="color:#666; font-size:10px;">' + time + '</span><br>';
					actionsHtml += desc;
					actionsHtml += '</div>';
				}
			}
			actionsDiv.innerHTML = actionsHtml;
		};

		// Persistence toggle
		page.addComponent(new ComponentHTML({
			html: "<br><b>Browser Storage:</b>"
		}));

		var persistenceCheckbox = document.createElement("div");
		persistenceCheckbox.innerHTML =
			'<label style="cursor:pointer; font-size:16px;">' +
			'<input type="checkbox" id="history_persistence" style="margin-right:8px;">' +
			'Save history in browser' +
			'</label>' +
			'<div style="font-size:12px; color:#666; margin-top:5px;">' +
			'History will persist after refresh/close' +
			'</div>';
		page.dom.appendChild(persistenceCheckbox);

		// Set checkbox state and handler
		persistenceCheckbox.querySelector('#history_persistence').onchange = function(e){
			if(loopy.history){
				loopy.history.enablePersistence = e.target.checked;
				if(e.target.checked){
					loopy.history.saveToStorage();
					updateStatus();
				} else {
					loopy.history.clearStorage();
					updateStatus();
				}
			}
		};

		// Export button
		page.addComponent(new ComponentButton({
			label: "Export History to JSON",
			onclick: function(){
				if(loopy.history){
					loopy.history.exportToFile();
				}
			}
		}));

		// Import button
		page.addComponent(new ComponentButton({
			label: "Import History from JSON",
			onclick: function(){
				if(loopy.history){
					if(confirm("This will replace your current history. Continue?")){
						loopy.history.importFromFile();
					}
				}
			}
		}));

		// Management section
		page.addComponent(new ComponentHTML({
			html: "<br><b>Management</b><br>"
		}));

		// Complete Reset button
		page.addComponent(new ComponentButton({
			label: "Clear All (Reset)",
			onclick: function(){
				if(confirm("WARNING: This will:\n Clear all history\n Clear browser storage\n Reset canvas to blank\n Reset all settings to defaults\n\nThis cannot be undone. Continue?")){
					if(loopy.history && loopy.model){
						// 1. Clear all history
						loopy.history.clear();

						// 2. Clear browser storage
						loopy.history.clearStorage();

						// 3. Clear the model (blank canvas)
						loopy.model.clear();

						// 4. Reset settings to defaults
						Node.defaultValue = 0.5;
						Node.defaultHue = 0;
						loopy.signalSpeed = 3;
						loopy.offsetX = 0;
						loopy.offsetY = 0;
						loopy.offsetScale = 1;

						// 5. Reset model settings
						loopy.model.speed = 0.05;
						loopy.model.MAX_SIGNAL_AGE = 5;
						loopy.model.MAX_SIGNALS_PER_EDGE = 25;
						loopy.model.MAX_SIGNALS = 200;

						// 6. Reinitialize history with blank state
						loopy.history.initialize();

						// 7. Reset Node UID counter
						Node._UID = 0;

						// 8. Clear URL parameters if any
						if(window.history && window.history.replaceState){
							var cleanURL = window.location.origin + window.location.pathname;
							window.history.replaceState(null, null, cleanURL);
						}

						// 9. Reset to edit mode and main page
						loopy.setMode(Loopy.MODE_EDIT);
						self.showPage("Edit");

						// 10. Update UI
						publish("model/changed");
						updateStatus();

						// 11. Reset dirty flag
						loopy.dirty = false;

						alert("Complete reset successful. Canvas is now blank.");
					}
				}
			}
		}));

		// Clear session history button
		page.addComponent(new ComponentButton({
			label: "Clear Session History",
			onclick: function(){
				if(confirm("This will clear all undo/redo history. Continue?")){
					if(loopy.history){
						loopy.history.clear();
						loopy.history.initialize();
						updateStatus();
						alert("History cleared");
					}
				}
			}
		}));

		// Show page handler
		page.onshow = function(){
			// Update checkboxes
			if(loopy.history){
				var persCheckbox = document.getElementById('history_persistence');
				//var trackCheckbox = document.getElementById('history_tracking');
				if(persCheckbox) persCheckbox.checked = loopy.history.enablePersistence;
				//if(trackCheckbox) trackCheckbox.checked = loopy.history.enableActionTracking;
			}
			updateStatus();

			// Set up periodic update
			page.statusInterval = setInterval(updateStatus, 1000);
		};

		// Hide page handler
		page.onhide = function(){
			// Clear periodic update
			if(page.statusInterval){
				clearInterval(page.statusInterval);
				page.statusInterval = null;
			}
		};

		self.addPage("History", page);
	})();
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

function ComponentToggle(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: label + checkbox
	self.dom = document.createElement("div");
	self.dom.style.marginTop = "10px";
	self.dom.style.marginBottom = "10px";

	var label = document.createElement("label");
	label.style.cursor = "pointer";
	label.style.display = "flex";
	label.style.alignItems = "center";
	label.style.gap = "8px";

	var checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = false; // Default to unchecked (invisible)
	checkbox.style.width = "18px";
	checkbox.style.height = "18px";
	checkbox.style.cursor = "pointer";

	var labelText = document.createElement("span");
	labelText.innerHTML = config.label;

	label.appendChild(checkbox);
	label.appendChild(labelText);
	self.dom.appendChild(label);

	checkbox.onchange = function(){
		self.setValue(checkbox.checked);
		if(config.oninput){
			config.oninput(checkbox.checked, self.page.target);
		}
	};

	// Show - sync checkbox with current value
	self.show = function(){
		var value = self.getValue();
		checkbox.checked = (value === true || value === 1);
	};

}
