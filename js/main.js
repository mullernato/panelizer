$(document).foundation();


// TODO break out into separate files
// TODO create separate size entry and panel views
// TODO show detailed panel information in panel view
// TODO add kerf field to panel form
// TODO add kerf value to width and height of each part
// TODO remove parts from $addedParts when removed from part table
// TODO ensure part is smaller than sheet before adding to list
// TODO provide messaging for validation, button presses etc.
// TODO setup gulp?

Zepto(function ($) {
    
  var fitFactor = 5;
  var panelHeight = 0;
  var panelWidth = 0;
  var material = "";
  var thickness = 0;
  var widthOffset = 250;
  var panels = [];
  var partArray = [];

  var $controls = $("#controls");
  var $optimizeButton = $("#optimize");
  var $infoDisplay = $("#infoDisplay");
  var $panelHeight = $("#panelHeight");
  var $panelWidth = $("#panelWidth");
  var $material = $("#material");
  var $thickness = $("#thickness");
  var $panelInputs = $(".panelInput");
  var $partHeight = $("#partHeight");
  var $partWidth = $("#partWidth");
  var $quantity = $("#quantity");
  var $partName = $("#partName");
  var $partInputs = $(".partInput");
  var $table = $("table");
  var $clearPartList = $("#clearPartList");
  var $listItems = $(".listItem");
  var $removePart = $(".removePart");
  var $addPanel = $("#addPanel");
  var $clearPanel = $("#clearPanel")
  var $addPart = $("#addPart");
  var $clearPart = $("#clearPart")
  var $addedParts = $([]);
  var $panelDiv = $("#panelDiv");
  var $pagerLeft = $("#pagerLeft");
  var $pagerCenter = $("#pagerCenter");
  var $pagerRight = $("#pagerRight");
  var pagerIndex = 0;

  // builds an array of parts
  var addToPartArray = function () {
    for (var i = 0; i < $addedParts.size(); i++) {
      for (var t = 0; t < $addedParts[i].qty; t++) {
        partArray.push({
          w: fitDisplay($addedParts[i].w),
          h: fitDisplay($addedParts[i].h)
        });
      }
    }

    // sort parts by comparing height - smallest
    // sort parts by comparing  width to height - largest
    partArray.sort(function (a, b) {
      return (b.h < a.h);
    });
    partArray.sort(function (a, a) {
      return (a.w > a.h);
    });
  };

  var drawRect = function (canvas, x, y, width, height) {
    if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      ctx.strokeRect(x, y, width, height);
    }
  };

  // scales provided item to fit a page
  var fitDisplay = function (item) {
    return item *= fitFactor;
  };

  var displayPanels = function (panelArray) {
    for (var i = 0; i < panelArray.length; i++) {

      // create a new canvas object
      // draw the panel extents
      // draw the parts inside the canvas
      var canvasId = "canvas" + i;
      var createCanvas = "<canvas id='" + canvasId + "' width ='" + fitDisplay(panelWidth) + "' height ='" + fitDisplay(panelHeight) + "'></canvas>";
      $panelDiv.append(createCanvas);
      canvas = document.getElementById(canvasId);
      drawRect(canvas, 0, 0, fitDisplay(panelWidth), fitDisplay(panelHeight));

      var panelQuantity = panels[i][panels[i].length - 1];

      // create a rectangle for each of the parts in this panel
      for (var t = 0; t < panelArray[i].length; t++) {
        block = panelArray[i][t];
        drawRect(canvas, block.fitX, block.fitY, block.w, block.h);
      }

      $(canvas).data("panelQty", panelQuantity);
    }

    $("canvas").hide();
    $("canvas").eq(pagerIndex).show();
  };

  // recursively processes the provided array of parts
  // fits parts into panel dimensions
  var optimize = function (partArray) {

    var removeBlockArray = [];
    var blockArray = [];

    // create a bin packing panel
    // fit the parts in the array into the panel
    var packer = new Packer(fitDisplay(panelWidth), fitDisplay(panelHeight));
    packer.fit(partArray);

    // decide if the part fits the panel
    // add to appropriate array
    for (var i = 0; i < partArray.length; i++) {
      var block = partArray[i];
      if (block.fit) {
        removeBlockArray.push(i);
        blockArray.push({
          fitX: block.fit.x,
          fitY: block.fit.y,
          w: block.w,
          h: block.h
        });
      }
    }

    // add this panel of parts to the array of panels
    panels.push(blockArray);

    // remove the fitted parts from the pool of parts to be fit
    for (var i = removeBlockArray.length - 1; i >= 0; i--) {
      partArray.splice(removeBlockArray[i], 1);
    }

    // if parts are still to be fit
    // call this optimize function again
    if (partArray.length > 0) {
      optimize(partArray);
    }
  }

  // find duplicate panels
  var compareBlocks = function (array1, array2) {

    if (array1.length != array2.length)
      return false;

    for (var i = array1.length - 1; i >= 0; i--) {
      if (array1[i].h != array2[i].h) return false;
      if (array1[i].w != array2[i].w) return false;
      if (array1[i].fitW != array2[i].fitW) return false;
      if (array1[i].fitY != array2[i].fitY) return false;
    }
    return true;
  }

  var deduplicatePanels = function (panels) {

    for (var i = 0; i < panels.length - 1; i++) {
      var panelQuantity = 1;
      for (var t = i + 1; t < panels.length; t++) {
        if (compareBlocks(panels[i], panels[t])) {
          panelQuantity = panelQuantity + 1;
          panels[i][panels[i].length - 1] = panelQuantity;
        }
      }
      panels.splice(i + 1, panelQuantity - 1);
    }
  }

  $addPanel.on('click', function () {
    if ($panelHeight.val() !== "" && $panelWidth.val() !== "" &&$material.val() !== "" && $thickness.val() !== "") {
      panelHeight = $panelHeight.val();
      panelWidth = $panelWidth.val();
      material = $material.val();
      thickness = $thickness.val();
      $addPanel.html("Added");
    }
  });
  
  $addPart.on("click", function () {
    if ($partWidth.val() !== "" && $partHeight.val() !== "" && $quantity.val() !== "" && $partName.val() !== "") {
      $addedParts.push({
        w: Number($partWidth.val()),
        h: Number($partHeight.val()),
        qty: Number($quantity.val())
      });
      
      $table.append('<tr class="part"><td>' + $partWidth.val() + "</td><td>" + $partHeight.val() + "</td><td>" + $quantity.val() + "</td><td>" + $partName.val() + "</td><td>" + "<button class='button tiny removePart'>X</button>" + "</td></tr>");
      
      //update the list of parts
      $listItems = $(".listItem");
    }
  });

  $pagerLeft.on("click", function () {
    $canvases = $("canvas");
    if (pagerIndex > 0) {
      pagerIndex--;
      $canvases.hide();
      $canvases.eq(pagerIndex).show();
      $pagerCenter.html(pagerIndex + 1);
    }
  });

  $pagerRight.on("click", function () {
    $canvases = $("canvas");
    if (pagerIndex < panels.length - 1) {
      pagerIndex++;
      $canvases.hide();
      $canvases.eq(pagerIndex).show();
      $pagerCenter.html(pagerIndex + 1);
    }
  });

  $table.on("click", "tr", function () {
    this.remove();
  });

  $clearPanel.on("click", function () {
    $panelInputs.val("");
  });

  $clearPart.on("click", function () {
    $partInputs.val("");
    $addPanel.html("Add");
  });

  $clearPartList.on("click", function () {
    var $parts = $(".part");
    $parts.remove();
    $addedParts = [];
  })

  $optimizeButton.on('click', function () {
    if($addedParts.length > 0){
      partArray = [];
      addToPartArray();

      optimize(partArray);

      for (var i = 0; i < panels.length; i++) {
        panels[i].push(1);
      }

      deduplicatePanels(panels);
      displayPanels(panels);
      $pagerCenter.html(1);
    };
    
  });

});