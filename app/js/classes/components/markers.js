import {create_svg_elem, get_global_css_prop} from "../../utils/misc_utils.js"


class HeadMarker {
    constructor(point, angle, {visible=true}={}) {
        // inits
        this._point= point
        this._angle= angle

        this.html_elem = create_svg_elem("g")
        this.inner= create_svg_elem("path")
        this.outer= create_svg_elem("path")

        this.visible= visible
        this.enlarge= false

        this.transforms= {}

        // create marker path -- isoceles triangle with vertex touching origin (0deg; (0,0))
        let tmp= Math.trunc(1000 * Math.sqrt(3) / 2) / 1000
        this.base_path= [[-tmp,-0.5], [-tmp,0.5], [0,0]]

        // draw
        this.update_transforms()
        this.redraw()

        // add to html
        this.html_elem.classList.add("marker", "head")
        this.outer.classList.add("outer-head")
        this.inner.classList.add("inner-head")

        this.html_elem.append(this.inner)
        this.html_elem.append(this.outer)
    }

    redraw() {
        // draw inner
        let s_i= d3.select(this.inner)
        s_i.attr("d", d3.line()(this.base_path) + "z")
            .attr("transform", `${this.getTransforms(HeadMarker._INNER)}`)
            .attr("vector-effect", "non-scaling-stroke")

        // draw outer
        let s_o= d3.select(this.outer)
        let copied= ["d", "vector-effect"]

        copied.forEach(x => s_o.attr(x, s_i.attr(x))) // copy attribute from inner
        s_o.attr("transform", `${this.getTransforms(HeadMarker._OUTER)}`)
    }

    // updates (css-linked) transforms
    update_transforms() {
        // scale
        this.inner_scale= get_global_css_prop("arrow-scale")
        this.outer_scale= get_global_css_prop("arrow-scale-enlarged")

        // move to prevent overlap with vertex
        let offset= get_global_css_prop("vertex-radius", parseInt) + 0.5*get_global_css_prop("global-stroke", parseInt)
        this.translate_1= offset

        // angle
        this.angle= this._angle

        // move to target point
        this.point= this._point
    }

    getTransforms(type) {
        // inits
        let t= this.transforms
        let scale

        // scale
        if(type === HeadMarker._INNER) {
            scale= this._inner_scale
        }
        if(type === HeadMarker._OUTER) {
            scale= this._outer_scale
        }

        // return
        return `${t['translate_2']} ${t['rotate']} ${t['translate_1']} scale(${scale})`
    }

    // enlarge arrowhead
    set inner_scale(val) {
        this._inner_scale= val
        // this.transforms['scale']= `scale(${val})`
    }

    set outer_scale(val) {
        this._outer_scale= val
        // this.transforms['scale']= `scale(${val})`
    }

    set angle(val) {
        this._angle= val // degrees
        this.transforms['rotate']= `rotate(${this._angle}, 0,0)`
    }

    // prevents overlap with vertex
    set translate_1(val) {
        this.transforms['translate_1']= `translate(${-1 * val})`
    }

    set point(val) {
        this.transforms['translate_2']= `translate(${val[0]},${val[1]})`
    }

    set visible(val) {
        this._visible= val
        this.inner.style.opacity= +Boolean(val)
    }

    set enlarge(val) {
        this.outer.style.opacity= +Boolean(val) & +Boolean(this._visible)
    }

    appendTo(elem){
        elem.append(this.html_elem);
    }
}

HeadMarker._INNER= 0
HeadMarker._OUTER= 1


export {
    HeadMarker,
}