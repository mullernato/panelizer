Zepto(function($) {

	// builds an array of parts
	var addToPartArray = function() {
		for (var i = 0; i < $partArray.size(); i++) {
			for (var t = 0; t < $partArray[i].qty; t++) {
				partArray.push({w:fitDisplay($partArray[i].w), h:fitDisplay($partArray[i].h)});
			}
		}
	}

	var drawRect = function(canvas, x, y, width, height){
		if (canvas.getContext) {
			var ctx = canvas.getContext("2d");
			ctx.strokeRect(x, y, width, height);
		}
	}

	// scales provided item to fit a page
	var fitDisplay = function(item) {
		return item *= fitFactor;
	}

	var displayPanels = function(panelArray) {
		for (var i = 0; i < panelArray.length; i++) {

			// create a new canvas object
			// draw the panel extents
			// draw the parts inside the canvas
			var canvasId = "canvas" + i;
			var createCanvas =  "<canvas id='" + canvasId + "' width ='" + fitDisplay(panelWidth) + "' height ='" + fitDisplay(panelHeight) + "'></canvas>";
			$panelDiv.append(createCanvas);
			canvas = document.getElementById(canvasId);
			drawRect(canvas, 0, 0, fitDisplay(panelWidth), fitDisplay(panelHeight));

			var panelQuantity = panels[i][panels[i].length-1];

			// create a rectangle for each of the parts in this panel
			for (var t = 0; t < panelArray[i].length; t++) {
				block = panelArray[i][t];
				drawRect(canvas, block.fitX, block.fitY, block.w, block.h);
			};

			$(canvas).data("panelQty", panelQuantity);
		};

		$("canvas").hide();
		$("canvas").eq(pagerIndex).show();
	}

	// recursively processes the provided array of parts
	// fits parts into panel dimensions
	var optimize = function(partArray) {

		var removeBlockArray = [];
		var blockArray = [];

		// sort parts by comparing height - smallest
		// sort parts by comparing  width to height - largest
		partArray.sort(function(a,b) { return (b.h < a.h);});
		partArray.sort(function(a,a) { return (a.w > a.h);});

		// create a bin packing panel
		// fit the parts in the array into the panel
		var packer = new Packer(fitDisplay(panelWidth), fitDisplay(panelHeight));
		packer.fit(partArray);

		// decide if the part fits the panel
		// add to appropriate array
		for(var i = 0; i < partArray.length; i++) {
			var block = partArray[i];
			if(block.fit) {
				removeBlockArray.push(i);
				blockArray.push({fitX:block.fit.x, fitY:block.fit.y, w:block.w, h:block.h});
			};

		};

		// add this panel of parts to the array of panels
		panels.push(blockArray);

		// remove the fitted parts from the pool of parts to be fit
		for (var i = removeBlockArray.length - 1; i >= 0; i--) {
			partArray.splice(removeBlockArray[i], 1);
		};

		// if parts are still to be fit
		// call this optimize function again
		if(partArray.length > 0) {
			optimize(partArray);
		}
	}

	// find duplicate panels
	var compareBlocks = function (array1, array2) {

		if(array1.length != array2.length)
			return false;

		for(var i = array1.length - 1; i >= 0; i--) {
			if(array1[i].h != array2[i].h) return false;
			if(array1[i].w != array2[i].w) return false;
			if(array1[i].fitW != array2[i].fitW) return false;
			if(array1[i].fitY != array2[i].fitY) return false;
		}
		return true;
	}

	var deduplicatePanels = function(panels) {

		for (var i = 0; i < panels.length-1; i++) {
			var panelQuantity = 1;
			for (var t = i + 1; t < panels.length; t++) {
				if (compareBlocks(panels[i], panels[t])) {
					panelQuantity = panelQuantity + 1;
					panels[i][panels[i].length-1] = panelQuantity;
				}
			}
			panels.splice(i + 1, panelQuantity -1);
		}
	}

	var fitFactor = 5;
	var panelHeight = 96;
	var panelWidth = 48;
	var widthOffset = 250;
	var parts1 = [];
	var parts2 = [];
	var panels = [];
	var partArray = [];

	var $controls = $("#controls");
	var $optimizeButton = $("#optimize");
	var $infoDisplay = $("#infoDisplay");
	var $panelHeight = $("#panelHeight");
	var $panelWidth = $("#panelWidth");
	var $material = $("#material");
	var $thickness = $("#thickness");
	var $panelInputs = $([$panelHeight, $panelWidth, $material, $thickness]);
	var $partHeight = $("#partHeight");
	var $partWidth = $("#partWidth");
	var $quantity = $("#quantity");
	var $partName = $("#partName");
	var $listPanel = $(".listPanel ul");
	var $listItems = $(".listItem");
	var $addPanel = $("#addPanel");
	var $addPart = $("#addPart");
	var $partArray = $([]);
	var $panelDiv = $("#panelDiv");
	var $pagerLeft = $("#pagerLeft");
	var $pagerCenter = $("#pagerCenter");
	var $pagerRight = $("#pagerRight");
	var pagerIndex = 0;

	$addPanel.on('click', function(){

		panelHeight = $panelHeight.val();
		panelWidth = $panelWidth.val();
		$addPanel.html("Added").css('color', '#000');

	});

	$addPart.on("click", function(){
		$partArray.push({w:Number($partWidth.val()), h:Number($partHeight.val()), qty:Number($quantity.val())});
		$partArray.each(function(i){
			console.log(this.w, this.h, this.qty);
		})
		$listPanel.append("<li class ='listItem'>" + $partWidth.val()
			+ " | " + $partHeight.val()
			+ " | " + $quantity.val()
			+ " | " + $partName.val() + "</li>");
		$listItems = $(".listItem");
		console.log($listItems);
	})

	$pagerLeft.on("click", function(){
		$canvases = $("canvas");
		if (pagerIndex > 0) {
			pagerIndex--;
			$canvases.hide();
			$canvases.eq(pagerIndex).show();
			$pagerCenter.html(pagerIndex + 1);
		}
	})

	$pagerRight.on("click", function(){
		$canvases = $("canvas");
		if (pagerIndex < panels.length-1) {
			pagerIndex++;
			$canvases.hide();
			$canvases.eq(pagerIndex).show();
			$pagerCenter.html(pagerIndex + 1);
		}
	})

	$("#partList").on("click", ".listItem", function(){
		console.log(this);
		this.remove();
	})

	$optimizeButton.on('click', function(){

		addToPartArray();

		optimize(partArray);

		for (var i = 0; i < panels.length; i++) {
				panels[i].push(1);
		}

		deduplicatePanels(panels);
		displayPanels(panels);
		$pagerCenter.html(1);
	});

})
