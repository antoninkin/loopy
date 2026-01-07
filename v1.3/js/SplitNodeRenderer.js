//Render split nodes with dual labels

var SplitNodeRenderer = (function() {

    /**
     * Check if node is a split node
     */
    function isSplitNode(node) {
        return node.active === 2;
    }

    /**
     * Get top label (uses main label or dedicated topLabel)
     */
    function getTopLabel(node) {
        return node.topLabel !== undefined ? node.topLabel : node.label;
    }

    /**
     * Get bottom label (uses dedicated bottomLabel or fallback)
     */
    function getBottomLabel(node) {
        return node.bottomLabel !== undefined ? node.bottomLabel : "?";
    }

    /**
     * Set labels for split node
     */
    function setLabels(node, topLabel, bottomLabel) {
        node.topLabel = topLabel;
        node.bottomLabel = bottomLabel;
        // Keep main label synced for compatibility
        node.label = topLabel;
    }

    /**
     * Word wrap helper - same logic as Node.js but extracted
     */
    function wrapText(ctx, text, maxWidth) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';

        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var testLine = currentLine + (currentLine ? ' ' : '') + word;
            var testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        // Break long words
        if (lines.length === 1 && ctx.measureText(lines[0]).width > maxWidth) {
            var longWord = lines[0];
            lines = [];
            var currentChunk = '';

            for (var j = 0; j < longWord.length; j++) {
                var testChunk = currentChunk + longWord[j];
                if (ctx.measureText(testChunk).width > maxWidth && currentChunk) {
                    lines.push(currentChunk);
                    currentChunk = longWord[j];
                } else {
                    currentChunk = testChunk;
                }
            }
            if (currentChunk) lines.push(currentChunk);
        }

        return lines;
    }

    /**
     * Draw text in a half-circle region
     * @param ctx - canvas context
     * @param text - text to draw
     * @param r - node radius (retina)
     * @param isTop - true for top half, false for bottom
     */
    function drawHalfLabel(ctx, text, r, isTop) {
        var fontsize = 28; // Smaller for split
        var maxWidth = r * 1.4; // Narrower for half
        var halfHeight = r * 0.8; // Available height in half

        ctx.font = "normal " + fontsize + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";

        var lines = wrapText(ctx, text, maxWidth);
        var lineHeight = fontsize * 1.1;
        var totalHeight = lines.length * lineHeight;

        // Reduce font if needed
        while (totalHeight > halfHeight && fontsize > 14) {
            fontsize -= 2;
            ctx.font = "normal " + fontsize + "px sans-serif";
            lineHeight = fontsize * 1.1;
            lines = wrapText(ctx, text, maxWidth);
            totalHeight = lines.length * lineHeight;
        }

        // Calculate Y offset - center in top or bottom half
        var centerY = isTop ? -r * 0.45 : r * 0.45;
        var startY = centerY - (lines.length - 1) * lineHeight / 2;

        // Draw lines
        for (var i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 0, startY + i * lineHeight);
        }
    }

    /**
     * Main render function for split node
     * Call this INSTEAD of normal label rendering when active===2
     */
    function renderLabels(ctx, node, r) {
        if (!isSplitNode(node)) return false;

        var topText = getTopLabel(node);
        var bottomText = getBottomLabel(node);

        // Draw top label
        drawHalfLabel(ctx, topText, r, true);

        // Draw bottom label
        drawHalfLabel(ctx, bottomText, r, false);

        return true; // Indicates split rendering was done
    }

    /**
     * Draw the dividing line
     */
    function renderDivider(ctx, r, color) {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Public API
    return {
        isSplitNode: isSplitNode,
        getTopLabel: getTopLabel,
        getBottomLabel: getBottomLabel,
        setLabels: setLabels,
        renderLabels: renderLabels,
        renderDivider: renderDivider
    };

})();
