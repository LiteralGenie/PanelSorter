import {sum_lst} from "./misc_utils.js";


function get_rel_coords(point, svg){
	let ctm= svg.getScreenCTM()
	return [
		(point[0] - ctm.e) / ctm.a,
		(point[1] - ctm.f) / ctm.d,
	]
}

// https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
function get_center(pt_list){
	// helper function --- returns list of [x_i,y_i, x_(i+1),y_(i+1)] for each i in range(lst.length)
	let tmp_fn= function(lst){
	   return lst.map( (pt,i,lst) => {
	       let j= (i+1)%lst.length
           let [x1,y1]= pt
           let [x2,y2]= lst[j]

           return [x1,y1,x2,y2]
		})
	}

	// area
	let area= tmp_fn(pt_list).map(c => {
	    let [x1,y1,x2,y2]= c
	    return (x1*y2 - x2*y1)
    })
	area= 0.5 * sum_lst(area) // sum and multiply by 1/2

    // x-coord of center
	let cx= tmp_fn(pt_list).map(c => {
	    let [x1,y1,x2,y2]= c
	    return (x1+x2) * (x1*y2 - x2*y1)
    })
	cx= (1 / (6*area)) * sum_lst(cx)
    cx= Math.abs(cx)

    // y-coord of center
	let cy= tmp_fn(pt_list).map(c => {
	    let [x1,y1,x2,y2]= c
	    return (y1+y2) * (x1*y2 - x2*y1)
    })
	cy= (1 / (6*area)) * sum_lst(cy)
    cy= Math.abs(cy)

	if([cx,cy].includes(Infinity)) return [0,0]
    return [cx, cy]
}

// apply element-wise operation
function apply_elem_op(first, second, op_func){
	let length= Math.min(first.length, second.length)
	return [...Array(length).keys()].map(ind => {
		return op_func(first[ind], second[ind])
	})
}

function l2_dist(p1, p2){
	let ret= apply_elem_op(p1,p2, (x, y) => (x+y)**2) // (x1+y1)^2
	ret= sum_lst(ret)
	ret= ret**0.5
	return ret
}

// get nearest point on vector (relative to segment start)
function get_nearest_point(pt, seg) {
	// inits
	let [start,end]= seg
    let new_pt= [...pt]

	// get vecs relative to start
	let seg_vec= apply_elem_op(end, start, (x,y) => x-y)
	let pt_vec= apply_elem_op(new_pt, start, (x,y) => x-y)

	// get length of projection of pt_vec onto segment --- dot_prod(a,b) / |b|
	let seg_length= l2_dist(seg_vec, [0,0])
	let proj_length= sum_lst(apply_elem_op(seg_vec, pt_vec, (x,y) => x*y))
	proj_length= proj_length / seg_length

	// get real endpoint of projection
	let frac= proj_length / seg_length
	let proj_vec= seg_vec.map(x => x*frac)
	new_pt= apply_elem_op(proj_vec, start, (x,y) => x+y)

    // return
    return new_pt
}

function get_angle(dx,dy, degrees=true) {
	let angle= Math.atan(dy/dx)
	if(dx < 0) {
		angle= angle - Math.PI
	}

	let mult= (degrees? 180/Math.PI : 1)
	return angle * mult
}

export {
    get_rel_coords,
    get_center,
	apply_elem_op,
	l2_dist,
	get_nearest_point,
	get_angle,
}