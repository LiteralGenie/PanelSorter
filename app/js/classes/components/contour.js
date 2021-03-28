import {create_svg_elem} from "../../utils/misc_utils.js"
import {get_center} from "../../utils/contour_utils.js"
import {Segment} from "./segment.js"
import {Point} from "./point.js"
import {CenterPoint} from "./center_point.js"
import {ContourManager} from "./contour_manager.js"


class Contour {
    constructor(points, {
		svg=null, parent=null, has_head_marker=false, is_closed=true
	}={}) {
		// inits
		this.svg= svg
		this.parent= parent
		this.has_head_marker= has_head_marker

		// create svg groups
		this.html_elem= create_svg_elem("g")
		this.html_elem.classList.add("contour")

		this.seg_group= create_svg_elem("g")
		this.pt_group= create_svg_elem("g")

		// points
		this.points= points.map(pt => new Point(pt, {svg:svg, parent:this}))

		// center
        this.center= new CenterPoint(get_center(points), {svg:svg, draggable:false, parent:this})
		this.center.html_elem.classList.add("center")
		this.html_elem.append(this.center.html_elem)

		// line segments
		this.segments= []
		let tmp= (is_closed ? points.length : points.length-1)
		for(let i=0; i<tmp; i++){
			let start= points[i]
			let end= points[ (i+1)%this.points.length ]
			this.segments.push(new Segment(start, end, {svg:svg, parent:this, has_head_marker:has_head_marker}))
		}

		// manages operations on points / segments
		// eg deleting segment should also alter relevant points
		this.manager= new ContourManager(this)

		// draw
		this.redraw()
	}

	appendTo(elem){
		elem.append(this.html_elem)
	}

	// removes DOM elements for removed segment / points and adds DOM elements for new ones
	redraw(){
    	this.seg_group.remove()
		this.seg_group= create_svg_elem("g")
		this.seg_group.classList.add("seg-group")
		this.segments.forEach(seg => seg.appendTo(this.seg_group))
		this.html_elem.append(this.seg_group)

		this.pt_group.remove()
		this.pt_group= create_svg_elem("g")
		this.pt_group.classList.add("point-group")
		this.points.forEach(pt => pt.appendTo(this.pt_group))
		this.html_elem.append(this.pt_group)

		let center_loc= get_center(this.points.map(pt => pt.loc))
		this.center.moveTo(center_loc)
	}
}


export {
	Contour,
}