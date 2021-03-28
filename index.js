import {App} from "./app/js/classes/app.js"


let svg= document.querySelector("[id=svg-main]");
// svg.setAttribute("width", 1000);
// svg.setAttribute("height", 1000);

let menu_elem= document.getElementById("context-menu")

let history_elem= document.getElementById("command-history")
let redo_list= document.getElementById("redo-list")
let undo_list= document.getElementById("undo-list")

// let points= [[250,300], [100,200], [100,400]]
let contours= [
    [[100,100], [100,200], [200,200], [200,100]],
    [[200,300], [200,400], [100,400], [100,300]],
    // [...Array(3).keys()].map(_ => [Math.random()*300 +300, Math.random()*300 +200]),
]

let app= new App({
    svg:svg, menu_elem:menu_elem,
    history_elem:history_elem, redo_list_elem:redo_list, undo_list_elem: undo_list,
})
contours.forEach(c => app.addContour(c, {has_head_marker:true}))

app.reset()