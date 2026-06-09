"""
Shared builders for experience notebooks.

Single source of truth = a JSON spec (charts/data/*.json). `bake.py` loads a
spec and calls build_notebook() to produce a .ipynb whose cells carry
PRE-BAKED outputs (the site's NotebookRenderer is static).

Charts:
  1. Radar   (Plotly polar)      — skill-axis intensity 0-10.
  2. Bubble  (D3 flat pack)      — system clusters, size = implementation
                                   strength, label = system name inside,
                                   color = domain on the brand ramp.
     (1 + 2 share one row / one iframe via a flex container.)
  3. Network (D3 force, drag)    — systems <-> tools; systems colored by domain
                                   ramp, tools uniform grey, no labels/legend.

Palette rule: ALL color comes from the brand ramp pink -> light grey -> green.
Domains map onto the ramp by their order in spec["domain_colors"].
"""

import json
import plotly.graph_objects as go

# ---- brand ramp: pink -> light grey -> green (5 anchors) ----
_RAMP = [
    (221, 0, 119),    # #dd0077 pink
    (201, 138, 160),  # #c98aa0
    (184, 184, 184),  # #b8b8b8 light grey
    (136, 192, 180),  # #88c0b4
    (78, 201, 176),   # #4ec9b0 green
]
TOOL_GREY = "#6e6e6e"


def _lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _ramp_color(t):
    segs = len(_RAMP) - 1
    pos = max(0.0, min(1.0, t)) * segs
    i = min(int(pos), segs - 1)
    r, g, b = _lerp(_RAMP[i], _RAMP[i + 1], pos - i)
    return f"#{r:02x}{g:02x}{b:02x}"


def domain_ramp(domains):
    """Map domains (in given order) onto the brand ramp -> {domain: hex}."""
    n = len(domains)
    if n == 1:
        return {domains[0]: _ramp_color(0)}
    return {d: _ramp_color(i / (n - 1)) for i, d in enumerate(domains)}


# ---------------------------------------------------------------- nbformat cells
def md_cell(source):
    return {"cell_type": "markdown", "metadata": {},
            "source": source.splitlines(keepends=True)}


def code_cell(source, outputs=None, ec=None):
    return {"cell_type": "code", "execution_count": ec, "metadata": {},
            "outputs": outputs or [], "source": source.splitlines(keepends=True)}


def _display_html(html):
    return {"output_type": "display_data", "metadata": {},
            "data": {"text/html": html.splitlines(keepends=True)}}


def _execresult_html(html, ec):
    return {"output_type": "execute_result", "execution_count": ec, "metadata": {},
            "data": {"text/html": html.splitlines(keepends=True),
                     "text/plain": ["<rendered>"]}}


# ---------------------------------------------------------------- radar (plotly)
def _radar_fragment(radar):
    axes = list(radar.keys())
    vals = list(radar.values())
    cats = axes + [axes[0]]
    rs = vals + [vals[0]]
    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=rs, theta=cats, fill="toself", line=dict(color="#dd0077"),
        fillcolor="rgba(221,0,119,0.25)",
        hovertemplate="%{theta}: %{r}<extra></extra>"))
    fig.update_layout(
        title=dict(text="Skill Intensity", x=0.5, font=dict(size=14)),
        template="plotly_dark", paper_bgcolor="#111",
        font=dict(color="#e5e5e5", size=11),
        polar=dict(bgcolor="#111", radialaxis=dict(
            visible=True, range=[0, 10], tickfont=dict(size=9),
            angle=90, tickangle=90), angularaxis=dict(tickfont=dict(size=9.5))),
        showlegend=False, height=500, margin=dict(l=72, r=72, t=70, b=60))
    return fig.to_html(include_plotlyjs="cdn", full_html=False,
                       div_id="radar", default_width="100%",
                       default_height="500px")


