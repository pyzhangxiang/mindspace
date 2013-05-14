var _invalidId = -9999;
var _whitespace = "　";
var _nodespadding = 10;
var _halfnodespadding = _nodespadding * 0.5;


var Graph = new Class(
    {
        initialize: function(attr)
        {
            this.nodecount = 0;

            this.nodes = {};
            this.edgesInherit = {};
			this.edgesConnect = {};
            this.selected = null;
            this.fatherCandidate = null;
            this.connTargetCandidate = null;
            this.fakeSelected = null;

            this.setGraphProperties(attr);
        },

        setGraphProperties: function(attr)
        {
            attr = attr || {};
            this.edgeFill = attr.edgeFill || "none";
            this.edgeStroke = attr.edgeStroke || "#000";
            this.fontSize = attr.fontSize || "12px";
            this.fontColor = attr.fontColor || "#000";
            this.highlightStroke = attr.highlightStroke || "#000";
            this.fillOpacity = attr.fillOpacity || 0.6;
        },

        toJson: function()
        {
            var obj = {
                nodecount: this.nodecount,
                edgeFill: this.edgeFill,
                edgeStroke: this.edgeStroke,
                fontSize: this.fontSize,
                fontColor: this.fontColor,
                highlightStroke: this.highlightStroke,
                fillOpacity: this.fillOpacity,
                viewport:{
                    x:gRenderer.viewBox[0],
                    y:gRenderer.viewBox[1],
                    scale:gRenderer.scale
                }
            };

            {
                var nodes = []
                for(var i in this.nodes)
                {
                    var node = this.nodes[i];
                    var n = {
                        id: node.id,
                        father: node.father ? node.father.id : _invalidId,
                        type: "txtnode",
                        x: node.x,
                        y: node.y,
                        label: node.label,
                        visible: node.visible,
                        fill: node.fill,
                        stroke: node.stroke,
                        fontSize: node.fontSize,
                        fontColor: node.fontColor
                    };
                    
                    if(node.renderFunc == Graph.Renderer.imgNodeRenderFunc)
                    {
                        n.type = "imgnode";
                    }
                    nodes.push(n);
                }
                obj.nodes = nodes;
            }

            {
                var edgeInherit = [];
                for(var i in this.edgesInherit)
                {
                    var node = this.edgesInherit[i];
                    edgeInherit.push({
                        id: node.id,
                        type: "edgeinherit",
                        source: node.source.id,
                        target: node.target.id,
                        x: node.x,
                        y: node.y,
                        label: node.label,
                        visible: node.visible,
                        fill: node.fill,
                        stroke: node.stroke,
                        fontSize: node.fontSize,
                        fontColor: node.fontColor
                    }); 
                }
                obj.edgeInherit = edgeInherit;
            }

            {
                var edgeConnect = [];
                for(var i in this.edgesConnect)
                {
                    var node = this.edgesConnect[i];
                    edgeConnect.push({
                        id: node.id,
                        type: "edgeconnect",
                        source: node.source.id,
                        target: node.target.id,
                        x: node.x,
                        y: node.y,
                        label: node.label,
                        visible: node.visible,
                        fill: node.fill,
                        stroke: node.stroke,
                        fontSize: node.fontSize,
                        fontColor: node.fontColor
                    }); 
                }
                obj.edgeConnect = edgeConnect;
            }

            return JSON.stringify(obj);
        },

        fromJson: function(jsontxt)
        {
            this.nodes = {};
            this.edgesInherit = {};
            this.edgesConnect = {};
            this.selected = null;
            this.fatherCandidate = null;
            this.connTargetCandidate = null;
            this.fakeSelected = null;

            var obj = JSON.parse(jsontxt);
            this.setGraphProperties(obj);

            gRenderer.setViewport(obj.viewport.x, obj.viewport.y, obj.viewport.scale);

            // build all nodes and connections
            for(var i=0; i<obj.nodes.length; ++i)
            {
                var attr = obj.nodes[i];
                if(attr.type == "imgnode")
                {
                    attr.renderFunc = Graph.Renderer.imgNodeRenderFunc;
                }
                this.addNode(attr);
            }

            for(var i=0; i<obj.edgeConnect.length; ++i)
            {
                var attr = obj.edgeConnect[i];
                this.addConnection(this.nodes[attr.source], this.nodes[attr.target], attr);
            }

            var tempnode = this.addNode({id:_invalidId});
            var tempInherit = [];
            for(var i=0; i<obj.edgeInherit.length; ++i)
            {
                var attr = obj.edgeInherit[i];
                var target = this.nodes[attr.target];
                var source = this.nodes[attr.source] 
                        || this.edgesConnect[attr.source]
                        || this.edgesInherit[attr.source];
                if(!source)
                {
                    tempInherit.push(attr);

                    source = tempnode;
                }

                target.setParent(source, attr);
            }
            for(var i=0; i<tempInherit.length; ++i)
            {
                var attr = tempInherit[i];
                var target = this.nodes[attr.target];
                var source = this.edgesInherit[attr.source];
                target.setParent(source, attr);
            }
            tempnode.remove();


        },

        setSelected: function(node)
        {
			//var node = this.nodes[id] || this.edgesInherit[id] || this.edgesConnect[id];
            if(this.selected == node)
                return ;

            if(this.selected && this.selected.shape)
            {
                this.selected.shape[0].attr({stroke:this.selected.stroke, "stroke-width":1});
            }
            this.selected = node;
            if(this.selected && this.selected.shape)
            {
                this.selected.shape[0].attr({stroke:this.highlightStroke, "stroke-width":3});
            }

            if(this.selected)
            {
                var label = this.selected.label == _whitespace ? "" : this.selected.label;
                gRenderer.labelElement.val(label);    
            }
            else
            {
                gRenderer.labelElement.val("");
            }
            gRenderer.updateToolbar(true);
        },


        setFatherCandidate: function(node)
        {

            if(!node || !(this.selected) || this.selected.id == node.id/* || !(this.nodes[node.id])*/)
            {
                if(this.fatherCandidate)
                {
                    this.fatherCandidate.shape[0].attr({"stroke-width":1, fill:this.fatherCandidate.fill});
                }
                this.fatherCandidate = null;
                return ;
            }

            this.fatherCandidate = node;
            this.fatherCandidate.shape[0].attr({"stroke-width":3, fill:"#37f"});
        },

        setConnectTargetCandidate: function(node)
        {
            if(!node || !(this.nodes[node.id]))
            {
                if(this.connTargetCandidate)
                {
                    this.connTargetCandidate.shape[0].attr({"stroke-width":1, fill:this.connTargetCandidate.fill});
                }    
                this.connTargetCandidate = null;
                return ;
            }

            this.connTargetCandidate = node;
            this.connTargetCandidate.shape[0].attr({"stroke-width":3, fill:"#37f"});
            
        },
/*
// Deprecated, the result for path type elements is not right

        getNodesByPoint: function(x, y)
        {
            var real_scale = 1.0 / gRenderer.scale;
            x *= real_scale;
            y *= real_scale;

            var ret = [];
            for(var i in this.nodes)
            {
                var no = this.nodes[i];
                if(no.shape[0].isPointInside(x, y))
                {
                    ret.push(no);
                }
            }
            for(var i in this.edgesInherit)
            {
                var no = this.edgesInherit[i];
                var path = no.shape[0].attr("path");
                //if(no.shape[0].isPointInside(x, y))
                if(Raphael.isPointInsidePath(path, x, y))
                {
                    ret.push(no);
                }
            }
            for(var i in this.edgesConnect)
            {
                var no = this.edgesConnect[i];
                if(no.shape[0].isPointInside(x, y))
                {
                    ret.push(no);
                }
            }
            return ret;
        },
*/

        addNode: function(attr) 
        {
            var node = new Graph.Node(this, attr);
            this.nodes[node.id] = node;
            return node;
        },

        removeNode: function(node)
        {
            if(!node)
                return ;
            
            if(this.nodes[node.id])
            {
                node.remove();
            }
        },

        addConnection: function(source, target, attr) 
        {
            var edge = new Graph.EdgeConnection(this, source, target, attr);
            this.edgesConnect[edge.id] = edge;
            return edge;
        },

        removeConnection: function(conn)
        {
            if(!conn)
                return ;
            
            if(this.edges[conn.id])
            {
                conn.remove();
            }
        },

        // interactive
        deleteSelected: function()
        {
            if(!(this.selected))
                return ;
            this.selected.remove();
            this.selected = null;
            gRenderer.updateToolbar(true);
        },

        toAddConnection: function()
        {
            if(!(this.selected))
                return ;

            var vx = (gRenderer.domMousePos[0] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[2] / gRenderer.width + gRenderer.viewBox[0];
            var vy = (gRenderer.domMousePos[1] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[3] / gRenderer.height + gRenderer.viewBox[1];

            this.fakeSelected = this.addNode({x:vx, y:vy, renderFunc:Graph.Renderer.fakeRenderFunc});
            this.addConnection(this.selected, this.fakeSelected);
            this.fakeSelected.render();
            gRenderer.beginAddingConnection();
        },

        toAddTextNode: function()
        {
            if(!(this.selected))
                return ;

            var vx = (gRenderer.domMousePos[0] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[2] / gRenderer.width + gRenderer.viewBox[0];
            var vy = (gRenderer.domMousePos[1] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[3] / gRenderer.height + gRenderer.viewBox[1];

            this.fakeSelected = this.addNode({x:vx, y:vy});
            this.fakeSelected.setLabel("Text Node");
            this.fakeSelected.setParent(this.selected);
            this.fakeSelected.render();
            gRenderer.beginAddingNode();
        },

        toAddImageNode: function()
        {
            if(!(this.selected))
                return ;

            var vx = (gRenderer.domMousePos[0] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[2] / gRenderer.width + gRenderer.viewBox[0];
            var vy = (gRenderer.domMousePos[1] - gRenderer.canvasPos.left)
                        * gRenderer.viewBox[3] / gRenderer.height + gRenderer.viewBox[1];

            this.fakeSelected = this.addNode({x:vx, y:vy, 
                    renderFunc:Graph.Renderer.imgNodeRenderFunc,
                    fill:"none"
                });
            this.fakeSelected.setParent(this.selected);
            this.fakeSelected.render();
            gRenderer.beginAddingNode();
        },


    }
);

Graph.Node = new Class(
    {
        initialize:function(g, attr)
        {
            this.type = "Graph.Node";

            this.graph = g;

            attr = attr || {};
            this.id = attr.id || ++(g.nodecount);

            this.label = 
                (attr.label && typeof(attr.label)=="string" && attr.label != "") ? attr.label : _whitespace;
            this.x = attr.x || 0;
            this.y = attr.y || 0;
            this.visible = attr.visible || true;
            if(attr.fill == "none")
            {
                this.fill = "none";
                this.stroke = attr.stroke || gRenderer.getColor();
            }
            else
            {
                this.fill = attr.fill || gRenderer.getColor();
                this.stroke = attr.stroke || this.fill;
            }
                

			this.fontSize = attr.fontSize || g.fontSize;
			this.fontColor = attr.fontColor || g.fontColor;
			
            /* if a node renderer function is provided by the user, then use it
               or the default render function instead */
            this.renderFunc = attr.renderFunc || Graph.Renderer.defaultRenderFunc;

            this.shape = null;

            this.father = null;

            this.children = {};
            this.connectFather = null;
            this.connectChildren = {};
            this.connectIn = {};
            this.connectOut = {};
        },
        
        setLabel:function(text)
        {
            var label = 
                (text && typeof(text)=="string" && text != "") ? text : _whitespace;
            if(this.lable == label)
                return ;
            this.label = label;

            if(!(this.shape))
                return ;

            var self = this;
            var dfd = $.Deferred();
            dfd.then(
                function()
                {
                    // redraw text shape
                    
                    var subd = $.Deferred();

                    var labelWidth = 0;
                    var labelHeight = 0;       

                    if(self.renderFunc == Graph.Renderer.imgNodeRenderFunc)
                    {
                        var myImg = new Image();
                        myImg.onload = myImg.onerror = function()
                        {
                            labelWidth = myImg.width;
                            labelHeight = myImg.height;    

                            self.shape[1].attr({src:self.label, title:self.label,
                                width:labelWidth, height:labelHeight,
                                x:self.x + _halfnodespadding, y:self.y + _halfnodespadding});
                                   
                            self.shape[0].attr("title", self.label);    

                            labelWidth += _nodespadding;
                            labelHeight += _nodespadding;

                            self.shape[0].attr({width:labelWidth, height:labelHeight});

                            subd.resolve();
                        }
                        myImg.src = self.label;
                    }
                    else
                    {
                        self.shape[1].attr("text", self.label);    
                        var bbox = self.shape[1].getBBox();
                        labelWidth = bbox.width + _nodespadding;
                        labelHeight = bbox.height + _nodespadding;

                        self.shape[1].attr({x:self.x + _halfnodespadding, 
                                        y:self.y + labelHeight * 0.5});

                        self.shape[0].attr({width:labelWidth, height:labelHeight});

                        subd.resolve();
                    }

                    return subd.promise();
                }
            ).then(
                function()
                {
                    // redraw connections
            
                    // render connection to children
                    for(var i in self.connectChildren)
                    {
                        self.connectChildren[i].render();
                    }
                    
                    // redraw connection to father
                    if(self.connectFather)
                    {
                        self.connectFather.render();
                    }

                    // redraw connection in and out
                    for(var i in self.connectIn)
                    {
                        self.connectIn[i].render();
                    }
                    for(var i in self.connectOut)
                    {
                        self.connectOut[i].render();
                    }
                }
            );

            dfd.resolve();
			
        },

        setParent:function(parent, attr)
        {
            if(this.father == parent)
            {
                return this.connectFather;
            }
			
			var i = 0;
			if(this.father)
			{
				// remove this from old father
                delete this.father.children[this.id];
			}
            if(this.connectFather)
            {
                delete this.father.connectChildren[this.connectFather.id];
            }
			
            this.father = parent;
			
			if(!(this.father))
			{
				this.connectFather && this.connectFather.remove();
				this.connectFather = null;
				return null;
			}
			
			// add this to new father
			this.father.children[this.id] = this;

            // redraw connection to father
            if(!this.connectFather)
            {
                this.connectFather = new Graph.Edge(this.graph, parent, this, attr);
                this.graph.edgesInherit[this.connectFather.id] = this.connectFather;
            }
            parent.connectChildren[this.connectFather.id] = this.connectFather;

            this.connectFather.source = parent;
			this.connectFather.render();
            
			return this.connectFather;
        },

        translate:function(dx, dy)
        {
            var real_scale = 1.0 / gRenderer.scale;
            // translate self
            
            var rdx = dx * real_scale;
            var rdy = dy * real_scale;
            
            this.x += rdx;
            this.y += rdy;
            if(this.shape)
            {
                //this.shape.translate(real_scale * dx, real_scale * dy);
                //var t = "t"+real_scale * dx+","+real_scale * dy;
                //console.log(t);
                //this.shape.transform(t);
                /*var posX = this.shape.attr("x");
                var posY = this.shape.attr("y");
                this.shape.attr({x:posX+dx, y:posY+dy});*/
                

                var el = this.shape.items[0];
                var posX = el.attr("x");
                var posY = el.attr("y");
                el.attr({x:posX+rdx, y:posY+rdy});

                if(this.shape.items[1])
                {
                    var label = this.shape.items[1];
                    posX = label.attr("x");
                    posY = label.attr("y");
                    label.attr({x:posX+rdx, y:posY+rdy});                    
                }
                
            }
            
            // translate children
            for(var i in this.children)
            {
                this.children[i].translate(dx, dy);
            }

            // render connection to children
			// no need, let children do it
            /*for(i=0; i<this.connectChildren.length; ++i)
            {
                this.connectChildren[i].render();//translate(dx, dy);
            }*/

            // redraw connection to father
            if(this.connectFather)
            {
                this.connectFather.render();
            }

            // redraw connection in and out
            for(var i in this.connectIn)
            {
                this.connectIn[i].render();
            }
            for(var i in this.connectOut)
            {
                this.connectOut[i].render();
            }

            if(this == this.graph.selected)
                gRenderer.updateToolbar(true);
        },

        renderImpl: function()
        {
            /* if node has already been drawn, move the nodes */
            if(this.shape) 
            {
                gRenderer.r.safari();
				return ;
            }/* else, draw new nodes */

            var shape;

            shape = this.renderFunc(gRenderer.r, this).hide();
            shape.owner = this;
            shape.attr({"fill-opacity": this.graph.fillOpacity});
            /* re-reference to the node an element belongs to, needed for dragging all elements of a node */
            shape.items.forEach(function(item){ item.set = shape; item.node.style.cursor = "move"; });
            //shape.mousedown(gRenderer.dragger);
            shape.drag(gRenderer.onselectmove, gRenderer.dragger, gRenderer.onselectup);
            shape.mouseover(gRenderer.onmouseover);
            shape.mouseout(gRenderer.onmouseout);
            //var box = shape.getBBox();
            //shape.translate(Math.round(this.x - (box.x + box.width/2)),
            //                Math.round(this.y - (box.y + box.height/2)));
            //console.log(box, this.x, this.y);
            !this.visible || shape.show();
            this.shape = shape;
        },

        render:function()
        {
            // draw self
            this.renderImpl();

            // draw connections
            if(this.connectFather)
            {
                this.connectFather.render();
            }

            for(var i in this.connectChildren)
            {
                this.connectChildren[i].render();
            }
            for(var i in this.connectIn)
            {
                this.connectIn[i].render();
            }
            for(var i in this.connectOut)
            {
                this.connectOut[i].render();
            }
        },

        setVisible:function(visible)
        {
            if(this.visible == visible)
                return ;
            this.visible = visible;
            if(this.shape)
            {
                if(this.visible)
                {
                    this.shape.show();
                }    
                else
                {
                    this.shape.hide();
                }
            }
            

            for(var i in this.children)
            {
                this.children[i].setVisible(visible);
            }

            if(this.connectFather)
            {
                this.connectFather.setVisible(visible);
            }
            for(var i in this.connectChildren)
            {
                this.connectChildren[i].setVisible(visible);
            }
            
            for(var i in this.connectIn)
            {
                this.connectIn[i].setVisible(visible);
            }
            for(var i in this.connectOut)
            {
                this.connectOut[i].setVisible(visible);
            }
        },

        remove: function()
        {
            if(this.father)
            {
				if(this.connectFather)
					this.connectFather.remove();
					
                for(var i in this.father.children)
                {
                    if(i == this.id)
                    {
                        delete this.father.children[i];
                        break;
                    }
                }
                this.father = null;
                this.connectFather = null;
            }

            var toClearArr = this.connectChildren;
            this.connectChildren = {};
            for(var i in toClearArr)
            {
                toClearArr[i].remove();
            }
            
            toClearArr = this.connectIn;
            this.connectIn = {};
            for(var i in toClearArr)
            {
                toClearArr[i].remove();
            }
            
            toClearArr = this.connectOut;
            this.connectOut = {};
            for(var i in toClearArr)
            {
                toClearArr[i].remove();
            }

            toClearArr = this.children;
            this.children = {};
            for(var i in toClearArr)
            {
                toClearArr[i].remove();
            }

			if(this.graph.nodes[this.id])
				delete this.graph.nodes[this.id];

            if(this.shape)
                this.shape.remove();
        },
        
    }
);

Graph.Edge = new Class(
    {
        Extends: Graph.Node,
        initialize:function(g, src, tgt, attr)
        {
            if(!src || !tgt)
            {
                throw "Edge must have source and target";
            }

            this.parent(g, attr);
            
            this.type = "Graph.Edge";

            this.source = src;
            this.target = tgt;
			this.directed = true;
            
            attr = attr || {};
			this.stroke = attr.stroke || this.graph.edgeStroke;
            this.fill = attr.fill || this.graph.edgeFill;

            this.curvept = -1;
            if(src.connectFather && src.connectFather.source == tgt)
            {
                this.curvept += 1;
            }
            else
            {
                for(var i in src.connectChildren)
                {
                    if(src.connectChildren[i].target == tgt)
                    {
                        this.curvept += 1;
                        break;
                    }
                }
            }
            
            for(var i in src.connnectOut)
            {
                if(src.connectOut[i].target == tgt)
                {
                    this.curvept += 1;
                    break;
                }
            }
            for(var i in src.connectIn)
            {
                if(src.connectIn[i].source == tgt)
                {
                    this.curvept += 1;
                }
            }
            
            
        },

		renderImpl: function()
        {
            /* if node has already been drawn, move the nodes */
            if(this.shape) 
            {
                this.shape.source = this.source.shape;
				this.shape.target = this.target.shape;
				this.shape.draw();
                gRenderer.r.safari();
				return ;
            }/* else, draw new nodes */
			
			if( !(this.source.shape) || !(this.target.shape))
				return ;
				
            var shape;

            shape = gRenderer.r.connection(this.source.shape, this.target.shape, this).hide();
            shape.owner = this;
            //shape.attr({"fill-opacity": this.graph.fillOpacity});
            /* re-reference to the node an element belongs to, needed for dragging all elements of a node */
            shape.items.forEach(function(item){ item.set = shape; item.node.style.cursor = "move"; });
            shape.click(gRenderer.edgeClick);
            shape.mouseover(gRenderer.onmouseover);
            shape.mouseout(gRenderer.onmouseout);

            //var box = shape.getBBox();
            //shape.translate(Math.round(this.x - (box.x + box.width/2)),
            //                Math.round(this.y - (box.y + box.height/2)));
            //console.log(box, this.x, this.y);
            !this.visible || shape.show();
            this.shape = shape;
        },

		remove: function()
		{
			this.parent();

            if(this.source.connectChildren[this.id])
                delete this.source.connectChildren[this.id];

            if(this.target.connectFather)
                this.target.connectFather = null;

            if(this.graph.edgesInherit[this.id])
				delete this.graph.edgesInherit[this.id];
		},
    }
);

Graph.EdgeConnection = new Class(
    {
        Extends: Graph.Edge,
        initialize:function(g, src, tgt, attr)
        {
            this.parent(g, src, tgt, attr);
            
            this.type = "Graph.EdgeConnection";

            src.connectOut[this.id] = this;
            tgt.connectIn[this.id] = this;
        },

        renderImpl: function()
        {
            this.parent();
            if(this.shape)
            {
                this.shape[0].attr("stroke-dasharray", "- .");    
            }
        },

        remove: function()
        {
            this.parent();

            if(this.source.connectOut[this.id])
                delete this.source.connectOut[this.id];
            if(this.target.connectIn[this.id])
                delete this.target.connectIn[this.id];

            if(this.graph.edgesConnect[this.id])
                delete this.graph.edgesConnect[this.id];
        },

    }
);


/*
 * Renderer base class
 */
Graph.Renderer = {};

var _DragNone = 0;
var _DragMove = 1;
var _DragNewConn = 2;
var _DragNewNode = 3;

var gRenderer = null;
/*
 * Renderer implementation using RaphaelJS
 */
Graph.Renderer.Raphael = function(element, width, height, statElement, toolbarElement, labelElement) {

    gRenderer = this;

    this.width = width || 400;
    this.height = height || 400;
    this.graph = null;  // the graph will be set in draw(graph)
    var selfRef = this;
    
    this.r = Raphael(element, this.width, this.height);
    this.r.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve");

    this.r.setViewBox(0, 0, this.width, this.height);
    this.viewBox = [0, 0, this.width, this.height];
    this.scale = 1.0;
    this.mouse_in = false;
    this.canvasPos = $("#"+element).offset();
    this.toolbarElement = (toolbarElement && typeof(toolbarElement) == "string") 
                        ? $(toolbarElement) : null;
    this.toolbarSize = [0, 0];
    if(this.toolbarElement)
    {
        this.toolbarSize[0] = this.toolbarElement.width() + 10;
        this.toolbarSize[1] = this.toolbarElement.height() + 10;
    }
    this.labelElement = (labelElement && typeof(labelElement) == "string") 
                        ? $(labelElement) : null;

    this.domMousePos = [0, 0];

    this.getColor = function()
    {
        return Raphael.getColor();
    };

    this.updateStat = function()
    {
        if(statElement)
        {
            $(statElement).text(Math.round(this.scale * 100) + "%");
        }
    };
    this.updateStat();
    

    /*
    * Dragging
    */
    this.dragState = _DragNone; 
    this.dragObj = null;
    this.lastdx = 0;
    this.lastdy = 0;
	this.edgeClick = function()
	{
		if(this.set)
        {
            selfRef.graph.setSelected(this.set.owner);    
        }
	};
	
	this.dragger = function () {
        //this.lastX = e.clientX;
        //this.lastY = e.clientY;
        if(selfRef.dragState == _DragNewConn)
            return ;

        if(this.set)
        {
            selfRef.dragState = _DragMove;
            selfRef.dragObj = this;

            selfRef.lastdx = 0;
            selfRef.lastdy = 0;
            
            this.set.animate({"fill-opacity": .1}, 200);
            this.set.toBack();
            selfRef.graph.setSelected(this.set.owner);    
        }
        
        //e.preventDefault && e.preventDefault();
    };
    this.onselectmove = function(dx, dy)
    {
        if (selfRef.dragState == _DragMove) 
        {
            selfRef.dragObj.set.owner.translate(dx - selfRef.lastdx,
                                               dy - selfRef.lastdy);
            selfRef.lastdx = dx;
            selfRef.lastdy = dy;
        }
    };
    this.onselectup = function()
    {
        if (selfRef.dragState == _DragMove) 
        {
            selfRef.dragState = _DragNone; 
            selfRef.dragObj.set.animate({"fill-opacity": selfRef.graph.fillOpacity}, 500);
            selfRef.dragObj.set.toFront();
            selfRef.dragObj = null;

            if(selfRef.graph.fatherCandidate)
            {
                this.set.owner.setParent(selfRef.graph.fatherCandidate);
                selfRef.graph.setFatherCandidate(null);
            }    
        }
        
    };
    // check set parent to other
    this.checkFatherCandidate = function(candidate)
    {
        if(selfRef.dragObj.set.owner.id == candidate.set.owner.id)
            return ;

        var moving = selfRef.dragObj.set.owner;
        var node = candidate.set.owner;
        if(node == moving || moving.father == node)
            return ;

        var p = null;
        if(node.type != "Graph.Node")
        {
            if(node == moving.connectFather
               || moving.connectChildren[node.id]
               || moving.connectIn[node.id]
               || moving.connectOut[node.id])
            {
                return ;
            }
            p = node.source;
        }
        else
        {
            p = node;
        }
        if(!p)
        {
            return ;
        }

        while(p)
        {
            if(p == moving
               || p == moving.connectFather
               || moving.connectChildren[p.id]
               || moving.connectIn[p.id]
               || moving.connectOut[p.id]
               )
            {
                break;
            }
            if(p.type != "Graph.Node")
            {
                p = p.source;
            }
            else
            {
                p = p.father;    
            }
            
        }
        if(p)
        {
            return ;
        }
                
        selfRef.graph.setFatherCandidate(node);
    };
    this.checkConnectTarget = function(target)
    {
        var node = target.set.owner;
        if(node == selfRef.graph.selected || node.type != "Graph.Node")
            return ;
        for(var i in selfRef.graph.selected.connectOut)
        {
            if(selfRef.graph.selected.connectOut[i].target == node)
                return ;
        }
        /*for(var i in selfRef.graph.selected.connectIn)
        {
            if(selfRef.graph.selected.connectIn[i].source == node)
                return ;
        }*/
        selfRef.graph.setConnectTargetCandidate(node);
    };
    this.onmouseover = function()
    {
        if(selfRef.dragState == _DragMove)
        {
            selfRef.checkFatherCandidate(this);
        }
        else if(selfRef.dragState == _DragNewConn)
        {
            selfRef.checkConnectTarget(this);
        }
        
    };
    this.onmouseout = function()
    {
        if(selfRef.dragState == _DragMove)
        {
            if(selfRef.dragObj.set.owner.id == this.set.id)
                return ;
            selfRef.graph.setFatherCandidate(null);
        }
        else if(selfRef.dragState == _DragNewConn)
        {
            selfRef.graph.setConnectTargetCandidate(null);
        }
        
    };

/*
    var d = document.getElementById(element);
    d.onmousemove = function (e) {
        e = e || window.event;
        if (selfRef.isDrag) {
            var bBox = selfRef.isDrag.set.getBBox();

            selfRef.isDrag.set.owner.translate(e.clientX - selfRef.isDrag.lastX,
                                             e.clientY - selfRef.isDrag.lastY);
                  
            selfRef.isDrag.lastX = e.clientX;
            selfRef.isDrag.lastY = e.clientY;
        }
    };
    d.onmouseup = function () {
        selfRef.isDrag && selfRef.isDrag.set.animate({"fill-opacity": .6}, 500);
        selfRef.isDrag = false;
    };
  */  
    this.setViewport = function(x, y, scale)
    {
        var real_scale = 1.0 / selfRef.scale;

        var vbwo = selfRef.width * real_scale;
        var vbho = selfRef.height * real_scale;
        
        selfRef.scale = scale;
        if(selfRef.scale > 5)
        {
            selfRef.scale = 5;
        }
        else if(selfRef.scale < 0.2)
        {
            selfRef.scale = 0.2;
        }

        //selfRef.scale = Math.round(selfRef.scale);
        selfRef.updateStat();

        real_scale = 1.0 / selfRef.scale;

        selfRef.viewBox[2] = selfRef.width * real_scale;
        selfRef.viewBox[3] = selfRef.height * real_scale;
        selfRef.viewBox[0] = x;
        selfRef.viewBox[1] = y;
        
        selfRef.r.setViewBox(selfRef.viewBox[0],
                             selfRef.viewBox[1],
                             selfRef.viewBox[2],
                             selfRef.viewBox[3]);
        
        selfRef.updateToolbar(false);
    }

    var element_selector = "#" + element;
    var _scaling = false;
    $(element_selector).mousewheel(
        function(event, delta, deltaX, deltaY)
        {
            if(!event.shiftKey
                || selfRef.dragState != _DragNone)
            {
                return ;
            }
            _scaling = true;
            var real_scale = 1.0 / selfRef.scale;

            var vbwo = selfRef.width * real_scale;
            var vbho = selfRef.height * real_scale;
            var ds = 0.1;

            if(delta == 0)
            {
                return ;
            }
            else if(delta > 0)
            {
                selfRef.scale += ds;
                if(selfRef.scale > 5)
                {
                    selfRef.scale = 5;
                }
                
            }
            else
            {
                selfRef.scale -= ds;
                if(selfRef.scale < 0.2)
                {
                    selfRef.scale = 0.2;
                }
                
            }
            //selfRef.scale = Math.round(selfRef.scale);
            selfRef.updateStat();

            real_scale = 1.0 / selfRef.scale;

            selfRef.viewBox[2] = selfRef.width * real_scale;
            selfRef.viewBox[3] = selfRef.height * real_scale;
            selfRef.viewBox[0] -= (selfRef.viewBox[2] - vbwo) * 0.5;
            selfRef.viewBox[1] -= (selfRef.viewBox[3] - vbho) * 0.5;
            
            selfRef.r.setViewBox(selfRef.viewBox[0],
                                 selfRef.viewBox[1],
                                 selfRef.viewBox[2],
                                 selfRef.viewBox[3]);
            
            selfRef.updateToolbar(false);
        }
    );

    var _lastX = 0;
    var _lastY = 0;
    var _dragging = false;
    $(element_selector).mousedown(
        function(e)
        {
            if(selfRef.dragState == _DragMove
                || selfRef.dragState == _DragNewConn
                || selfRef.dragState == _DragNewNode)
            {
                return ;
            }

            _lastX = e.pageX;
            _lastY = e.pageY;
            _dragging = true;
        }
    );

    this.beginAddingConnection = function()
    {
        if(!(selfRef.graph.fakeSelected))
            return ;

        _lastX = selfRef.domMousePos[0];
        _lastY = selfRef.domMousePos[1];
        selfRef.dragState = _DragNewConn;

        selfRef.toolbarElement.css({
            "visibility":"hidden"
        });   
    };
    this.beginAddingNode = function()
    {
        if(!(selfRef.graph.fakeSelected))
            return ;

        _lastX = selfRef.domMousePos[0];
        _lastY = selfRef.domMousePos[1];
        selfRef.dragState = _DragNewNode;

        selfRef.toolbarElement.css({
            "visibility":"hidden"
        });   
    };

    $(element_selector).mousemove(
        function(e)
        {
            var dX = e.pageX - _lastX;
            var dY = e.pageY - _lastY;

            selfRef.domMousePos[0] = e.pageX;
            selfRef.domMousePos[1] = e.pageY;

            if(_dragging)
            {
                real_scale = 1.0 / selfRef.scale;
                dX = -dX * real_scale;
                dY = -dY * real_scale;
                
                selfRef.viewBox[0] += dX;
                selfRef.viewBox[1] += dY;
                selfRef.r.setViewBox(selfRef.viewBox[0],
                                     selfRef.viewBox[1],
                                     selfRef.viewBox[2],
                                     selfRef.viewBox[3]);

                selfRef.updateToolbar(false);
            }
            else if(selfRef.dragState == _DragNewConn
                    || selfRef.dragState == _DragNewNode)
            {
                selfRef.graph.fakeSelected.translate(dX, dY);
            }

            _lastX = e.pageX;
            _lastY = e.pageY;
        }
    );

    $(element_selector).mouseup(
        function(e)
        {
            if(_dragging)
            {
                _dragging = false;
                selfRef.graph.setSelected(null);
            }
            else if(selfRef.dragState == _DragNewConn)
            {
                selfRef.dragState = _DragNone;
                selfRef.graph.fakeSelected.remove();   
                selfRef.graph.fakeSelected = null;
                if(selfRef.graph.connTargetCandidate)
                {
                    var conn = selfRef.graph.addConnection(selfRef.graph.selected, selfRef.graph.connTargetCandidate);
                    conn.render();
                    selfRef.graph.setConnectTargetCandidate(null);
                    selfRef.graph.setSelected(conn);
                }
                else
                {
                    selfRef.updateToolbar(true);
                }
            }
            else if(selfRef.dragState == _DragNewNode)
            {
                selfRef.dragState = _DragNone;
                selfRef.graph.setSelected(selfRef.graph.fakeSelected);   
                selfRef.graph.fakeSelected = null;
            }

            
        }
    );

    // keyboard
    
    $(document).keyup(
        function(event)
        {
            //console.log(event.which);
            if(event.which == 16)
            {
                // shift
                if(_scaling)
                {
                    if(_scaling)
                    {
                        _scaling = false;
                        // redraw all connections
                        for(var i in selfRef.graph.edgesInherit)
                        {
                            selfRef.graph.edgesInherit[i].render();
                        }
                        for(var i in selfRef.graph.edgesConnect)
                        {
                            selfRef.graph.edgesConnect[i].render();
                        }
                    }
                    event.preventDefault && event.preventDefault();
                }
            }
            else if(event.which == 27)
            {
                // esc
                if(selfRef.dragState == _DragNewConn
                   || selfRef.dragState == _DragNewNode)
                {
                    selfRef.dragState = _DragNone;
                    selfRef.graph.fakeSelected.remove();   
                    selfRef.graph.fakeSelected = null;
                    if(selfRef.graph.connTargetCandidate)
                    {   
                        selfRef.graph.setConnectTargetCandidate(null);
                    }
                    selfRef.updateToolbar(true);
                }
            }

            /*if(event.which == 68 && event.ctrlKey)
            {
                // "d" + ctrl

                if(selfRef.graph.selected
                   && selfRef.graph.selected.type != "Graph.Edge")
                {console.log(event.which);
                    selfRef.graph.selected.remove();
                    selfRef.graph.selected = null;

                    event.preventDefault();
                }

            }*/
        }
    );
  
};

// default node render function
Graph.Renderer.defaultRenderFunc = function(r, node) {
    var label = r.text(node.x, node.y, node.label)
             .attr({"text-anchor":"start", fill: node.fontColor, "font-size": node.fontSize});
    var textBox = label.getBBox();
    var labelWidth = textBox.width + _nodespadding;
    var labelHeight = textBox.height + _nodespadding;
    label.attr({x:node.x+_halfnodespadding, y:node.y+labelHeight*0.5});

    var ellipse = r.rect(node.x, node.y, labelWidth, labelHeight, 7)
            .attr({fill: node.fill, stroke: node.stroke, "stroke-width": 1});
    //var ellipse = r.ellipse(node.x, node.y, 30, 20).attr({fill: node.fill, stroke: node.stroke, "stroke-width": 1});
    /* set DOM node ID */
    ellipse.node.id = node.id;
    label.toFront();
    var shape = r.set().
        push(ellipse).
        push(label);
    return shape;
}

// fake node render function
Graph.Renderer.fakeRenderFunc = function(r, node) {
    var labelWidth = _nodespadding;
    var labelHeight = _nodespadding;

    var ellipse = r.rect(node.x, node.y, labelWidth, labelHeight, 7)
            .attr({fill: node.fill, stroke: node.stroke, "stroke-width": 1});
    ellipse.node.id = node.id;
    var shape = r.set().push(ellipse);
    return shape;
}
Graph.Renderer.imgNodeRenderFunc = function(r, node) {

    var labelWidth = 10;
    var labelHeight = 10;

    var label = r.image(node.label, node.x, node.y, labelWidth, labelHeight);
    label.attr({x:node.x+_halfnodespadding, y:node.y+_halfnodespadding, title:node.label});

    var ellipse = r.rect(node.x, node.y, labelWidth, labelHeight, 7)
            .attr({fill: node.fill, stroke: node.stroke, "stroke-width": 1, title:node.label});
    //var ellipse = r.ellipse(node.x, node.y, 30, 20).attr({fill: node.fill, stroke: node.stroke, "stroke-width": 1});
    /* set DOM node ID */
    ellipse.node.id = node.id;
    label.toFront();
    var shape = r.set().
        push(ellipse).
        push(label);

    var myImg = new Image();
    myImg.onload = myImg.onerror = function()
    {
        labelWidth = myImg.width;
        labelHeight = myImg.height;

        label.attr({width:labelWidth, height:labelHeight,
                    x:node.x + _halfnodespadding, y:node.y + _halfnodespadding});
        labelWidth += _nodespadding;
        labelHeight += _nodespadding;

        ellipse.attr({width:labelWidth, height:labelHeight});
    }
    myImg.src = node.label;

    return shape;
    
}



Graph.Renderer.Raphael.prototype = {
    drawGraph: function(g)
    {
        for(var i in g.edgesInherit)
        {
            g.edgesInherit[i].shape = null;
        }
        for(var i in g.edgesConnect)
        {
            g.edgesConnect[i].shape = null;
        }
        for (var i in g.nodes) 
        {
            g.nodes[i].shape = null;
        }

        this.r.clear();

        this.graph = g;
        for (var i in g.nodes) 
        {
            g.nodes[i].render();
        }
    },

    ptScreenToWorld: function(x, y)
    {
        var pt = [0, 0];
        pt[0] = (x - this.canvasPos.left)
                        * this.viewBox[2] / this.width + this.viewBox[0];
        pt[1] = (y - this.canvasPos.left)
                        * this.viewBox[3] / this.height + this.viewBox[1];
        return pt;
    },

    ptWorldToScreen: function(x, y)
    {
        var pt = [0, 0];
        pt[0] = this.canvasPos.left + (x - this.viewBox[0]) / this.viewBox[2] * this.width;
        pt[1] = this.canvasPos.top + (y - this.viewBox[1]) / this.viewBox[3] * this.height;    
        return pt;
    },

    updateToolbar: function(selected_changed)
    {
        if(!(this.toolbarElement))
            return ;

        var node = this.graph.selected;
        if(node)
        {
            var x = this.domMousePos[0];
            var y = this.domMousePos[1];
            if(!selected_changed)
            {
                x = this.toolbarElement.left;
                y = this.toolbarElement.top;
            }
            if(node.type == "Graph.Node")
            {
                var bbox = node.shape.getBBox();

                x = Math.round(this.canvasPos.left + (node.x - this.viewBox[0]) / this.viewBox[2] * this.width);
                y = Math.round(this.canvasPos.top + (node.y - this.viewBox[1]) / this.viewBox[3] * this.height - this.toolbarSize[1]);    

                if(y < 0)
                {
                    y += this.toolbarSize[1] + bbox.height;
                }

                $( "#connect" ).button("option", "disabled", false);
            }
            else
            {
                $( "#connect" ).button("option", "disabled", true); 
            }
            /*if(node.type == "Graph.Edge")
            {
                $( "#delete" ).button("option", "disabled", true);       
            }
            else
            {
                $( "#delete" ).button("option", "disabled", false);           
            }*/
            
            if(x < this.canvasPos.left)
            {
                x = this.canvasPos.left;
            }
            /*else if(x + this.toolbarSize[0] > this.width)
            {
                x = this.width - this.toolbarSize[0];
            }*/
            
            
            
            this.toolbarElement.css({
                "left":x,
                "top":y,
                "visibility":"visible"
            });
        }
        else
        {
            this.toolbarElement.css({
                "visibility":"hidden"
            });    
        }
    },

    
};

