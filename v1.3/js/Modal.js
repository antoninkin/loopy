/***********************

Use the same PAGE UI thing

************************/

function Modal(loopy){

	var self = this;
	self.loopy = loopy;
	PageUI.call(self, document.getElementById("modal_page"));

	// Is showing?
	self.isShowing = false;

	// show/hide
	self.show = function(){
		document.getElementById("modal_container").setAttribute("show","yes");
		self.isShowing = true;
	};
	self.hide = function(){
		document.getElementById("modal_container").setAttribute("show","no");
		if(self.currentPage.onhide) self.currentPage.onhide();
		self.isShowing = false;
	};

	// Close button
	document.getElementById("modal_bg").onclick = self.hide;
	document.getElementById("modal_close").onclick = self.hide;

	// Show... what page?
	subscribe("modal", function(pageName){

		self.show();
		var page = self.showPage(pageName);

		// Do something
		if(page.onshow) page.onshow();

		// Dimensions
		var dom = document.getElementById("modal");
		dom.style.width = self.currentPage.width+"px";
		dom.style.height = self.currentPage.height+"px";

	});

	///////////////////
	// PAGES! /////////
	///////////////////

	// Examples
	(function(){
		var page = new Page();
		page.width = 670;
		page.height = 570;
		var iframe = page.addComponent(new ModalIframe({
			page: page,
			src: "pages/examples/index.html",
			width: 640,
			height: 520
		}));
		iframe.dom.style.background = "#f7f7f7";
		self.addPage("examples", page);
	})();

	// How To
	(function(){
		var page = new Page();
		page.width = 530;
		page.height = 430;
		page.addComponent(new ModalIframe({
			page: page,
			src: "pages/howto.html",
			width: 500,
			height: 350
		}));

		var label = document.createElement("div");
		label.style.fontSize = "18px";
		label.style.marginTop = "6px";
		label.style.color = "#777";
		label.innerHTML = "need ideas for simulations? check out <span style='text-decoration:underline; cursor:pointer' onclick='publish(\"modal\",[\"examples\"])'>the examples!</span>";
		page.dom.appendChild(label);

		self.addPage("howto", page);

	})();

	// Credits
	(function(){
		var page = new Page();
		page.width = 690;
		page.height = 550;
		page.addComponent(new ModalIframe({
			page: page,
			src: "pages/credits/",
			width: 660,
			height: 500
		}))
		self.addPage("credits", page);
	})();

	// Save as link
	(function(){
		var page = new Page();
		page.width = 500;
		page.height = 155;
		page.addComponent(new ComponentHTML({
			html: "copy your link:"
		}));
		var output = page.addComponent(new ComponentOutput({}));

		var label = document.createElement("div");
		label.style.textAlign = "right";
		label.style.fontSize = "15px";
		label.style.marginTop = "6px";
		label.style.color = "#888";
		label.innerHTML = "(this is a long URL, so you may want to use a link-shortener like <a target='_blank' href='https://bitly.com/'>bit.ly</a>)";
		page.dom.appendChild(label);

		// chars left...
		var chars = document.createElement("div");
		chars.style.textAlign = "right";
		chars.style.fontSize = "15px";
		chars.style.marginTop = "3px";
		chars.style.color = "#888";
		chars.innerHTML = "X out of 2048 characters";
		page.dom.appendChild(chars);

		page.onshow = function(){

			// Copy-able link
			var link = loopy.saveToURL();
			output.output(link);
			output.dom.select();

			// Chars left
			var html = link.length+" / 2048 characters";
			if(link.length>2048){
				html += " - MAY BE TOO LONG FOR MOST BROWSERS";
			}
			chars.innerHTML = html;
			chars.style.fontWeight = (link.length>2048) ? "bold" : "100";
			chars.style.fontSize = (link.length>2048) ? "14px" : "15px";

		};

		// or, tweet it
		self.addPage("save_link", page);
	})();

	// Export as DOT
	(function(){
		var page = new Page();
		page.width = 600;
		page.height = 450;

		// Store checkbox state at page level
		var includePositions = false;
		var checkboxInput = null;

		// Header
		page.addComponent(new ComponentHTML({
			html: "<b>Export as DOT Language</b><br>"
		}));

		// Include positions checkbox
		var checkboxHTML = document.createElement("div");
		checkboxHTML.innerHTML = '<label style="font-size:0.8em; cursor:pointer;">' +
			'<input type="checkbox" style="margin-right:6px;">' +
			'Include node positions (for neato/fdp layout engines)' +
			'</label><br><br>';
		page.dom.appendChild(checkboxHTML);

		// Get checkbox reference after adding to DOM
		checkboxInput = checkboxHTML.querySelector('input[type="checkbox"]');

		// Output textarea
		var output = document.createElement("textarea");
		output.style.width = "560px";
		output.style.height = "180px";
		output.style.fontSize = "12px";
		output.style.fontFamily = "monospace";
		output.style.border = "1px solid #545454ff";
		output.style.padding = "10px";
		output.onclick = function(){
			output.select();
		};
		page.dom.appendChild(output);

		// Button container
		var buttonContainer = document.createElement("div");
		buttonContainer.style.marginTop = "5px";
		page.dom.appendChild(buttonContainer);

		// Copy button
		var copyButton = document.createElement("div");
		copyButton.className = "component_button";
		copyButton.innerHTML = "Copy to Clipboard";
		copyButton.style.width = "200px";
		copyButton.style.display = "inline-block";
		copyButton.onclick = function(){
			var textToCopy = output.value;

			if(!textToCopy || textToCopy.length === 0) {
				copyButton.innerHTML = "Nothing to copy!";
				copyButton.style.background = "#f44336";
				setTimeout(function(){
					copyButton.innerHTML = "Copy to Clipboard";
					copyButton.style.background = "";
				}, 2000);
				return;
			}

			output.select();
			output.setSelectionRange(0, 999999);

			try {
				document.execCommand('copy');
				copyButton.innerHTML = "Copied!";
				copyButton.style.background = "#4CAF50";
			} catch (err) {
				copyButton.innerHTML = "Press Ctrl+C to copy";
				copyButton.style.background = "#ff9800";
			}

			setTimeout(function(){
				copyButton.innerHTML = "Copy to Clipboard";
				copyButton.style.background = "";
			}, 2000);
		};
		buttonContainer.appendChild(copyButton);

		// Download button
		var downloadButton = document.createElement("div");
		downloadButton.className = "component_button";
		downloadButton.innerHTML = "Download .dot file";
		downloadButton.style.marginLeft = "10px";
		downloadButton.style.width = "200px";
		downloadButton.style.display = "inline-block";
		downloadButton.onclick = function(){
			var dotContent = output.value;

			if(!dotContent || dotContent.length === 0) {
				downloadButton.innerHTML = "Nothing to download!";
				downloadButton.style.background = "#f44336";
				setTimeout(function(){
					downloadButton.innerHTML = "Download .dot file";
					downloadButton.style.background = "";
				}, 2000);
				return;
			}

			var blob = new Blob([dotContent], { type: 'text/plain' });
			var url = window.URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			a.download = 'model.dot';
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			downloadButton.innerHTML = "Downloaded!";
			downloadButton.style.background = "#4CAF50";
			setTimeout(function(){
				downloadButton.innerHTML = "Download .dot file";
				downloadButton.style.background = "";
			}, 2000);
		};
		buttonContainer.appendChild(downloadButton);

		// Info text
		var info = document.createElement("div");
		info.style.fontSize = "0.5em";
		info.style.color = "#666";
		info.style.marginTop = "5px";
		info.innerHTML = "Paste this code into any Graphviz-compatible tool to visualize your model.<br>" +
						"Try it at <a href='https://dreampuf.github.io/GraphvizOnline/' target='_blank'>GraphvizOnline</a> " +
						"or <a href='http://www.webgraphviz.com/' target='_blank'>WebGraphviz</a>";
		page.dom.appendChild(info);

		// Function to generate DOT
		var generateDOT = function() {
			try {
				if(window.loopy && loopy.model && typeof loopy.model.exportToDOT === 'function') {
					var dotCode = loopy.model.exportToDOT(includePositions);
					output.value = dotCode;
				} else {
					output.value = "// Error: Export function not available\n// Please refresh the page and try again";
				}
			} catch(e) {
				output.value = "// Error generating DOT: " + e.message;
				console.error("DOT export error:", e);
			}
		};

		// Update DOT when checkbox changes
		if(checkboxInput) {
			checkboxInput.onchange = function(e){
				includePositions = e.target.checked;
				generateDOT();
			};
		}

		page.onshow = function(){
			// Reset checkbox
			includePositions = false;
			if(checkboxInput) {
				checkboxInput.checked = false;
			}

			// Generate DOT
			generateDOT();

			// Select text
			setTimeout(function() {
				output.select();
			}, 10);
		};

		self.addPage("export_dot", page);
	})();

	// Embed
	(function(){
		var page = new Page();
		page.width = 700;
		page.height = 500;

		// ON UPDATE DIMENSIONS
		var iframeSRC;
		var _onUpdate = function(){
			var embedCode = '<iframe width="'+width.getValue()+'" height="'+height.getValue()+'" frameborder="0" src="'+iframeSRC+'"></iframe>';
			output.output(embedCode);
		};

		// THE SHTUFF
		var sidebar = document.createElement("div");
		sidebar.style.width = "150px";
		sidebar.style.height = "440px";
		sidebar.style.float = "left";
		page.dom.appendChild(sidebar);

		// Label
		var label = document.createElement("div");
		label.innerHTML = "<br>PREVIEW &rarr;<br><br>";
		sidebar.appendChild(label);

		// Label 2
		var label = document.createElement("div");
		label.style.fontSize = "15px";
		label.innerHTML = "what size do you want your embed to be?";
		sidebar.appendChild(label);

		// Size!
		var width = _createNumberInput(_onUpdate);
		sidebar.appendChild(width.dom);
		var label = document.createElement("div");
		label.style.display = "inline-block";
		label.style.fontSize = "15px";
		label.innerHTML = "&nbsp;×&nbsp;";
		sidebar.appendChild(label);
		var height = _createNumberInput(_onUpdate);
		sidebar.appendChild(height.dom);

		// Label 3
		var label = document.createElement("div");
		label.style.fontSize = "15px";
		label.innerHTML = "<br><br>copy this code into your website's html:";
		sidebar.appendChild(label);

		// Output!
		var output = new ComponentOutput({});
		output.dom.style.fontSize = "12px";
		sidebar.appendChild(output.dom);

		// Label 3
		var label = document.createElement("div");
		label.style.fontSize = "15px";
		label.style.textAlign = "right";
		label.innerHTML = "<br><br>(note: the REMIX button lets someone else, well, remix your model! don't worry, it'll just be a copy, it won't affect the original.)";
		sidebar.appendChild(label);

		// IFRAME
		var iframe = page.addComponent(new ModalIframe({
			page: page,
			manual: true,
			src: "",
			width: 500,
			height: 440
		})).dom;
		iframe.style.float = "right";
		page.onshow = function(){

			// Default dimensions
			width.setValue(500);
			height.setValue(440);

			// The iframe!
			iframeSRC = loopy.saveToURL(true);
			iframe.src = iframeSRC;

			// Select to copy-paste
			_onUpdate();
			output.dom.select();

		};
		page.onhide = function(){
			iframe.removeAttribute("src");
		};
		self.addPage("embed", page);


	})();

	// GIF
	(function(){
		var page = new Page();
		page.width = 530;
		page.height = 400;
		page.addComponent(new ModalIframe({
			page: page,
			src: "pages/gif.html",
			width: 500,
			height: 350
		}))
		self.addPage("save_gif", page);
	})();

}

function ModalIframe(config){

	var self = this;

	// IFRAME
	var iframe = document.createElement("iframe");
	self.dom = iframe;
	iframe.width = config.width;
	iframe.height = config.height;

	// Show & Hide
	if(!config.manual){
		config.page.onshow = function(){
			iframe.src = config.src;
		};
		config.page.onhide = function(){
			iframe.removeAttribute("src");
		};
	}

}