# ---------------------------------------------------------------- bubble (d3 pack)
_PACK_TEMPLATE = """
<div style="text-align:center;color:#e5e5e5;font-size:14px;padding:14px 0 10px;">Implementation Strength by System</div>
<svg id="pack-svg" style="display:block;width:100%;height:500px" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet"></svg>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
(function start(){
  // Wait until d3 (loaded from the CDN <script> above) is available.
  // On remounted srcdoc iframes the external script can resolve after this
  // inline script first runs, so poll instead of assuming d3 is ready.
  if (typeof d3 === "undefined") { return setTimeout(start, 30); }
  var DATA=__DATA__, W=500, H=500;
  var svg=d3.select("#pack-svg");
  var root=d3.hierarchy(DATA).sum(function(d){return d.val||0;}).sort(function(a,b){return b.value-a.value;});
  d3.pack().size([W-12,H-12]).padding(5)(root);
  var g=svg.append("g").attr("transform","translate(6,6)");
  function ink(hex){var c=hex.replace('#','');var r=parseInt(c.substr(0,2),16),
    gg=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);
    return (0.299*r+0.587*gg+0.114*b)>150?"#111":"#fff";}
  var leaf=g.selectAll("g.leaf").data(root.leaves()).enter().append("g")
    .attr("transform",function(d){return "translate("+d.x+","+d.y+")";});
  leaf.append("title").text(function(d){return d.data.label+" — strength "+d.data.strength;});
  leaf.append("circle").attr("r",function(d){return d.r;})
    .attr("fill",function(d){return d.data.color;}).attr("fill-opacity",0.92)
    .attr("stroke","#111").attr("stroke-width",2);
  leaf.each(function(d){
    if(d.r<22) return;
    var words=d.data.label.split(/\\s+/);
    var fs=Math.max(9,Math.min(14,d.r/3.4));
    var t=d3.select(this).append("text").attr("text-anchor","middle")
      .attr("fill",ink(d.data.color)).attr("font-size",fs+"px")
      .attr("font-weight","600").style("pointer-events","none");
    var n=words.length, lh=1.05, start=-(n-1)/2*lh;
    words.forEach(function(w,i){t.append("tspan").attr("x",0).attr("dy",(i===0?start:lh)+"em").text(w);});
  });
})();
</script>
"""


def _bubble_fragment(bubble, domain_map):
    pts = bubble["points"]
    leaves = []
    for p in pts:
        s = p["implementation_strength"]
        leaves.append({
            "label": p["system"], "strength": s,
            "val": round(s ** 6, 1),  # amplify tight band so sizes differ
            "color": domain_map.get(p["domain"], "#888"),
        })
    data = {"name": "root", "children": leaves}
    return _PACK_TEMPLATE.replace("__DATA__", json.dumps(data))


def build_radar_bubble_html(radar, bubble, domain_map):
    """Radar (Plotly) | Bubble pack (D3) side by side in one iframe."""
    left = _radar_fragment(radar)
    right = _bubble_fragment(bubble, domain_map)
    return (
        '<div style="display:flex;flex-wrap:wrap;gap:18px;background:#111;'
        'border-radius:8px;padding:16px 18px 18px;">'
        '<div style="flex:1 1 390px;min-width:330px;">' + left + '</div>'
        '<div style="flex:1 1 390px;min-width:330px;">' + right + '</div>'
        '</div>'
    )


