//Detailed Action Tracking

function History(loopy) {
    var self = this;
    self.loopy = loopy;

    // History state
    self.states = [];
    self.currentIndex = -1;
    self.maxHistorySize = 1000;
    self.actions = [];

    // Persistence
    self.enablePersistence = true;
    self.storageKey = 'loopy_history';
    self.autoSaveInterval = 5000;
    self.maxStorageSize = 5 * 1024 * 1024;

    // Flags
    self.isUndoRedoing = false;
    self.recordTimer = null;
    self.autoSaveTimer = null;

    // Snapshot for tracking changes
    self._lastSnapshot = null;

    ///////////////////////////
    // SNAPSHOT SYSTEM ////////
    ///////////////////////////

    self.takeSnapshot = function() {
        var snapshot = { nodes: {}, edges: [], labels: [] };

        // Capture nodes (including topLabel and bottomLabel for split nodes)
        for (var i = 0; i < loopy.model.nodes.length; i++) {
            var n = loopy.model.nodes[i];
            snapshot.nodes[n.id] = {
                id: n.id, label: n.label, hue: n.hue, init: n.init,
                radius: n.radius, gain: n.gain, strength: n.strength,
                active: n.active, x: n.x, y: n.y,
                topLabel: n.topLabel || '',
                bottomLabel: n.bottomLabel || ''
            };
        }

        // Capture edges with unique key (including showLabel)
        for (var i = 0; i < loopy.model.edges.length; i++) {
            var e = loopy.model.edges[i];
            snapshot.edges.push({
                fromId: e.from ? e.from.id : null,
                toId: e.to ? e.to.id : null,
                strength: e.strength,
                direction: e.direction,
                attenuation: e.attenuation,
                speedMultiplier: e.speedMultiplier,
                arc: e.arc,
                rotation: e.rotation,
                showLabel: e.showLabel
            });
        }

        // Capture labels
        for (var i = 0; i < loopy.model.labels.length; i++) {
            var l = loopy.model.labels[i];
            snapshot.labels.push({ text: l.text, x: l.x, y: l.y });
        }

        return snapshot;
    };

    // Create unique edge key
    function edgeKey(e) {
        return e.fromId + '->' + e.toId + '@' + Math.round(e.arc);
    }

    self.detectChanges = function(oldSnap, newSnap) {
        var changes = [];
        if (!oldSnap || !newSnap) return changes;

        // Detect node changes
        var oldNodeIds = Object.keys(oldSnap.nodes);
        var newNodeIds = Object.keys(newSnap.nodes);

        // New nodes
        for (var i = 0; i < newNodeIds.length; i++) {
            var id = newNodeIds[i];
            if (!oldSnap.nodes[id]) {
                changes.push(HistoryTracker.nodeCreated(newSnap.nodes[id]));
            }
        }

        // Deleted nodes
        for (var i = 0; i < oldNodeIds.length; i++) {
            var id = oldNodeIds[i];
            if (!newSnap.nodes[id]) {
                changes.push(HistoryTracker.nodeDeleted(oldSnap.nodes[id]));
            }
        }

        // Changed nodes
        for (var i = 0; i < newNodeIds.length; i++) {
            var id = newNodeIds[i];
            if (oldSnap.nodes[id] && newSnap.nodes[id]) {
                var oldN = oldSnap.nodes[id];
                var newN = newSnap.nodes[id];

                // Check standard properties
                var props = ['label', 'hue', 'init', 'radius', 'gain', 'strength', 'active'];
                for (var j = 0; j < props.length; j++) {
                    var prop = props[j];
                    if (oldN[prop] !== newN[prop]) {
                        changes.push(HistoryTracker.nodeChanged(newN, prop, oldN[prop], newN[prop]));
                    }
                }

                // Check topLabel specifically
                if (oldN.topLabel !== newN.topLabel) {
                    changes.push(HistoryTracker.topLabelChanged(newN, oldN.topLabel, newN.topLabel));
                }

                // Check bottomLabel specifically
                if (oldN.bottomLabel !== newN.bottomLabel) {
                    changes.push(HistoryTracker.bottomLabelChanged(newN, oldN.bottomLabel, newN.bottomLabel));
                }

                // Position change (significant movement only)
                if (Math.abs(oldN.x - newN.x) > 5 || Math.abs(oldN.y - newN.y) > 5) {
                    changes.push(HistoryTracker.nodeMoved(newN, oldN.x, oldN.y, newN.x, newN.y));
                }
            }
        }

        // Build edge maps with unique keys
        var oldEdgeMap = {};
        var newEdgeMap = {};

        for (var i = 0; i < oldSnap.edges.length; i++) {
            var e = oldSnap.edges[i];
            var key = edgeKey(e);
            oldEdgeMap[key] = e;
        }

        for (var i = 0; i < newSnap.edges.length; i++) {
            var e = newSnap.edges[i];
            var key = edgeKey(e);
            newEdgeMap[key] = e;
        }

        // New edges
        for (var key in newEdgeMap) {
            if (!oldEdgeMap[key]) {
                var e = newEdgeMap[key];
                var fromNode = newSnap.nodes[e.fromId] || { id: e.fromId, label: '?' };
                var toNode = newSnap.nodes[e.toId] || { id: e.toId, label: '?' };
                changes.push(HistoryTracker.edgeCreated(fromNode, toNode, e.strength));
            }
        }

        // Deleted edges
        for (var key in oldEdgeMap) {
            if (!newEdgeMap[key]) {
                var e = oldEdgeMap[key];
                var fromNode = oldSnap.nodes[e.fromId] || { id: e.fromId, label: '?' };
                var toNode = oldSnap.nodes[e.toId] || { id: e.toId, label: '?' };
                changes.push(HistoryTracker.edgeDeleted(fromNode, toNode));
            }
        }

        // Edge property changes (only for edges that exist in both)
        for (var key in newEdgeMap) {
            if (oldEdgeMap[key]) {
                var oldE = oldEdgeMap[key];
                var newE = newEdgeMap[key];
                var fromNode = newSnap.nodes[newE.fromId] || { id: newE.fromId, label: '?' };
                var toNode = newSnap.nodes[newE.toId] || { id: newE.toId, label: '?' };

                // Check showLabel specifically
                if (oldE.showLabel !== newE.showLabel) {
                    changes.push(HistoryTracker.edgeLabelVisibilityChanged(fromNode, toNode, newE.showLabel));
                }

                // Check other edge properties
                var edgeProps = ['strength', 'attenuation', 'speedMultiplier'];
                for (var j = 0; j < edgeProps.length; j++) {
                    var prop = edgeProps[j];
                    if (oldE[prop] !== newE[prop]) {
                        changes.push(HistoryTracker.edgeChanged(fromNode, toNode, prop, oldE[prop], newE[prop]));
                    }
                }
            }
        }

        // Detect label changes
        // New labels
        for (var i = 0; i < newSnap.labels.length; i++) {
            var found = false;
            for (var j = 0; j < oldSnap.labels.length; j++) {
                if (oldSnap.labels[j].text === newSnap.labels[i].text) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                changes.push(HistoryTracker.labelCreated(newSnap.labels[i]));
            }
        }

        // Deleted labels
        for (var i = 0; i < oldSnap.labels.length; i++) {
            var found = false;
            for (var j = 0; j < newSnap.labels.length; j++) {
                if (newSnap.labels[j].text === oldSnap.labels[i].text) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                changes.push(HistoryTracker.labelDeleted(oldSnap.labels[i]));
            }
        }

        return changes;
    };

    ///////////////////////////
    // RECORDING //////////////
    ///////////////////////////

    self.record = function(actionDescription) {
        if (self.isUndoRedoing) return;
        if (self.loopy.mode == Loopy.MODE_PLAY) return;

        if (self.recordTimer) {
            clearTimeout(self.recordTimer);
            self.recordTimer = null;
        }

        var state = self.loopy.model.serialize();
        var newSnapshot = self.takeSnapshot();

        if (self.currentIndex >= 0 && self.states[self.currentIndex] === state) {
            return;
        }

        // Detect what changed
        var changes = self.detectChanges(self._lastSnapshot, newSnapshot);

        // Build action record
        var actionRecord;
        if (changes.length === 1) {
            actionRecord = changes[0];
        } else if (changes.length > 1) {
            var descriptions = changes.map(function(c) { return c.description; });
            actionRecord = {
                description: descriptions.join('; '),
                timestamp: HistoryTracker.formatTimestamp(),
                type: 'multiple',
                details: { changes: changes }
            };
        } else {
            actionRecord = HistoryTracker.genericAction(actionDescription || 'Model changed');
        }

        // Add new state
        self.states.push(state);
        self.actions.push(actionRecord);
        self.currentIndex = self.states.length - 1;

        // Update undo/redo positions - new action resets redo capability
        self.undoPosition = self.currentIndex;
        self.maxUndoPosition = self.currentIndex;

        // Update snapshot
        self._lastSnapshot = newSnapshot;

        // Limit size
        if (self.states.length > self.maxHistorySize) {
            self.states.shift();
            self.actions.shift();
            self.currentIndex--;
            self.undoPosition--;
            self.maxUndoPosition--;
            if (self.currentIndex < 0) self.currentIndex = 0;
            if (self.undoPosition < 0) self.undoPosition = 0;
            if (self.maxUndoPosition < 0) self.maxUndoPosition = 0;
        }

        self.updateUI();
        self.scheduleAutoSave();
    };

    self.recordDelayed = function(actionDescription) {
        if (self.isUndoRedoing) return;
        if (self.loopy.mode == Loopy.MODE_PLAY) return;

        if (self.recordTimer) clearTimeout(self.recordTimer);
        self.recordTimer = setTimeout(function() {
            self.record(actionDescription);
        }, 300);
    };

    ///////////////////////////
    // UNDO / REDO ////////////
    ///////////////////////////

    // Track the logical position for undo (which state we can go back to)
    self.undoPosition = -1;

    self.undo = function() {
        if (self.recordTimer) {
            clearTimeout(self.recordTimer);
            self.recordTimer = null;
        }
        if (!self.canUndo()) return;

        self.isUndoRedoing = true;

        // Get the action being undone (at current undo position)
        var actionUndone = self.actions[self.undoPosition];

        // Get the previous state to restore
        var previousState = self.states[self.undoPosition - 1];

        // Move undo position back
        self.undoPosition--;

        // Restore model to previous state
        self.loopy.model.deserialize(previousState);

        // Create undo action record as NEW entry in history log
        var undoRecord = HistoryTracker.undoAction(actionUndone);
        var newState = self.loopy.model.serialize();

        // Append as new history entry (log only, doesn't affect undo position)
        self.states.push(newState);
        self.actions.push(undoRecord);
        self.currentIndex = self.states.length - 1;

        self._lastSnapshot = self.takeSnapshot();
        self.isUndoRedoing = false;
        self.updateUI();
        publish("model/changed");
        self.scheduleAutoSave();
    };

    self.redo = function() {
        if (self.recordTimer) {
            clearTimeout(self.recordTimer);
            self.recordTimer = null;
        }
        if (!self.canRedo()) return;

        self.isUndoRedoing = true;

        // Move undo position forward first
        self.undoPosition++;

        // Get the state and action to restore
        var stateToRestore = self.states[self.undoPosition];
        var actionRedone = self.actions[self.undoPosition];

        // Restore model to that state
        self.loopy.model.deserialize(stateToRestore);

        // Create redo action record as NEW entry
        var redoRecord = HistoryTracker.redoAction(actionRedone);
        var newState = self.loopy.model.serialize();

        // Append as new history entry
        self.states.push(newState);
        self.actions.push(redoRecord);
        self.currentIndex = self.states.length - 1;

        self._lastSnapshot = self.takeSnapshot();
        self.isUndoRedoing = false;
        self.updateUI();
        publish("model/changed");
        self.scheduleAutoSave();
    };

    // maxUndoPosition tracks highest state we can redo to
    self.maxUndoPosition = -1;

    self.canRedo = function() {
        return self.undoPosition < self.maxUndoPosition;
    };

    self.canUndo = function() {
        return self.undoPosition > 0;
    };

    self.updateUI = function() {
        publish("history/updated", [self.canUndo(), self.canRedo()]);
    };

    self.clear = function() {
        self.states = [];
        self.actions = [];
        self.currentIndex = -1;
        self._lastSnapshot = null;
        self.undoPosition = -1;
        self.maxUndoPosition = -1;
        self.updateUI();
        if (self.enablePersistence) self.clearStorage();
    };

    self.getEmptyState = function() {
        var tempModel = new Model(self.loopy);
        return tempModel.serialize();
    };

    self.initialize = function() {
        if (self.enablePersistence && self.loadFromStorage()) {
            console.log("History loaded from storage");
            self._lastSnapshot = self.takeSnapshot();
            return;
        }

        var emptyState = self.getEmptyState();
        var currentState = self.loopy.model.serialize();

        if (currentState === emptyState) {
            self.states = [emptyState];
            self.actions = [HistoryTracker.genericAction('Empty canvas')];
            self.currentIndex = 0;
        } else {
            self.states = [emptyState, currentState];
            self.actions = [
                HistoryTracker.genericAction('Empty canvas'),
                HistoryTracker.genericAction('Initial load')
            ];
            self.currentIndex = 1;
        }

        // Initialize undo positions
        self.undoPosition = self.currentIndex;
        self.maxUndoPosition = self.currentIndex;

        self._lastSnapshot = self.takeSnapshot();
        self.updateUI();
    };

    ///////////////////////////
    // PERSISTENCE ////////////
    ///////////////////////////

    self.saveToStorage = function() {
        if (!self.enablePersistence) return false;
        try {
            var data = {
                states: self.states,
                currentIndex: self.currentIndex,
                actions: self.actions,
                undoPosition: self.undoPosition,
                maxUndoPosition: self.maxUndoPosition,
                timestamp: HistoryTracker.formatTimestamp(),
                version: "2.1"
            };
            var jsonString = JSON.stringify(data);

            if (jsonString.length > self.maxStorageSize) {
                var trimCount = Math.floor(self.states.length * 0.3);
                self.states = self.states.slice(trimCount);
                self.actions = self.actions.slice(trimCount);
                self.currentIndex = Math.max(0, self.currentIndex - trimCount);
                self.undoPosition = Math.max(0, self.undoPosition - trimCount);
                self.maxUndoPosition = Math.max(0, self.maxUndoPosition - trimCount);
                data.states = self.states;
                data.currentIndex = self.currentIndex;
                data.actions = self.actions;
                data.undoPosition = self.undoPosition;
                data.maxUndoPosition = self.maxUndoPosition;
                jsonString = JSON.stringify(data);
            }

            localStorage.setItem(self.storageKey, jsonString);
            return true;
        } catch (e) {
            console.error("Save failed:", e);
            return false;
        }
    };

    self.loadFromStorage = function() {
        if (!self.enablePersistence) return false;
        try {
            var jsonString = localStorage.getItem(self.storageKey);
            if (!jsonString) return false;

            var data = JSON.parse(jsonString);
            if (!data.states || !Array.isArray(data.states)) return false;

            self.states = data.states;
            self.currentIndex = data.currentIndex || 0;
            self.actions = data.actions || [];

            // Restore undo positions or set to currentIndex
            self.undoPosition = data.undoPosition !== undefined ? data.undoPosition : self.currentIndex;
            self.maxUndoPosition = data.maxUndoPosition !== undefined ? data.maxUndoPosition : self.currentIndex;

            if (self.currentIndex >= 0 && self.currentIndex < self.states.length) {
                self.loopy.model.deserialize(self.states[self.currentIndex]);
            }

            self.updateUI();
            return true;
        } catch (e) {
            console.error("Load failed:", e);
            return false;
        }
    };

    self.clearStorage = function() {
        try {
            localStorage.removeItem(self.storageKey);
        } catch (e) {}
    };

    self.scheduleAutoSave = function() {
        if (!self.enablePersistence) return;
        if (self.autoSaveTimer) clearTimeout(self.autoSaveTimer);
        self.autoSaveTimer = setTimeout(function() {
            self.saveToStorage();
        }, self.autoSaveInterval);
    };

    ///////////////////////////
    // EXPORT SESSION /////////
    ///////////////////////////

    self.exportSession = function() {
        return {
            states: self.states.length,
            currentIndex: self.currentIndex,
            canUndo: self.canUndo(),
            canRedo: self.canRedo(),
            actions: self.actions.slice(-10),
            memory: self.getMemoryEstimate()
        };
    };

    self.getMemoryEstimate = function() {
        var totalSize = 0;
        for (var i = 0; i < self.states.length; i++) {
            totalSize += self.states[i].length;
        }
        return {
            bytes: totalSize,
            kilobytes: (totalSize / 1024).toFixed(2),
            megabytes: (totalSize / 1024 / 1024).toFixed(3),
            percentage: ((totalSize / self.maxStorageSize) * 100).toFixed(1) + "%"
        };
    };

    self.exportToFile = function() {
        var data = {
            version: "2.0",
            exportedAt: HistoryTracker.formatTimestamp(),
            history: { states: self.states, currentIndex: self.currentIndex, actions: self.actions }
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'loopy_history_' + Date.now() + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    self.importFromFile = function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var data = JSON.parse(event.target.result);
                    if (!data.history || !data.history.states) throw new Error("Invalid format");
                    self.states = data.history.states;
                    self.currentIndex = data.history.currentIndex || 0;
                    self.actions = data.history.actions || [];
                    if (self.currentIndex >= 0 && self.currentIndex < self.states.length) {
                        self.loopy.model.deserialize(self.states[self.currentIndex]);
                    }
                    self._lastSnapshot = self.takeSnapshot();
                    self.updateUI();
                    if (self.enablePersistence) self.saveToStorage();
                    alert("Imported " + self.states.length + " states");
                } catch (error) {
                    alert("Import failed: " + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    ///////////////////////////
    // EVENT SUBSCRIPTIONS ////
    ///////////////////////////

    var hasInitialized = false;

    subscribe("model/changed", function() {
        if (!hasInitialized && !self.isUndoRedoing) {
            hasInitialized = true;
            setTimeout(function() { self.initialize(); }, 100);
            return;
        }
        if (self.isUndoRedoing) return;
        if (self.loopy.mode == Loopy.MODE_PLAY) return;
        self.recordDelayed("Model changed");
    });

    subscribe("mousedown", function() {
        if (self.loopy.mode != Loopy.MODE_EDIT) return;
        if (self.isUndoRedoing) return;
        if (self.loopy.tool == Loopy.TOOL_DRAG) {
            if (self.recordTimer) {
                clearTimeout(self.recordTimer);
                self.recordTimer = null;
            }
            self.record("Before drag");
        }
    });

    subscribe("model/reset", function() {
        self.clear();
        self.initialize();
    });

    window.addEventListener('beforeunload', function() {
        if (self.enablePersistence) self.saveToStorage();
    });

    if (!hasInitialized) {
        setTimeout(function() {
            try {
                self.initialize();
                hasInitialized = true;
            } catch (e) {
                console.error("History init failed:", e);
            }
        }, 100);
    }
}
