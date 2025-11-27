/**********************************

HISTORY - Undo/Redo System with Persistence

**********************************/

function History(loopy){

	var self = this;
	self.loopy = loopy;

	// History array and current position
	self.states = [];
	self.currentIndex = -1;
	self.maxHistorySize = 1000; // Reduced for storage efficiency

	// Optional: Track action descriptions
	self.actions = [];
	self.enableActionTracking = true; // Set to true to enable action tracking

	// Persistence settings
	self.enablePersistence = true; // Enable browser storage
	self.storageKey = 'loopy_history'; // LocalStorage key
	self.autoSaveInterval = 5000; // Auto-save every 5 seconds
	self.maxStorageSize = 5 * 1024 * 1024; // 5MB max storage

	// Flag to prevent recording during undo/redo operations
	self.isUndoRedoing = false;

	// Debounce timer for grouping related changes
	self.recordTimer = null;
	self.autoSaveTimer = null;

	// Save current state to history
	self.record = function(actionDescription){

		// Don't record if we're in the middle of undo/redo
		if(self.isUndoRedoing) return;

		// Don't record in play mode
		if(self.loopy.mode == Loopy.MODE_PLAY) return;

		// Clear any pending record timer
		if(self.recordTimer){
			clearTimeout(self.recordTimer);
			self.recordTimer = null;
		}

		// Get current state
		var state = self.loopy.model.serialize();

		// Don't record if state is identical to current state in history
		if(self.currentIndex >= 0 && self.states[self.currentIndex] === state){
			return;
		}

		// Remove any states after current index (clear redo history)
		self.states = self.states.slice(0, self.currentIndex + 1);
		if(self.enableActionTracking){
			self.actions = self.actions.slice(0, self.currentIndex + 1);
		}

		// Add new state
		self.states.push(state);
		self.currentIndex++;

		// Track action if enabled
		if(self.enableActionTracking){
			var timestamp = new Date().toISOString();
			self.actions.push({
				description: actionDescription || "Unknown action",
				timestamp: timestamp
			});
		}

		// Limit history size
		if(self.states.length > self.maxHistorySize){
			self.states.shift();
			if(self.enableActionTracking){
				self.actions.shift();
			}
			self.currentIndex--;
			if(self.currentIndex < 0) self.currentIndex = 0;
		}

		// Update UI
		self.updateUI();

		// Schedule auto-save
		self.scheduleAutoSave();
	};

	// Record with delay (for grouping multiple changes)
	self.recordDelayed = function(actionDescription){
		// Don't record if we're in the middle of undo/redo
		if(self.isUndoRedoing) return;

		// Don't record in play mode
		if(self.loopy.mode == Loopy.MODE_PLAY) return;

		// Clear existing timer
		if(self.recordTimer){
			clearTimeout(self.recordTimer);
		}

		// Set new timer
		self.recordTimer = setTimeout(function(){
			self.record(actionDescription);
		}, 300);
	};

	// Undo action
	self.undo = function(){

		// Clear any pending records
		if(self.recordTimer){
			clearTimeout(self.recordTimer);
			self.recordTimer = null;
		}

		if(!self.canUndo()) return;

		self.isUndoRedoing = true;

		// Get current state
		var currentState = self.loopy.model.serialize();

		// Check if we have unsaved changes
		var hasUnsavedChanges = self.currentIndex < 0 ||
								(self.currentIndex < self.states.length &&
								 self.states[self.currentIndex] !== currentState);

		if(hasUnsavedChanges){
			// Save current state before undoing
			self.states = self.states.slice(0, self.currentIndex + 1);
			self.states.push(currentState);
			if(self.enableActionTracking){
				self.actions = self.actions.slice(0, self.currentIndex + 1);
				self.actions.push({
					description: "Unsaved changes before undo",
					timestamp: new Date().toISOString()
				});
			}
			self.currentIndex++;
		}

		// Move back one position
		self.currentIndex--;

		// Restore the state at the new position
		if(self.currentIndex >= 0 && self.currentIndex < self.states.length){
			self.loopy.model.deserialize(self.states[self.currentIndex]);
		} else if(self.currentIndex === -1){
			// Special case: restore to completely empty state
			self.loopy.model.clear();
		}

		self.isUndoRedoing = false;

		// Update UI
		self.updateUI();
		publish("model/changed");

		// Schedule auto-save
		self.scheduleAutoSave();
	};

	// Redo action
	self.redo = function(){

		// Clear any pending records
		if(self.recordTimer){
			clearTimeout(self.recordTimer);
			self.recordTimer = null;
		}

		if(!self.canRedo()) return;

		self.isUndoRedoing = true;

		// Move forward one state
		self.currentIndex++;

		// Restore that state
		if(self.currentIndex < self.states.length){
			self.loopy.model.deserialize(self.states[self.currentIndex]);
		}

		self.isUndoRedoing = false;

		// Update UI
		self.updateUI();
		publish("model/changed");

		// Schedule auto-save
		self.scheduleAutoSave();
	};

	// Check if undo is available
	self.canUndo = function(){
		if(self.currentIndex > 0) return true;

		if(self.currentIndex === 0){
			var currentState = self.loopy.model.serialize();
			return self.states[0] !== currentState || self.states[0] !== self.getEmptyState();
		}

		if(self.currentIndex === -1 && self.states.length > 0){
			return true;
		}

		return false;
	};

	// Check if redo is available
	self.canRedo = function(){
		return self.currentIndex < self.states.length - 1;
	};

	// Update UI button states
	self.updateUI = function(){
		publish("history/updated", [self.canUndo(), self.canRedo()]);
	};

	// Clear history
	self.clear = function(){
		self.states = [];
		self.actions = [];
		self.currentIndex = -1;
		self.updateUI();

		// Clear from storage
		if(self.enablePersistence){
			self.clearStorage();
		}
	};

	// Get empty state
	self.getEmptyState = function(){
		var tempModel = new Model(self.loopy);
		var emptyState = tempModel.serialize();
		return emptyState;
	};

	// Initialize with empty or current state
	self.initialize = function(){
		// Try to load from storage first
		if(self.enablePersistence && self.loadFromStorage()){
			console.log("History loaded from browser storage");
			return;
		}

		// Otherwise initialize with empty state
		var emptyState = self.getEmptyState();
		var currentState = self.loopy.model.serialize();

		if(currentState === emptyState){
			self.states = [emptyState];
			self.currentIndex = 0;
		} else {
			self.states = [emptyState, currentState];
			self.currentIndex = 1;
		}

		if(self.enableActionTracking){
			self.actions = [{
				description: "Empty canvas",
				timestamp: new Date().toISOString()
			}];
			if(currentState !== emptyState){
				self.actions.push({
					description: "Initial load",
					timestamp: new Date().toISOString()
				});
			}
		}

		self.updateUI();
	};

	///////////////////////////
	// BROWSER STORAGE ////////
	///////////////////////////

	// Save to localStorage
	self.saveToStorage = function(){
		if(!self.enablePersistence) return false;

		try {
			var data = {
				states: self.states,
				currentIndex: self.currentIndex,
				actions: self.enableActionTracking ? self.actions : [],
				timestamp: new Date().toISOString(),
				version: "1.0"
			};

			var jsonString = JSON.stringify(data);

			// Check size
			if(jsonString.length > self.maxStorageSize){
				console.warn("History too large for storage. Trimming old states.");
				// Trim oldest states
				var trimCount = Math.floor(self.states.length * 0.3); // Remove 30%
				self.states = self.states.slice(trimCount);
				if(self.enableActionTracking){
					self.actions = self.actions.slice(trimCount);
				}
				self.currentIndex = Math.max(0, self.currentIndex - trimCount);

				// Try again
				data.states = self.states;
				data.currentIndex = self.currentIndex;
				data.actions = self.enableActionTracking ? self.actions : [];
				jsonString = JSON.stringify(data);
			}

			localStorage.setItem(self.storageKey, jsonString);

			// Also save current model state separately for recovery
			localStorage.setItem(self.storageKey + '_current', self.loopy.model.serialize());
			localStorage.setItem(self.storageKey + '_timestamp', new Date().toISOString());

			return true;
		} catch(e) {
			console.error("Failed to save history to storage:", e);
			// If quota exceeded, try clearing old data
			if(e.name === 'QuotaExceededError'){
				self.clearOldStorage();
			}
			return false;
		}
	};

	// Load from localStorage
	self.loadFromStorage = function(){
		if(!self.enablePersistence) return false;

		try {
			var jsonString = localStorage.getItem(self.storageKey);
			if(!jsonString) return false;

			var data = JSON.parse(jsonString);

			// Validate data
			if(!data.states || !Array.isArray(data.states)) return false;

			self.states = data.states;
			self.currentIndex = data.currentIndex || 0;

			if(self.enableActionTracking && data.actions){
				self.actions = data.actions;
			}

			// Restore the current state to the model
			if(self.currentIndex >= 0 && self.currentIndex < self.states.length){
				self.loopy.model.deserialize(self.states[self.currentIndex]);
			}

			self.updateUI();

			console.log("History restored from " + data.timestamp);
			return true;

		} catch(e) {
			console.error("Failed to load history from storage:", e);
			return false;
		}
	};

	// Clear storage
	self.clearStorage = function(){
		try {
			localStorage.removeItem(self.storageKey);
			localStorage.removeItem(self.storageKey + '_current');
			localStorage.removeItem(self.storageKey + '_timestamp');
		} catch(e) {
			console.error("Failed to clear storage:", e);
		}
	};

	// Clear old storage data
	self.clearOldStorage = function(){
		try {
			// Clear other old Loopy data if exists
			var keysToRemove = [];
			for(var i = 0; i < localStorage.length; i++){
				var key = localStorage.key(i);
				if(key && key.startsWith('loopy_') && key !== self.storageKey){
					keysToRemove.push(key);
				}
			}
			keysToRemove.forEach(function(key){
				localStorage.removeItem(key);
			});
		} catch(e) {
			console.error("Failed to clear old storage:", e);
		}
	};

	// Schedule auto-save
	self.scheduleAutoSave = function(){
		if(!self.enablePersistence) return;

		// Clear existing timer
		if(self.autoSaveTimer){
			clearTimeout(self.autoSaveTimer);
		}

		// Set new timer
		self.autoSaveTimer = setTimeout(function(){
			self.saveToStorage();
		}, self.autoSaveInterval);
	};

	///////////////////////////
	// EXPORT/IMPORT //////////
	///////////////////////////

	// Export history to JSON file
	self.exportToFile = function(){
		var data = {
			version: "1.0",
			timestamp: new Date().toISOString(),
			currentState: self.loopy.model.serialize(),
			history: {
				states: self.states,
				currentIndex: self.currentIndex,
				actions: self.enableActionTracking ? self.actions : []
			},
			metadata: {
				totalStates: self.states.length,
				memoryUsage: self.getMemoryEstimate(),
				enableActionTracking: self.enableActionTracking
			}
		};

		var jsonString = JSON.stringify(data, null, 2);
		var blob = new Blob([jsonString], {type: "application/json"});
		var url = URL.createObjectURL(blob);

		var link = document.createElement('a');
		link.href = url;
		link.download = 'loopy_history_' + Date.now() + '.json';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		console.log("History exported: " + data.metadata.totalStates + " states");
	};

	// Import history from JSON file
	self.importFromFile = function(){
		var input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = function(e){
			var file = e.target.files[0];
			if(!file) return;

			var reader = new FileReader();
			reader.onload = function(event){
				try {
					var data = JSON.parse(event.target.result);

					// Validate data
					if(!data.history || !data.history.states){
						throw new Error("Invalid history file format");
					}

					// Load history
					self.states = data.history.states;
					self.currentIndex = data.history.currentIndex || 0;

					if(self.enableActionTracking && data.history.actions){
						self.actions = data.history.actions;
					}

					// Restore current state
					if(self.currentIndex >= 0 && self.currentIndex < self.states.length){
						self.loopy.model.deserialize(self.states[self.currentIndex]);
					}

					self.updateUI();

					// Save to browser storage
					if(self.enablePersistence){
						self.saveToStorage();
					}

					alert("History imported successfully: " + self.states.length + " states loaded");

				} catch(error) {
					alert("Failed to import history: " + error.message);
					console.error("Import error:", error);
				}
			};

			reader.readAsText(file);
		};

		input.click();
	};

	// Export current session (simplified)
	self.exportSession = function(){
		return {
			states: self.states.length,
			currentIndex: self.currentIndex,
			canUndo: self.canUndo(),
			canRedo: self.canRedo(),
			actions: self.enableActionTracking ? self.actions.slice(-10) : [], // Last 10 actions
			memory: self.getMemoryEstimate()
		};
	};

	// Get memory estimate
	self.getMemoryEstimate = function(){
		var totalSize = 0;
		for(var i = 0; i < self.states.length; i++){
			totalSize += self.states[i].length;
		}
		return {
			bytes: totalSize,
			kilobytes: (totalSize / 1024).toFixed(2),
			megabytes: (totalSize / 1024 / 1024).toFixed(3),
			percentage: ((totalSize / self.maxStorageSize) * 100).toFixed(1) + "%"
		};
	};

	///////////////////////////
	// SUBSCRIBE TO EVENTS ////
	///////////////////////////

	var hasInitialized = false;

	// Initialize on first model change
	subscribe("model/changed", function(){
		if(!hasInitialized && !self.isUndoRedoing){
			hasInitialized = true;
			setTimeout(function(){
				self.initialize();
			}, 100);
			return;
		}

		if(self.isUndoRedoing) return;
		if(self.loopy.mode == Loopy.MODE_PLAY) return;

		self.recordDelayed("Model changed");
	});

	// Record state before drag operations
	subscribe("mousedown", function(){
		if(self.loopy.mode != Loopy.MODE_EDIT) return;
		if(self.isUndoRedoing) return;

		if(self.loopy.tool == Loopy.TOOL_DRAG){
			if(self.recordTimer){
				clearTimeout(self.recordTimer);
				self.recordTimer = null;
			}
			self.record("Before drag");
		}
	});

	// Track specific actions if enabled
	if(self.enableActionTracking){
		subscribe("kill", function(items){
			if(self.isUndoRedoing) return;
			if(!items || !items.length || !items[0]) return;

			var item = items[0];
			var type = (item && item._CLASS_) ? item._CLASS_ : "item";
			self.recordDelayed("Deleted " + type);
		});
	}

	// Clear history when resetting
	subscribe("model/reset", function(){
		self.clear();
		self.initialize();
	});

	// Save before page unload
	window.addEventListener('beforeunload', function(){
		if(self.enablePersistence){
			self.saveToStorage();
		}
	});

	// Periodic auto-save
	if(self.enablePersistence){
		setInterval(function(){
			if(!self.isUndoRedoing && self.loopy.mode == Loopy.MODE_EDIT){
				self.saveToStorage();
			}
		}, 30000); // Every 30 seconds
	}

	// --- Ensure history initializes immediately on startup ---
	if (!hasInitialized) {
		setTimeout(function(){
			try {
				self.initialize();
				hasInitialized = true;
				console.log("History initialized immediately on load");
			} catch(e) {
				console.error("History failed to initialize:", e);
			}
		}, 100);
	}
}