# ---------------------------------------------------------------- network (bipartite)
# Concepts (left column, colored by domain on the brand ramp) wired to the tools
# (right column, neutral grey) that implement them. Node radius = weighted
# degree, edge width = weight. Hover a node to highlight its connections.
_NETWORK_TEMPLATE = """
<div id="net-wrap" style="position:relative;width:100%;background:#111;border-radius:8px;font-family:-apple-system,Segoe UI,sans-serif;">
  <div style="color:#e5e5e5;font-size:15px;text-align:center;padding:22px 0 8px;">__TITLE__</div>
  <div style="color:#8a8a8a;font-size:11px;text-align:center;padding-bottom:18px;">__DESC__</div>
  <svg id="net-svg" style="display:block;width:100%;height:820px" viewBox="0 0 980 820" preserveAspectRatio="xMidYMid meet"></svg>
  <div id="net-tip" style="position:absolute;pointer-events:none;opacity:0;background:#1c1c1c;border:1px solid #333;border-radius:8px;padding:8px 10px;color:#e5e5e5;font-size:12px;max-width:240px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.5);z-index:10;"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
(function start(){
  // Wait until d3 (loaded from the CDN <script> above) is available.
  // On remounted srcdoc iframes the external script can resolve after this
  // inline script first runs, so poll instead of assuming d3 is ready.
  if (typeof d3 === "undefined") { return setTimeout(start, 30); }
  var NODES=__NODES__, EDGES=__EDGES__;
  var svg=d3.select("#net-svg"), tip=d3.select("#net-tip"), wrap=document.getElementById("net-wrap");
  var pos={}; NODES.forEach(function(n){ pos[n.id]=n; });
  var adj={}; NODES.forEach(function(n){ adj[n.id]={}; });
  EDGES.forEach(function(e){ adj[e.source][e.target]=1; adj[e.target][e.source]=1; });

  var g=svg.append("g");

  // edges as horizontal cubic curves, width = weight
  var edge=g.append("g").selectAll("path").data(EDGES).enter().append("path")
    .attr("fill","none").attr("stroke","#666")
    .attr("stroke-opacity",function(d){return 0.18+d.weight*0.06;})
    .attr("stroke-width",function(d){return d.weight;})
    .attr("d",function(d){
      var s=pos[d.source], t=pos[d.target], mx=(s.x+t.x)/2;
      return "M"+s.x+","+s.y+" C"+mx+","+s.y+" "+mx+","+t.y+" "+t.x+","+t.y;
    });

  var node=g.append("g").selectAll("g.node").data(NODES).enter().append("g")
    .attr("transform",function(d){return "translate("+d.x+","+d.y+")";})
    .style("cursor","default")
    .on("mousemove",function(ev,d){
      var b=wrap.getBoundingClientRect();
      var meta=(d.type==="tool")?("tool · "+d.category):(d.type+" · "+d.domain);
      tip.style("opacity",1).style("left",(ev.clientX-b.left+12)+"px").style("top",(ev.clientY-b.top+12)+"px")
         .html("<b>"+d.id+"</b><br><span style='color:#9a9a9a'>"+meta+"</span>");
      edge.attr("stroke-opacity",function(e){return (e.source===d.id||e.target===d.id)?0.85:0.04;})
          .attr("stroke",function(e){return (e.source===d.id||e.target===d.id)?"#dd0077":"#666";});
      node.attr("opacity",function(n){return (n.id===d.id||adj[d.id][n.id])?1:0.25;});
    })
    .on("mouseleave",function(){
      tip.style("opacity",0);
      edge.attr("stroke-opacity",function(d){return 0.18+d.weight*0.06;}).attr("stroke","#666");
      node.attr("opacity",1);
    });

  node.append("circle").attr("r",function(d){return d.r;})
    .attr("fill",function(d){return d.color;})
    .attr("fill-opacity",function(d){return d.type==="tool"?0.85:0.92;})
    .attr("stroke","#111").attr("stroke-width",function(d){return d.type==="tool"?1.2:2;});

  // labels: systems -> left, tools -> right, concepts (middle) -> above
  node.append("text").text(function(d){return d.id;})
    .attr("text-anchor",function(d){return d.type==="system"?"end":(d.type==="tool"?"start":"middle");})
    .attr("x",function(d){return d.type==="system"?-(d.r+7):(d.type==="tool"?(d.r+7):0);})
    .attr("dy",function(d){return d.type==="concept"?-(d.r+5):4;})
    .attr("fill","#cfcfcf").attr("font-size","10.5px")
    .attr("font-weight",function(d){return d.type==="tool"?"400":"600";})
    .style("pointer-events","none");

  // column captions, one per present column
  var cols={}; NODES.forEach(function(n){ if(!(n.type in cols)) cols[n.type]=n.x; });
  var CAP={system:"SYSTEMS",concept:"CONCEPTS",tool:"TOOLS"};
  Object.keys(cols).forEach(function(t){
    g.append("text").attr("x",cols[t]).attr("y",26).attr("text-anchor","middle")
      .attr("fill","#777").attr("font-size","11px").attr("font-weight","600").text(CAP[t]||t);
  });
})();
</script>
"""


