let svg_ns= "http://www.w3.org/2000/svg";


function create_svg_elem(tag_name) {
	return document.createElementNS(svg_ns, tag_name)
}

function sum_lst(lst) {
	if(lst.length===0) return 0
	return lst.reduce( (total,val) => total+val )
}

function get_global_css_prop(name, parse_func=null) {
	parse_func= parse_func || (str => str)
	if(name.substring(0,2) !== "--") name= `--${name}`

	let val= getComputedStyle(document.body).getPropertyValue(name).trim()
	val= parse_func(val)
	return val
}


export {
    svg_ns,
    create_svg_elem,
	sum_lst,
	get_global_css_prop,
}
