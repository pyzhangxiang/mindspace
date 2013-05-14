
/* only do all this when document has finished loading (needed for RaphaelJS) */
window.onload = function() {
    var canvas_ = $("#canvas")

    var width = canvas_.width();
    var height = canvas_.height();

    var renderer = new Graph.Renderer.Raphael('canvas', width, height, "#stat", "#toolbar", "#tta_label");
    var g = new Graph({edgeStroke:"#aaa", edgeFill:"#2e2d29"
                    , fontSize:"16px", fontColor:"#fff"
                    , highlightStroke:"#f0e", fillOpacity:0.6});


    //renderer.r.rect(0, 0, width, height, 10).attr({stroke: "#666"});
    redraw = function() {
        //layouter.layout();
        renderer.drawGraph(g);
    };
    
    newfile = function()
    {
        
    };

    openfile = function()
    {
        //var evt = document.createEvent("MouseEvents");
        ///evt.initEvent("click", true, false);
        //ofile.dispatchEvent(evt);
        //console.log("aa");
        $("#ofile").trigger('click');
        //document.getElementById("file").click();
    };

    openfileImpl = function()
    {
        console.log($("#ofile").val());
    };

    savefile = function()
    {

    };

    
    addTxtNode = function()
    {
        var pt = renderer.ptScreenToWorld(renderer.canvasPos.left + renderer.width * 0.5,
                                          renderer.canvasPos.top + renderer.height * 0.5);
        var node = g.addNode({x:pt[0], y:pt[1]});
        node.render();
        g.setSelected(node);
    };
    addImgNode = function()
    {
        var pt = renderer.ptScreenToWorld(renderer.canvasPos.left + renderer.width * 0.5,
                                          renderer.canvasPos.top + renderer.height * 0.5);
        var node = g.addNode({x:pt[0], y:pt[1],
            renderFunc:Graph.Renderer.imgNodeRenderFunc,
            fill:"none"
        });  
        node.render();
        g.setSelected(node);
    };

    undo = function()
    {
        
    };
    redo = function()
    {
        
    };

    toBack = function()
    {
        if(g.selected && g.selected.shape)
        {
            g.selected.shape.toBack();
        }
           
    };
    toFront = function()
    {
        if(g.selected && g.selected.shape)
        {
            g.selected.shape.toFront();
        }
    };

    getGraph = function()
    {
        $("#tta_graph").val(g.toJson());
    };
    setGraph = function()
    {
        g.fromJson($("#tta_graph").val());
        redraw();
    };

    setNodeLabel = function(label)
    {
        if(!(g.selected))
            return ;
        g.selected.setLabel(label); 
    };

    deleteSelected = function()
    {
        g.deleteSelected();
    };

    toAddConnection = function()
    {
        g.toAddConnection();
    };

    toAddTextNode = function()
    {
        g.toAddTextNode();
    };

    toAddImageNode = function()
    {
        g.toAddImageNode();
    };
    
    redraw();
};

