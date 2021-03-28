import {Segment} from "./segment.js"
import {Point} from "./point.js"
import {apply_elem_op, get_center, get_nearest_point} from "../../utils/contour_utils.js"
import * as events from "../../events.js"

//todo: truly invertible edits

/* Performs operations on points / segments */
class ContourManager {
	constructor(contour) {
		this.contour= contour

		this.points= contour.points
		this.segments= contour.segments
		this.center= contour.center
		this.svg= contour.svg
	}


	//// --- HELPER FUNCTIONS --- ////

	get closed() {
		let l1= this.points.length
		let l2= this.segments.length

		console.assert(Math.abs(l1-l2) <= 1) // 0 if closed, else 1 if open
		return l1 === l2
	}

	// get endpoints of each segment
	get point_map() {
		let map= new Map();

		this.segments.forEach(function(seg,i) {
			let j= (i+1) % this.points.length
			map.set(seg, [this.points[i], this.points[j]])
		}.bind(this))

		return map
	}

	// get connected segments for each point
	get segment_map(){
		// inits
		let map= new Map()
		this.points.forEach(pt => map.set(pt,[]));

		// loop segments
		this.segments.forEach(function(seg,i) {
			let j= (i+1) % this.segments.length
			map.get(this.points[i]).push(seg)
			map.get(this.points[j]).push(seg)
		}.bind(this))

		return map
	}

	update_center() {
		let pts= this.points.map(p => p.loc)
		this.center.moveTo(get_center(pts))
	}


	//// --- EDIT FUNCTIONS --- ////

	// move point and connected segments
	movePoint(point, new_loc) {
		// inits
        let connected= this.segment_map.get(point)
		console.assert(connected.length > 0)
        // move segments
        connected.forEach(seg => {
        	if(seg.start === point.loc) {
				seg.moveTo(new_loc, seg.end)
			}
        	else {
        		seg.moveTo(seg.start, new_loc)
			}
		})

		// move point
		point.moveTo(new_loc)

		// move center
		this.update_center()
	}

	// break a segment [start, end] into two segments [start, loc] [loc, end]
	breakSegment(loc, seg, {sticky=true}={}) {
	    // inits
        let seg_ind= this.segments.indexOf(seg)
		let [start,end]= [seg.start, seg.end]

	    // new point
        let new_pt
        if(sticky) loc= get_nearest_point(loc, [start,end]) // snap to grid
		new_pt= new Point(loc, {svg:seg.svg, parent:seg.parent})

		// new segments
		let left_seg= new Segment(start, new_pt.loc, {svg:seg.svg, parent:seg.parent})
		let right_seg= new Segment(new_pt.loc, end, {svg:seg.svg, parent:seg.parent})

        // insert point
        this.points.splice(seg_ind+1, 0, new_pt)

        // insert new segments
        this.segments.splice(seg_ind, 1, left_seg) // replace old segment
        this.segments.splice(seg_ind+1, 0, right_seg) // add new segment

		// redraw
		seg.parent.redraw()
		left_seg.html_elem.dispatchEvent(events.newSegment(left_seg))
		right_seg.html_elem.dispatchEvent(events.newSegment(right_seg))
		new_pt.html_elem.dispatchEvent(events.newPoint(new_pt))

		return new_pt
	}

	removePoint(point) {
	    // inits
        let connected= this.segment_map.get(point)
        let n= connected.length
        let pt_ind= this.points.indexOf(point)
        console.assert([1,2].includes(n)) // check either 1 or 2 connected segments

        // remove from segment list
		let seg_removed
        if(n === 1){ // endpoint of contour
            let seg_removed= connected[0]
            let seg_ind= this.segments.indexOf(seg)
            this.segments.splice(seg_ind, 1)
        }
        else if(n === 2){
            let [start,end]= connected

			// flip if necessary
			if(start.end !== point.loc){
				[start,end]= [end,start]
			}

			// extend starting segment (segment that has
			start.moveTo(start.start, end.end)

			// delete ending segment
			let seg_ind= this.segments.indexOf(end)
			this.segments.splice(seg_ind, 1)
			seg_removed= end
        }

        // remove from point list
        this.points.splice(pt_ind, 1)

		// redraw
        point.parent.redraw()

		// return
		return {point: point, segment: seg_removed}
    }

    insertPoint(loc, index) {
		console.log(index)
		if(this.points.length > 0) {
			let prev_ind= (index - 1 + this.points.length) % this.points.length
			let start= this.points[prev_ind].loc
			let new_seg= new Segment(start, loc, {svg: this.svg, parent: this.contour, has_head_marker:this.contour.has_head_marker})

			// modify connected segments
			let is_append= !this.contour.is_closed && index===this.points.length
			if(this.segments.length >= 1 && !is_append) {
				this.segments[prev_ind].moveTo(loc, this.segments[prev_ind].end)
			}

			// todo: this condition wont work
			if (this.segments.length >= 2 && !is_append) {
				this.segments[index].moveTo(this.segments[index].start, loc)
			}

			// insert
			this.segments.splice(index, 0, new_seg)
			new_seg.parent.redraw()
		}

		// create and insert new point
		let new_pt= new Point(loc, {svg:this.svg, parent:this.contour, has_head_marker:this.contour.has_head_marker})
		this.points.splice(index, 0, new_pt)
	}

	// remove segment by combining (averaging) endpoints
	removeSegment(segment) {
	    // inits
	    let [start,end]= [segment.start, segment.end]
        let seg_ind= this.segments.indexOf(segment)
        let n= this.segments.length

        // average start and end points
        let new_loc= apply_elem_op(start, end, (x,y)=>x+y)
        new_loc= new_loc.map(x => x/2)

		// move end point
		let point_map= this.point_map
		point_map.get(segment)[1].moveTo(new_loc)

        // edit left-right segments
        this.segments.forEach(seg => {
            if(seg.start === end) {
				seg.moveTo(new_loc, seg.end)
            }
            else if(seg.end === start) {
				seg.moveTo(seg.start, new_loc)
            }
        })

        // remove current segment
        this.segments.splice(seg_ind, 1)

		// remove start point (maintains mapping of i-th segment has i-th point as startpoint)
        this.points.splice(seg_ind, 1)

		// redraw
		segment.parent.redraw()

		// return
		return segment
    }
}

export {
    ContourManager
}