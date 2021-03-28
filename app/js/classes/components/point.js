import {create_svg_elem} from "../../utils/misc_utils.js"
import {get_rel_coords} from "../../utils/contour_utils.js"
import * as events from "../../events.js"


class Point {
    constructor(loc, {
        svg=null, parent=null,
        draggable=true,
    }={}) {
        // inits
        this.loc= loc
        this.svg= svg
        this.draggable= draggable
        this.parent= parent

        // shapes
        this._initShapes()

        // group for html
        this.html_elem= create_svg_elem("g");
        this.html_elem.classList.add("point")
        this.html_elem.append(this.inner)
        this.html_elem.append(this.outer)
        this.html_elem.append(this.outermost)

        // basic events
        this._initEvents()
    }

    _initShapes() {
        // inner circle (always visible)
        this.inner= create_svg_elem("circle");
        this.inner.classList.add("inner")
        d3.select(this.inner)
            .attr("cx", this.loc[0])
            .attr("cy", this.loc[1])

        // outer circle (visible on hover)
        this.outer= create_svg_elem("circle");
        this.outer.classList.add("outer")
        this.outer.style.opacity= 0;
        d3.select(this.outer)
            .attr("cx", this.loc[0])
            .attr("cy", this.loc[1])

        // outermost (invisible -- for easier mouse events)
        this.outermost= create_svg_elem("circle");
        this.outermost.classList.add("outermost")
        this.outermost.style.opacity= 0;
        d3.select(this.outermost)
            .attr("cx", this.loc[0])
            .attr("cy", this.loc[1])
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

    moveTo(loc=this.loc, {
        transform=false,
        resolution=10
    }={}){
        // inits
        this.loc= loc

        // get rel coords
        if(this.svg !== null && transform){
            this.loc= get_rel_coords(loc, this.svg);
        }

        // move and snap to grid
        let visual_loc= [
            Math.round(this.loc[0]/resolution)*resolution,
            Math.round(this.loc[1]/resolution)*resolution,
        ]
        d3.selectAll([this.inner, this.outer, this.outermost])
            .attr("cx", visual_loc[0])
            .attr("cy", visual_loc[1])
    }

    set enlarge(val) {
        if(val) {
            this.outer.style.opacity = 1
        } else {
            this.outer.style.opacity = 0
        }
    }
}


export {Point}