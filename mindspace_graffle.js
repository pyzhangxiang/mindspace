/**
 * Originally grabbed from the official RaphaelJS Documentation
 * http://raphaeljs.com/graffle.html
 * Adopted (arrows) and commented by Philipp Strathausen http://blog.ameisenbar.de
 * Licenced under the MIT licence.
 */

/**
 * Usage:
 * connect two shapes
 * parameters:
 *      source shape [or connection for redrawing],
 *      target shape,
 *      style with { fg : linecolor, bg : background color, directed: boolean }
 * returns:
 *      connection { draw = function() }
 */
Raphael.fn.connection = function Connection(obj1, obj2, edge) {
	var selfRef = this;
	/* create and return new connection */
	var shape = selfRef.set();
	shape.source = obj1;
	shape.target = obj2;
	shape.draw = function() {
		/* get bounding boxes of target and source */
		var bb1 = shape.source.getBBox();
		var bb2 = shape.target.getBBox();

		var off1 = 0;
		var off2 = 0;
		/* coordinates for potential connection coordinates from/to the objects */
		var p = [
			/* NORTH 1 */
			{ x: bb1.x + bb1.width / 2, y: bb1.y - off1 },
			/* SOUTH 1 */
			{ x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + off1 },
			/* WEST */
			{ x: bb1.x - off1, y: bb1.y + bb1.height / 2 },
			/* EAST  1 */
			{ x: bb1.x + bb1.width + off1, y: bb1.y + bb1.height / 2 },
			/* NORTH 2 */
			{ x: bb2.x + bb2.width / 2, y: bb2.y - off2 },
			/* SOUTH 2 */
			{ x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + off2 },
			/* WEST  2 */
			{ x: bb2.x - off2, y: bb2.y + bb2.height / 2 },
			/* EAST  2 */
			{ x: bb2.x + bb2.width + off2, y: bb2.y + bb2.height / 2 }
		];

		if(shape.source[0].type == "path")
		{
			var tl = shape.source[0].getTotalLength();
			p[2] = shape.source[0].getPointAtLength(tl * 0.2);
			p[3] = shape.source[0].getPointAtLength(tl * 0.8);
			p[0] = shape.source[0].getPointAtLength(tl * 0.4);
			p[1] = shape.source[0].getPointAtLength(tl * 0.6);
			
		}
      
		/* distances between objects and according coordinates connection */
		var d = {}, dis = [];

		/*
		 * find out the best connection coordinates by trying all possible ways
		 */
		/* loop the first object's connection coordinates */
		for (var i = 0; i < 4; i++) {
			/* loop the seond object's connection coordinates */
			for (var j = 4; j < 8; j++) {
				var dx = Math.abs(p[i].x - p[j].x);
				var dy = Math.abs(p[i].y - p[j].y);
				if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x)
					&& ((i != 2 && j != 7) || p[i].x > p[j].x)
					&& ((i != 0 && j != 5) || p[i].y > p[j].y)
					&& ((i != 1 && j != 4) || p[i].y < p[j].y)))
				{
					dis.push(dx + dy);
					d[dis[dis.length - 1].toFixed(3)] = [i, j];
				}
			}
		}
		var res = dis.length == 0 ? [0, 4] : d[Math.min.apply(Math, dis).toFixed(3)];
		/* bezier path */
		var x1 = p[res[0]].x,
			y1 = p[res[0]].y,
			x4 = p[res[1]].x,
			y4 = p[res[1]].y;
		if(edge.curvept >= 0)
		{
			x1 = p[edge.curvept].x;
			y1 = p[edge.curvept].y;
		}

			
		var	dx = Math.max(Math.abs(x1 - x4) / 3, 10),
			dy = Math.max(Math.abs(y1 - y4) / 3, 10),
			x2 = [ x1, x1, x1 - dx, x1 + dx ][res[0]].toFixed(3),
			y2 = [ y1 - dy, y1 + dy, y1, y1 ][res[0]].toFixed(3),
			x3 = [ 0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx ][res[1]].toFixed(3),
			y3 = [ 0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4 ][res[1]].toFixed(3);
		/* assemble path and arrow */
		var path = [ "M" + x1.toFixed(3), y1.toFixed(3),
			"C" + x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3) ].join(",");
		// line
		//var path = [ "M" + x1.toFixed(3), y1.toFixed(3), "L"+x4.toFixed(3), y4.toFixed(3) ].join(",");
		
		/* arrow */
		if(edge.directed) {
			// magnitude, length of the last path vector 
			var mag = Math.sqrt((y4 - y3) * (y4 - y3) + (x4 - x3) * (x4 - x3));
			// vector normalisation to specified length  
			var norm = function(x,l){return (-x*(l||5)/mag);};
			// calculate array coordinates (two lines orthogonal to the path vector) 
			var arr = [
				{ x:(norm(x4-x3)+norm(y4-y3)+x4).toFixed(3),
				y:(norm(y4-y3)+norm(x4-x3)+y4).toFixed(3) },
				{ x:(norm(x4-x3)-norm(y4-y3)+x4).toFixed(3),
				y:(norm(y4-y3)-norm(x4-x3)+y4).toFixed(3) }
			];
			path = path + ",M"+arr[0].x+","+arr[0].y+",L"+x4+","+y4+",L"+arr[1].x+","+arr[1].y;
		}
		/* function to be used for moving existent path(s), e.g. animate() or attr() */
		//var move = "attr";
		// applying path(s) 
		if(shape.fg)
		{
			shape.fg.attr({path:path});
		}
		else
		{
			shape.fg = selfRef.path(path)
              .attr({ stroke: edge.stroke, "stroke-width":1, fill: edge.fill })
              .toBack();
			
			shape.push(shape.fg);
		}
		shape.fg.getBBox();
		shape.fg.attr("fill-opacity", 0.0);
          
		// setting label 
		if(shape.label)
		{
			shape.label.attr({x:(x1+x4)/2, y:(y1+y4)/2});
			if(edge.label)
			{
				shape.label.attr({text:edge.label});
			}
		}
		else
		{
			shape.label = selfRef.text((x1+x4)/2, (y1+y4)/2, edge.label)
                .attr({fill: edge.fontColor, "font-size": edge.fontSize});
			shape.push(shape.label);
		}
		shape.label.attr("fill-opacity", edge.graph.fillOpacity);
		
	}
	
	shape.draw();
	return shape;
};
