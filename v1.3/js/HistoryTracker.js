//Track and describe model changes

var HistoryTracker = (function() {

    // Format timestamp to human readable
    function formatTimestamp(date) {
        var d = date || new Date();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var month = months[d.getMonth()];
        var day = d.getDate();
        var year = d.getFullYear();
        var hours = d.getHours();
        var minutes = d.getMinutes();
        var seconds = d.getSeconds();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        return month + ' ' + day + ', ' + year + ' at ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    }

    // Format node with ID: "NodeName (#3)"
    function formatNode(node) {
        var id = node.id || '?';
        if (node.active === 2) {
            var top = node.topLabel || '?';
            var bottom = node.bottomLabel || '?';
            return '"' + top + '/' + bottom + '" (#' + id + ')';
        }
        var label = node.label || '?';
        return '"' + label + '" (#' + id + ')';
    }

    // Node property labels
    var NODE_PROPS = {
        label: 'name',
        hue: 'color',
        init: 'start amount',
        radius: 'radius',
        gain: 'gain',
        strength: 'quantum',
        active: 'type',
        x: 'position X',
        y: 'position Y',
        topLabel: 'top name',
        bottomLabel: 'bottom name'
    };

    // Edge property labels
    var EDGE_PROPS = {
        strength: 'relationship type',
        direction: 'direction',
        attenuation: 'attenuation',
        speedMultiplier: 'speed',
        arc: 'arc',
        showLabel: '+/- label visibility'
    };

    // Color names
    var COLOR_NAMES = {
        0: 'Red', 1: 'Orange', 2: 'Yellow', 3: 'Green',
        4: 'Cyan', 5: 'Purple', 6: 'Pink', 7: 'Gray',
        8: 'Beige', 9: 'Azure'
    };

    // Node type names
    var TYPE_NAMES = {
        0: 'Inactive', 1: 'Active', 2: 'Split'
    };

    // Format value for display
    function formatValue(prop, value) {
        if (prop === 'hue') return COLOR_NAMES[value] || value;
        if (prop === 'active') return TYPE_NAMES[value] || value;
        if (prop === 'init') return Math.round(value * 100) + '%';
        if (prop === 'showLabel') return value ? 'visible' : 'invisible';
        if (prop === 'topLabel' || prop === 'bottomLabel') {
            return value === '' || value === undefined ? '(empty)' : '"' + value + '"';
        }
        if (prop === 'strength' && typeof value === 'number') {
            if (value > 0) return 'Positive (+)';
            if (value < 0) return 'Negative (-)';
            return 'Neutral';
        }
        if (typeof value === 'number') return Math.round(value * 100) / 100;
        if (value === '' || value === '?') return '(empty)';
        return value;
    }

    // Public API
    return {
        formatTimestamp: formatTimestamp,

        // Describe node creation
        nodeCreated: function(node) {
            return {
                description: 'Created node ' + formatNode(node),
                timestamp: formatTimestamp(),
                type: 'node_create',
                details: { nodeId: node.id, label: node.label }
            };
        },

        // Describe node deletion
        nodeDeleted: function(node) {
            return {
                description: 'Deleted node ' + formatNode(node),
                timestamp: formatTimestamp(),
                type: 'node_delete',
                details: { nodeId: node.id, label: node.label }
            };
        },

        // Describe node property change
        nodeChanged: function(node, prop, oldVal, newVal) {
            var propLabel = NODE_PROPS[prop] || prop;
            return {
                description: 'Node ' + formatNode(node) + ' ' + propLabel + ': ' + formatValue(prop, oldVal) + ' → ' + formatValue(prop, newVal),
                timestamp: formatTimestamp(),
                type: 'node_change',
                details: { nodeId: node.id, property: prop, oldValue: oldVal, newValue: newVal }
            };
        },

        // Describe split node top label change
        topLabelChanged: function(node, oldVal, newVal) {
            return {
                description: 'Changed Top Name: ' + formatValue('topLabel', oldVal) + ' → ' + formatValue('topLabel', newVal) + ' (node #' + node.id + ')',
                timestamp: formatTimestamp(),
                type: 'node_top_label_change',
                details: { nodeId: node.id, oldValue: oldVal, newValue: newVal }
            };
        },

        // Describe split node bottom label change
        bottomLabelChanged: function(node, oldVal, newVal) {
            return {
                description: 'Changed Bottom Name: ' + formatValue('bottomLabel', oldVal) + ' → ' + formatValue('bottomLabel', newVal) + ' (node #' + node.id + ')',
                timestamp: formatTimestamp(),
                type: 'node_bottom_label_change',
                details: { nodeId: node.id, oldValue: oldVal, newValue: newVal }
            };
        },

        // Describe node move
        nodeMoved: function(node, oldX, oldY, newX, newY) {
            return {
                description: 'Moved node ' + formatNode(node),
                timestamp: formatTimestamp(),
                type: 'node_move',
                details: { nodeId: node.id, from: {x: oldX, y: oldY}, to: {x: newX, y: newY} }
            };
        },

        // Describe edge creation
        edgeCreated: function(fromNode, toNode, strength) {
            var type = strength > 0 ? 'positive' : (strength < 0 ? 'negative' : 'neutral');
            return {
                description: 'Created ' + type + ' edge: ' + formatNode(fromNode) + ' → ' + formatNode(toNode),
                timestamp: formatTimestamp(),
                type: 'edge_create',
                details: { fromId: fromNode.id, toId: toNode.id }
            };
        },

        // Describe edge deletion
        edgeDeleted: function(fromNode, toNode) {
            return {
                description: 'Deleted edge: ' + formatNode(fromNode) + ' → ' + formatNode(toNode),
                timestamp: formatTimestamp(),
                type: 'edge_delete',
                details: { fromId: fromNode.id, toId: toNode.id }
            };
        },

        // Describe edge property change
        edgeChanged: function(fromNode, toNode, prop, oldVal, newVal) {
            var propLabel = EDGE_PROPS[prop] || prop;
            return {
                description: 'Edge ' + formatNode(fromNode) + ' → ' + formatNode(toNode) + ' ' + propLabel + ': ' + formatValue(prop, oldVal) + ' → ' + formatValue(prop, newVal),
                timestamp: formatTimestamp(),
                type: 'edge_change',
                details: { fromId: fromNode.id, toId: toNode.id, property: prop, oldValue: oldVal, newValue: newVal }
            };
        },

        // Describe edge showLabel visibility change
        edgeLabelVisibilityChanged: function(fromNode, toNode, isVisible) {
            var visibility = isVisible ? 'visible' : 'invisible';
            return {
                description: 'Changed +/- label to ' + visibility + ': ' + formatNode(fromNode) + ' → ' + formatNode(toNode),
                timestamp: formatTimestamp(),
                type: 'edge_label_visibility',
                details: { fromId: fromNode.id, toId: toNode.id, visible: isVisible }
            };
        },

        // Describe label creation
        labelCreated: function(label) {
            var text = label.text ? label.text.substring(0, 20) : '...';
            if (label.text && label.text.length > 20) text += '...';
            return {
                description: 'Created label "' + text + '"',
                timestamp: formatTimestamp(),
                type: 'label_create',
                details: { text: label.text }
            };
        },

        // Describe label deletion
        labelDeleted: function(label) {
            var text = label.text ? label.text.substring(0, 20) : '...';
            return {
                description: 'Deleted label "' + text + '"',
                timestamp: formatTimestamp(),
                type: 'label_delete',
                details: { text: label.text }
            };
        },

        // Describe label change
        labelChanged: function(label, prop, oldVal, newVal) {
            var oldText = oldVal ? String(oldVal).substring(0, 15) : '(empty)';
            var newText = newVal ? String(newVal).substring(0, 15) : '(empty)';
            return {
                description: 'Label text: "' + oldText + '" → "' + newText + '"',
                timestamp: formatTimestamp(),
                type: 'label_change',
                details: { property: prop, oldValue: oldVal, newValue: newVal }
            };
        },

        // Describe label move
        labelMoved: function(label, oldX, oldY, newX, newY) {
            var text = label.text ? label.text.substring(0, 15) : '...';
            return {
                description: 'Moved label "' + text + '"',
                timestamp: formatTimestamp(),
                type: 'label_move',
                details: { from: {x: oldX, y: oldY}, to: {x: newX, y: newY} }
            };
        },

        // Describe multi-item move
        multiItemsMoved: function(count) {
            return {
                description: 'Moved ' + count + ' items',
                timestamp: formatTimestamp(),
                type: 'multi_move',
                details: { count: count }
            };
        },

        // Describe undo with what was undone
        undoAction: function(actionUndone) {
            var desc = '↩ UNDO';
            if (actionUndone && actionUndone.description) {
                desc = '↩ UNDO: ' + actionUndone.description;
            }
            return {
                description: desc,
                timestamp: formatTimestamp(),
                type: 'undo',
                details: { undoneAction: actionUndone }
            };
        },

        // Describe redo with what was redone
        redoAction: function(actionRedone) {
            var desc = '↪ REDO';
            if (actionRedone && actionRedone.description) {
                desc = '↪ REDO: ' + actionRedone.description;
            }
            return {
                description: desc,
                timestamp: formatTimestamp(),
                type: 'redo',
                details: { redoneAction: actionRedone }
            };
        },

        // Generic action
        genericAction: function(description) {
            return {
                description: description,
                timestamp: formatTimestamp(),
                type: 'generic',
                details: {}
            };
        }
    };
})();
