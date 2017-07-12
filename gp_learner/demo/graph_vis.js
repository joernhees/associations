/**
 * Created by rouven on 12.07.17.
 */

GraphVis = {
    GraphView: {
        FONTSIZE: 12,
        SHADOWSIZE: 3,
        INIT_LINK_WIDTH: 1,

        width: function () {
            return $(this.canvasSelector).width();
        },
        height: function () {
            return $(this.canvasSelector).height();
        },
        nodes: [],
        links: [],
        canvasSelector: null,

        init: function (canvasId) {
            this.canvasSelector = "#" + canvasId;
            $(this.canvasSelector).html(""); // clear canvas

            this.forceLayout = d3.layout.force()
                .nodes(this.nodes)
                .links(this.links)
                .size([this.width(), this.height()])
                .linkDistance(200)
                .on("tick", this.tick.bind(this));

            let zoom = d3.behavior.zoom()
                .scaleExtent([.1, 10])
                .on("zoom", this.zoomed.bind(this));

            let drag = d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", this.dragStarted.bind(this))
                .on("drag", this.dragged.bind(this))
                .on("dragend", this.dragEnded).bind(this);

            let svg = d3.select(this.canvasSelector).append("svg:svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .call(zoom);

            this.container = svg.append("g");

            // Per-type markers, as they don't inherit styles.
            this.container.append("svg:defs").append("svg:marker")
                .attr("id", "marker")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .attr("markerUnits", "userSpaceOnUse")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

            this.groups = {};

            this.groups.link = this.container.append("svg:g").attr("class", "links");
            this.groups.linkDefs = this.groups.link.append("svg:defs");
            this.groups.linkPaths = this.groups.link.append("svg:g").attr("class", "paths");
            this.groups.linkLabels = this.groups.link.append("svg:g").attr("class", "labels");
            this.groups.linkLabelsShadow = this.groups.linkLabels.append("svg:g").attr("class", "shadows");
            this.groups.linkLabelsText = this.groups.linkLabels.append("svg:g").attr("class", "texts");
            this.groups.circles = this.container.append("svg:g");
            this.groups.text = this.container.append("svg:g");
        },


        start: function () {

            function getLinkID(data) {
                return btoa(encodeURIComponent(data.source.id)) + "_" +
                    btoa(encodeURIComponent(data.target.id)) + "_" + data.count;
            }

            this.joins = {};

            this.joins.linkDefs = this.groups.linkDefs.selectAll("path").data(this.forceLayout.links());
            this.joins.linkDefs.enter().append("path").attr('class', 'link-text-path');
            this.joins.linkDefs.attr("id", getLinkID);
            this.joins.linkDefs.exit().remove();

            this.joins.link = this.groups.linkPaths.selectAll(".links > .paths > path").data(this.forceLayout.links());
            let link = this.joins.link.enter().append('path').attr('class', 'link').style("stroke-width", this.INIT_LINK_WIDTH)
                .attr("marker-end", function () {
                    return "url(#marker)";
                });
            this.joins.link.exit().remove();

            this.joins.linkLabelsShadow = this.groups.linkLabelsShadow.selectAll("text").data(this.forceLayout.links());
            this.joins.linkLabelsShadow
                .enter()
                .append("text")
                .append("textPath")
                .attr("class", "link-label-shadow-path")
                .attr("startOffset", "50%")
                .attr("text-anchor", "middle")
                .style("stroke", "#fff")
                .style("stroke-opacity", 0.8)
                .style("font-family", "Arial")
                .style("stroke-width", this.SHADOWSIZE)
                .style("font-size", this.FONTSIZE)
                .append("svg:tspan")
                .attr("class", "link-label-shadow")
                .attr("dy", "-2");
            this.joins.linkLabelsShadow
                .select('.link-label-shadow-path')
                .attr("xlink:href", function (d) {
                    return "#" + getLinkID(d);
                });
            this.joins.linkLabelsShadow
                .select('.link-label-shadow')
                .text(function (d) {
                    return d.label;
                });
            this.joins.linkLabelsShadow.exit().remove();

            this.joins.linkLabelsText = this.groups.linkLabelsText.selectAll("text").data(this.forceLayout.links());
            this.joins.linkLabelsText
                .enter()
                .append("text")
                .append("textPath")
                .attr('class', 'link-label-text-path')
                .attr("startOffset", "50%")
                .attr("text-anchor", "middle")
                .style("fill", "#000")
                .style("font-family", "Arial")
                .style("font-size", this.FONTSIZE)
                .append("svg:tspan")
                .attr("class", "link-label-text")
                .attr("dy", "-2");
            this.joins.linkLabelsText
                .select('.link-label-text-path')
                .attr("xlink:href", function (d) {
                    return "#" + getLinkID(d)
                });
            this.joins.linkLabelsText
                .select('.link-label-text')
                .text(function (d) {
                    return d.label;
                });
            this.joins.linkLabelsText.exit().remove();

            this.joins.circles = this.groups.circles.selectAll("circle")
                .data(this.forceLayout.nodes(), function (d) {
                    return d.id;
                });
            this.joins.circles
                .enter()
                .append("svg:circle")
                .attr("r", 6)
                .attr("class", function (d) {
                    var r = "";
                    if (d.start) {
                        r += "start-node ";
                    }
                    if (d.end) {
                        r += "end-node";
                    }
                    return r;
                })
                .call(this.forceLayout.drag)
                .on("mousedown", function () {
                    d3.event.stopPropagation();
                });
            this.joins.circles.exit().remove();

            this.joins.text = this.groups.text.selectAll("g").data(this.forceLayout.nodes());

            let text = this.joins.text.enter().append("svg:g");
            this.joins.text.exit().remove();

            // A copy of the text with a thick white stroke for legibility.
            text.append("svg:text")
                .attr("x", 8)
                .attr("y", ".31em")
                .attr("class", "shadow")
                .style("font-size", this.FONTSIZE)
                .style("stroke-width", this.SHADOWSIZE);

            text.append("svg:text")
                .attr("x", 8)
                .attr("y", ".31em")
                .attr("class", "node_label")
                .style("font-size", this.FONTSIZE);

            let howToText = this.joins.text.selectAll("text").data(function (d) {
                return [d, d];
            });
            howToText.text(function (d) {
                return d.label;
            });

            this.zoomed();

            let cls = this;
            $(this.nodes).each(function (idx, node) {
                if (node.x === undefined) {
                    node.x = Math.floor(Math.random() * cls.width());
                    node.y = Math.floor(Math.random() * cls.height());
                }
            });

            this.forceLayout.charge(-2000).start();

            this.fixOrReleaseNodes(); // fixes all node positions if layout is paused
        },

        resize: function (size) {
            this.forceLayout.size(size);
            this.start();
        },

        fixOrReleaseNodes: function () {
            this.joins.circles.each(function (d) {
                d.fixed = this.paused;
            });
        },

        resume: function () {
            this.paused = false;
            this.fixOrReleaseNodes();
        },

        pause: function () {
            this.paused = true;
            this.fixOrReleaseNodes();
        },

        // Use elliptical arc path segments to doubly-encode directionality.
        tick: function () {
            function arcPath(leftHand, d) {
                let start = leftHand ? d.source : d.target;
                let c = d.count;
                let end = leftHand ? d.target : d.source;
                let dx = end.x - start.x;
                let dy = end.y - start.y;
                let sweep = leftHand ? 1 : 0;

                if (dx != 0 || dy != 0) {
                    sweep = (sweep + d.inverse) % 2;
                    if ((c - 1) % 2) {
                        sweep = (!sweep) * 1;
                    }
                    let h = Math.floor(c / 2) * 20;

                    let norm = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    let vcx, vcy;
                    if (!sweep) {
                        vcx = dy / norm;
                        vcy = -dx / norm;
                    } else {
                        vcx = -dy / norm;
                        vcy = dx / norm;
                    }
                    let cx = dx / 2 + vcx * h;
                    let cy = dy / 2 + vcy * h;

                    return "M" + start.x + "," + start.y + "q" + cx + ","
                        + cy + " " + dx + "," + dy;
                } else {
                    // self edge
                    // Fiddle with this angle to get loop oriented.
                    let xRotation = 90;
                    // Needs to be 1.
                    let largeArc = 1;
                    // Change sweep to change orientation of loop.
                    sweep = 1;
                    // Make drx and dry different to get an ellipse
                    // instead of a circle.
                    let drx = 20;
                    let dry = 30;
                    let x1 = start.x;
                    let y1 = start.y;
                    // For whatever reason the arc collapses to a point if the beginning
                    // and ending points of the arc are the same, so kludge it.
                    let x2 = end.x + 1;
                    let y2 = end.y + 1;
                    return "M" + x1 + "," + y1 + "A" + drx + ","
                        + dry + " " + xRotation + "," + largeArc + ","
                        + sweep + " " + x2 + "," + y2;
                }
            }

            d3.select(this.canvasSelector).selectAll(".link").attr("d", function (d) {
                return arcPath(true, d);
            });

            d3.select(this.canvasSelector).selectAll(".link-text-path").attr("d", function (d) {
                return arcPath(d.source.x < d.target.x, d);
            });

            this.joins.circles.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            this.joins.text.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        },

        lastTranslate: null,
        lastScale: null,

        zoomed: function () {
            if (d3.event != null) {
                this.lastTranslate = d3.event.translate;
                this.lastScale = d3.event.scale;
            }

            if (this.lastScale == null || this.lastTranslate == null) {
                return;
            }

            let translate = this.lastTranslate;
            let scale = this.lastScale;

            let scaleText = true;
            let scaleMarker = true;

            this.container.attr("transform", "translate(" + translate + ")scale(" +
                scale + ")");

            let textScale = scaleText ? 1 : scale;
            this.joins.text.selectAll("text").style("font-size", (this.FONTSIZE / textScale) + "px");
            this.joins.text.selectAll(".shadow").style("stroke-width",
                this.SHADOWSIZE / textScale + "px");
            d3.selectAll(".link-label-shadow")
                .style("stroke-width", this.SHADOWSIZE / textScale + "px")
                .style("font-size", this.FONTSIZE / textScale + "px");
            d3.selectAll(".link-label-text").style("font-size",
                this.FONTSIZE / textScale + "px");

            let markerScale = scaleMarker ? 1 : scale;
            d3.select("#marker").attr("markerWidth", 5 / markerScale);
            d3.select("#marker").attr("markerHeight", 5 / markerScale);
            d3.select("#marker").attr("refX", 13.77777778 * markerScale + 6.222222222);

            d3.selectAll(".link").style("stroke-width", (this.INIT_LINK_WIDTH / scale) + "px")
        },

        paused: false,

        dragStarted: function () {
            d3.select(this).classed("dragging", true);
        },

        dragged: function (d) {
            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        },

        dragEnded: function () {
            d3.select(this).classed("dragging", false);
        },


        updatePattern: function (pattern) {
            function calcSourceAndTarget(nodes, links) {
                let nodeDict = {};
                for (let i = 0; i < nodes.length; i++) {
                    nodeDict[nodes[i]["id"]] = nodes[i];
                }
                for (let j = 0; j < links.length; j++) {
                    let link = links[j];
                    link["source"] = nodeDict[link["from"]];
                    link["target"] = nodeDict[link["to"]];
                }
            }

            let newLinks = pattern["links"];
            let newNodes = pattern["nodes"];
            let newLinksDict = {};
            let newNodesDict = {};
            for (let i = 0; i < newLinks.length; i++) {
                newLinksDict[newLinks[i]["id"]] = i;
            }
            for (let i = 0; i < newNodes.length; i++) {
                newNodesDict[newNodes[i]["id"]] = i;
            }

            for (let i = 0; i < this.links.length; i++) {
                // link is to be deleted
                this.links.splice(i, 1);
                i--;
            }
            // now add new links
            for (let key in newLinksDict) {
                this.links.push(newLinks[newLinksDict[key]]);
            }

            for (let i = 0; i < this.nodes.length; i++) {
                if (typeof newNodesDict[this.nodes[i]["id"]] == 'undefined') {
                    // node is to be deleted
                    this.nodes.splice(i, 1);
                    i--;
                } else {
                    // node exists => throw out of newNodesDict (keeping node as is)
                    delete newNodesDict[this.nodes[i]["id"]];
                }
            }
            // now add new nodes
            for (let key in newNodesDict) {
                this.nodes.push(newNodes[newNodesDict[key]]);
            }
            calcSourceAndTarget(this.nodes, this.links);
        },


        reset: function () {
            $(this.canvasSelector).html("");
            if ("forceLayout" in this) {
                this.forceLayout.stop();
            }
            delete this.forceLayout;
            delete this.groups;
            delete this.joins;
            this.nodes = [];
            this.links = [];
        }
    },

    _patternFromTriples: function (triples, idSuffix) {
        idSuffix = idSuffix || "";
        let links = [];
        let nodes = [];
        for (let i = 0; i < triples.length; i++) {
            links.push(triples[i]);
            for (let j = 0; j < 3; j += 2) {
                if ($.inArray(triples[i][j], nodes) < 0) nodes.push(triples[i][j]);
            }
        }
        let pattern = {
            nodes: [],
            links: []
        };
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            pattern.nodes.push({
                end: node == "?target",
                start: node == "?source",
                id: node + idSuffix,
                label: node
            });
        }
        for (let i = 0; i < links.length; i++) {
            let s = links[i][0];
            let p = links[i][1];
            let o = links[i][2];
            pattern.links.push({
                from: s + idSuffix,
                to: o + idSuffix,
                label: p,
                id: btoa(s) + '#' + btoa(p) + '#' + btoa(o) + idSuffix
            });
        }

        let set = {};
        for (let j = 0; j < pattern.links.length; j++) {
            let link = pattern.links[j];
            let source = link["from"];
            let target = link["to"];
            let key1 = [source, target];
            let key2 = [target, source];
            if (key1 in set) {
                set[key1] += 1;
                link["count"] = set[key1];
                link["inverse"] = false;
            } else if (key2 in set) {
                set[key2] += 1;
                link["count"] = set[key2];
                link["inverse"] = true;
            } else {
                set[key1] = 1;
                link["count"] = 1;
                link["inverse"] = false;
            }
        }
        return pattern;
    },

    _newGraphView: function () {
        // https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
        function clone(obj) {
            let copy;

            // Handle the 3 simple types, and null or undefined
            if (null == obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                copy = [];
                for (let i = 0, len = obj.length; i < len; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                copy = {};
                for (let attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        }

        return clone(this.GraphView);
    },

    _graphViews: {},

    draw: function (canvasId, triples) {
        try {
            triples = triples || JSON.parse(atob($('#' + canvasId).attr("data-triples")));
        } catch (SyntaxError) {
            return;
        }
        let graphView;
        let newGV = false;
        if (!this._graphViews.hasOwnProperty(canvasId)) {
            graphView = this._newGraphView();
            newGV = true;
        } else {
            graphView = this._graphViews[canvasId];
        }
        graphView.init(canvasId);
        let pattern = this._patternFromTriples(triples, canvasId);
        graphView.updatePattern(pattern);
        graphView.start();
        this._graphViews[canvasId] = graphView;
    },

    undraw: function (canvasId) {
        if (canvasId in this._graphViews) {
            this._graphViews[canvasId].reset();
        }
    }
};