def _ink_on(hex_color):
    c = hex_color.lstrip("#")
    r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    return "#111" if (0.299 * r + 0.587 * g + 0.114 * b) > 150 else "#fff"


def build_network_html(network, domain_map):
    nodes_in = network["nodes"]
    edges = network["edges"]

    systems = [n for n in nodes_in if n["type"] == "system"]
    concepts = [n for n in nodes_in if n["type"] == "concept"]
    tools = [n for n in nodes_in if n["type"] == "tool"]

    # weighted degree -> radius
    deg = {}
    for e in edges:
        deg[e["source"]] = deg.get(e["source"], 0) + e["weight"]
        deg[e["target"]] = deg.get(e["target"], 0) + e["weight"]
    dmin = min(deg.values()) if deg else 0
    dmax = max(deg.values()) if deg else 1

    def radius(nid):
        if dmax == dmin:
            return 16.0
        return round(11 + (deg.get(nid, 0) - dmin) / (dmax - dmin) * 15, 1)

    H = 820
    top, bot = 86, 58
    # three columns when systems present: systems | concepts | tools
    if systems:
        SYSTEM_X, CONCEPT_X, TOOL_X = 150, 490, 830
    else:
        SYSTEM_X, CONCEPT_X, TOOL_X = None, 320, 660

    def column(items, x):
        out = []
        n = len(items)
        for i, it in enumerate(items):
            y = top + (i + 0.5) * (H - top - bot) / n
            out.append((it, x, y))
        return out

    nodes = []
    if systems:
        for it, x, y in column(systems, SYSTEM_X):
            col = domain_map.get(it["domain"], "#888")
            nodes.append({"id": it["id"], "type": "system", "domain": it["domain"],
                          "color": col, "x": x, "y": round(y, 1), "r": radius(it["id"])})
    for it, x, y in column(concepts, CONCEPT_X):
        col = domain_map.get(it["domain"], "#888")
        nodes.append({"id": it["id"], "type": "concept", "domain": it["domain"],
                      "color": col, "x": x, "y": round(y, 1), "r": radius(it["id"])})
    for it, x, y in column(tools, TOOL_X):
        nodes.append({"id": it["id"], "type": "tool", "category": it["category"],
                      "color": TOOL_GREY, "x": x, "y": round(y, 1), "r": radius(it["id"])})

    title = network.get("title", "Technology Capability Network")
    desc = network.get("description", "")
    return (_NETWORK_TEMPLATE
            .replace("__NODES__", json.dumps(nodes))
            .replace("__EDGES__", json.dumps(edges))
            .replace("__TITLE__", title)
            .replace("__DESC__", desc))


# ---------------------------------------------------------------- outcomes
import pandas as pd  # noqa: E402


def build_outcomes_html(outcomes):
    return pd.DataFrame(outcomes.items(), columns=["Metric", "Value"]).to_html(
        index=False, border=0)


# ---------------------------------------------------------------- notebook
def build_notebook(spec):
    domain_map = domain_ramp(list(spec["domain_colors"].keys()))
    cells = [
        md_cell(spec["hero"]),
        code_cell(
            "# Radar (skill intensity) + Bubble cluster (implementation strength).\nfig",
            [_display_html(build_radar_bubble_html(
                spec["radar"], spec["bubble_chart"], domain_map))], 1),
        code_cell(
            "# Technology Capability Network — concepts ↔ tools (bipartite, D3).",
            [_display_html(build_network_html(
                spec["network_graph"], domain_map))], 2),
        code_cell(
            "outcomes = " + json.dumps(spec["outcomes"], indent=4) + "\n\n"
            "pd.DataFrame(outcomes.items(), columns=[\"Metric\", \"Value\"])",
            [_execresult_html(build_outcomes_html(spec["outcomes"]), 3)], 3),
        md_cell(spec["storyline"]),
    ]
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.11"},
        },
        "nbformat": 4, "nbformat_minor": 5,
    }
