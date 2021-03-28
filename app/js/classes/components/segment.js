import {create_svg_elem, get_global_css_prop} from "../../utils/misc_utils.js"
import * as events from "../../events.js"
import {apply_elem_op, get_angle} from "../../utils/contour_utils.js"
import {HeadMarker} from "./markers.js"


class Segment {
    // visual attributes should be set at the container level if possible, since segments should come in groups
    constructor(start, end, {
        svg=null, parent=null, has_head_marker=false,
    }={}) {
        // inits
        this.start= start
        this.end= end
        this.svg= svg
        this.parent= parent

        // svg group
        this.html_elem= create_svg_elem("g")
        this.html_elem.classList.add("segment")

        // segments
        this._initShapes()

        // arrowheads
        this.head= new HeadMarker(this.end, this.angle, {visible:has_head_marker})
        this.head.appendTo(this.html_elem)

        // basic events
        this._initEvents()
    }

    _initShapes() {
        // inner (always visible)
        this.inner= create_svg_elem("path")
        this.inner.classList.add("inner")
        d3.select(this.inner)
            .attr("d", d3.line()([this.start, this.end]))

        // outer (visible on hover)
        this.outer= create_svg_elem("path")
        this.outer.classList.add("outer")
        this.outer.style.opacity= 0
        d3.select(this.outer)
            .attr("d", d3.line()([this.start, this.end]))

        // outermost (invisible -- for easier mouse events)
        this.outermost= create_svg_elem("path")
        this.outermost.classList.add("outermost")
        this.outermost.style.opacity= 0
        d3.select(this.outermost)
            .attr("d", d3.line()([this.start, this.end]))

        this.html_elem.append(this.inner)
        this.html_elem.append(this.outer)
        this.html_elem.append(this.outermost)
    }

    _initEvents() {
        // notify right-click
        let right_click= function(e){
            // disable default menu
            e.preventDefault()

            // notify container (contour)
            let event= events.contourRightClick(this, e)
            this.html_elem.dispatchEvent(event)
        }.bind(this)
        this.html_elem.addEventListener("contextmenu", right_click)
    }

    appendTo(elem){
        elem.append(this.html_elem);
    }

    moveTo(start=this.start, end=this.end, {
        transform=false, resolution=10
    }={}){
        // inits
        this.start= start
        this.end= end

        // calculate relative coords
        if(this.svg !== null && transform){
            this.start= get_rel_coords(start, this.svg)
            this.end= get_rel_coords(end, this.svg)
        }

        // snap to grid
        let visual_start= [
            Math.round(this.start[0]/resolution)*resolution,
            Math.round(this.start[1]/resolution)*resolution,
        ]
        let visual_end= [
            Math.round(this.end[0]/resolution)*resolution,
            Math.round(this.end[1]/resolution)*resolution,
        ]

        // move
        d3.selectAll([this.inner, this.outer, this.outermost])
            .attr("d", d3.line()([visual_start, visual_end]))

        this.head.point= visual_end
        this.head.angle= this.angle
        this.head.redraw()
    }

    set enlarge(val) {
        this.head.enlarge= val
        this.outer.style.opacity= +Boolean(val)
    }

    get angle() {
        let [dx,dy]= apply_elem_op(this.end, this.start, (a,b) => a-b)
        return get_angle(dx,dy,true)
    }
}


export {
    Segment
}